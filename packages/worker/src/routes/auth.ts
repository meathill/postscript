/**
 * 认证路由
 * POST /api/auth/apple - Apple Sign-In
 * GET /api/auth/me - 获取当前用户
 * POST /api/auth/logout - 登出
 */

import type { User } from '../db/types';
import type { Env } from '../lib/env';
import { generateToken, requireAuth } from '../lib/auth';
import { errorResponse, generateId, jsonResponse, now, parseJsonBody } from '../lib/utils';

interface AppleSignInRequest {
  /** Apple 返回的 identity token */
  identityToken: string;
  /** 用户 email（首次登录时 Apple 提供） */
  email?: string;
  /** 用户全名（首次登录时 Apple 提供） */
  fullName?: {
    givenName?: string;
    familyName?: string;
  };
}

interface AppleTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string; // Apple user ID
  email?: string;
  email_verified?: boolean;
}

/**
 * 解码 JWT 的 payload 部分（不验证签名，仅用于快速提取信息）
 * 注意：生产环境应该验证 Apple 的签名
 */
function decodeJwtPayload(token: string): AppleTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (padded.length % 4)) % 4);
    const decoded = atob(padded + padding);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * 处理 Apple Sign-In
 */
export async function handleAppleSignIn(request: Request, env: Env): Promise<Response> {
  const body = await parseJsonBody<AppleSignInRequest>(request);
  if (!body?.identityToken) {
    return errorResponse('Missing identity token', 400);
  }

  // 解析 Apple identity token
  const applePayload = decodeJwtPayload(body.identityToken);
  if (!applePayload?.sub) {
    return errorResponse('Invalid identity token', 400);
  }

  const appleId = applePayload.sub;
  // Email 可能从 token 或请求体获取（首次登录时 Apple 会提供）
  const email = applePayload.email || body.email;

  if (!email) {
    return errorResponse('Email is required', 400);
  }

  // 查找或创建用户
  let user = await env.DB.prepare('SELECT * FROM users WHERE apple_id = ?').bind(appleId).first<User>();

  if (!user) {
    // 检查 email 是否已存在
    const existingUser = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();

    if (existingUser) {
      // 关联 Apple ID 到现有用户
      await env.DB.prepare('UPDATE users SET apple_id = ? WHERE id = ?').bind(appleId, existingUser.id).run();
      user = { ...existingUser, apple_id: appleId };
    } else {
      // 创建新用户
      const userId = generateId();
      const timestamp = now();

      await env.DB.prepare('INSERT INTO users (id, email, apple_id, created_at, last_heartbeat) VALUES (?, ?, ?, ?, ?)')
        .bind(userId, email, appleId, timestamp, timestamp)
        .run();

      // 创建默认心跳配置
      await env.DB.prepare(
        'INSERT INTO heartbeat_config (user_id, frequency, grace_period, updated_at) VALUES (?, ?, ?, ?)',
      )
        .bind(userId, 'weekly', 7, timestamp)
        .run();

      user = {
        id: userId,
        email,
        apple_id: appleId,
        created_at: timestamp,
        last_heartbeat: timestamp,
      };
    }
  }

  // 生成 JWT token
  const token = await generateToken(user.id, user.email, env.JWT_SECRET);

  return jsonResponse({
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  });
}

/**
 * 获取当前用户信息
 */
export async function handleGetMe(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  const user = await env.DB.prepare('SELECT id, email, created_at, last_heartbeat FROM users WHERE id = ?')
    .bind(authResult.user.sub)
    .first<User>();

  if (!user) {
    return errorResponse('User not found', 404);
  }

  return jsonResponse({
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
    lastHeartbeat: user.last_heartbeat,
  });
}

/**
 * 登出（客户端清除 token 即可，服务端无需处理）
 */
export async function handleLogout(_request: Request, _env: Env): Promise<Response> {
  return jsonResponse({ message: 'Logged out successfully' });
}
