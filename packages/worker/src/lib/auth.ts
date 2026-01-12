/**
 * JWT 认证模块
 */

import type { Env } from './env';

const ALGORITHM = 'HS256';
const TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

interface JwtPayload {
  sub: string; // user id
  email: string;
  iat: number;
  exp: number;
}

/**
 * Base64URL 编码
 */
function base64UrlEncode(data: ArrayBuffer | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64URL 解码
 */
function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(padded + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 创建 HMAC 签名
 */
async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return base64UrlEncode(signature);
}

/**
 * 验证 HMAC 签名
 */
async function verify(data: string, signature: string, secret: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const sig = base64UrlDecode(signature);
    return crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(data));
  } catch {
    // 无效的 base64 签名
    return false;
  }
}

/**
 * 生成 JWT Token
 */
export async function generateToken(userId: string, email: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: ALGORITHM, typ: 'JWT' };
  const payload: JwtPayload = {
    sub: userId,
    email,
    iat: now,
    exp: now + TOKEN_EXPIRY,
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(`${headerEncoded}.${payloadEncoded}`, secret);

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * 验证并解析 JWT Token
 */
export async function verifyToken(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [headerEncoded, payloadEncoded, signature] = parts;

  // 验证签名
  const isValid = await verify(`${headerEncoded}.${payloadEncoded}`, signature, secret);
  if (!isValid) {
    return null;
  }

  // 解析 payload
  try {
    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadEncoded));
    const payload = JSON.parse(payloadJson) as JwtPayload;

    // 验证过期时间
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * 从请求中提取用户信息
 */
export async function getUserFromRequest(request: Request, env: Env): Promise<JwtPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  return verifyToken(token, env.JWT_SECRET);
}

/**
 * 认证中间件 - 返回用户信息或错误响应
 */
export async function requireAuth(request: Request, env: Env): Promise<{ user: JwtPayload } | { error: Response }> {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return {
      error: new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return { user };
}
