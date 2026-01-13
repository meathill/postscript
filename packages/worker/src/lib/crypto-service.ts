/**
 * 加密服务
 * 提供资产加解密的高层 API
 */

import type { Env } from '../lib/env';
import { base64ToArrayBuffer, deriveKEK, envelopeDecrypt, envelopeEncrypt, generateSalt } from '../crypto';
import type { EncryptedPayload } from '../crypto';

/**
 * 从请求头获取客户端密钥分片
 */
export function getClientSecret(request: Request): string | null {
  return request.headers.get('X-HSM-Secret');
}

/**
 * 加密资产数据
 * @param env Worker 环境变量
 * @param clientSecret 客户端密钥分片（来自 X-HSM-Secret header）
 * @param plaintext 明文数据
 * @param userId 用户 ID（用于 AAD）
 * @returns JSON 字符串形式的加密数据
 */
export async function encryptAssetData(
  env: Env,
  clientSecret: string,
  plaintext: string,
  userId: string,
): Promise<string> {
  // 生成盐值
  const salt = generateSalt();

  // 派生 KEK（服务端分片 + 客户端分片）
  const kek = await deriveKEK(env.HSM_SECRET_PART, clientSecret, salt);

  // 使用信封加密
  const payload = await envelopeEncrypt(kek, plaintext, salt, userId);

  return JSON.stringify(payload);
}

/**
 * 解密资产数据
 * @param env Worker 环境变量
 * @param clientSecret 客户端密钥分片（来自 X-HSM-Secret header）
 * @param encryptedData JSON 字符串形式的加密数据
 * @param userId 用户 ID（用于 AAD）
 * @returns 明文数据
 */
export async function decryptAssetData(
  env: Env,
  clientSecret: string,
  encryptedData: string,
  userId: string,
): Promise<string> {
  const payload = JSON.parse(encryptedData) as EncryptedPayload;

  // 从 payload 中获取盐值
  const salt = base64ToArrayBuffer(payload.salt);

  // 派生 KEK（服务端分片 + 客户端分片）
  const kek = await deriveKEK(env.HSM_SECRET_PART, clientSecret, salt);

  // 解密
  return envelopeDecrypt(kek, payload, userId);
}

/**
 * 验证请求是否包含必要的加密头
 */
export function requireCryptoHeaders(request: Request): { clientSecret: string } | { error: string } {
  const clientSecret = getClientSecret(request);
  if (!clientSecret) {
    return { error: 'Missing X-HSM-Secret header' };
  }
  return { clientSecret };
}
