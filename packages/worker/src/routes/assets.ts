/**
 * 资产管理路由
 * GET /api/assets - 获取资产列表
 * POST /api/assets - 创建资产
 * GET /api/assets/:id - 获取单个资产
 * PUT /api/assets/:id - 更新资产
 * DELETE /api/assets/:id - 删除资产
 *
 * 加密模式：
 * 1. 客户端先用主密码加密数据（encryptedData）
 * 2. 服务端再用 HSM（密钥分片）二次加密存储
 * 3. 解密时反向操作
 */

import type { Asset, AssetType } from '../db/types';
import type { Env } from '../lib/env';
import { requireAuth } from '../lib/auth';
import { decryptAssetData, encryptAssetData, requireCryptoHeaders } from '../lib/crypto-service';
import { errorResponse, generateId, jsonResponse, now, parseJsonBody } from '../lib/utils';

interface CreateAssetRequest {
  type: AssetType;
  name: string;
  /** 客户端已加密的数据 */
  encryptedData: string;
  /** 密码提示（明文，不加密） */
  encryptedHint?: string;
  recipientIds?: string[];
}

interface UpdateAssetRequest {
  name?: string;
  encryptedData?: string;
  encryptedHint?: string;
  recipientIds?: string[];
}

/**
 * 获取用户所有资产（列表不返回加密数据）
 */
export async function handleListAssets(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  const assets = await env.DB.prepare(
    `SELECT id, type, name, encrypted_hint, created_at, updated_at
     FROM assets
     WHERE user_id = ?
     ORDER BY created_at DESC`,
  )
    .bind(authResult.user.sub)
    .all<Omit<Asset, 'user_id' | 'encrypted_data'>>();

  // 获取每个资产的接收人
  const assetsWithRecipients = await Promise.all(
    (assets.results ?? []).map(async (asset) => {
      const recipients = await env.DB.prepare(
        `SELECT r.id, r.name, r.email, r.relationship
         FROM recipients r
         JOIN asset_recipients ar ON ar.recipient_id = r.id
         WHERE ar.asset_id = ?`,
      )
        .bind(asset.id)
        .all();

      return {
        id: asset.id,
        type: asset.type,
        name: asset.name,
        encryptedHint: asset.encrypted_hint,
        createdAt: asset.created_at,
        updatedAt: asset.updated_at,
        recipients: recipients.results ?? [],
      };
    }),
  );

  return jsonResponse(assetsWithRecipients);
}

/**
 * 创建新资产（服务端二次加密）
 */
export async function handleCreateAsset(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  // 验证加密头
  const cryptoResult = requireCryptoHeaders(request);
  if ('error' in cryptoResult) {
    return errorResponse(cryptoResult.error, 400);
  }

  const body = await parseJsonBody<CreateAssetRequest>(request);
  if (!body?.type || !body?.name || !body?.encryptedData) {
    return errorResponse('Missing required fields: type, name, encryptedData', 400);
  }

  const validTypes: AssetType[] = ['crypto', 'transfer', 'message'];
  if (!validTypes.includes(body.type)) {
    return errorResponse('Invalid asset type', 400);
  }

  const assetId = generateId();
  const timestamp = now();

  // 服务端二次加密：用 HSM 密钥加密客户端已加密的数据
  const serverEncryptedData = await encryptAssetData(
    env,
    cryptoResult.clientSecret,
    body.encryptedData,
    authResult.user.sub,
  );

  await env.DB.prepare(
    `INSERT INTO assets (id, user_id, type, name, encrypted_data, encrypted_hint, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      assetId,
      authResult.user.sub,
      body.type,
      body.name,
      serverEncryptedData,
      body.encryptedHint ?? null,
      timestamp,
      timestamp,
    )
    .run();

  // 关联接收人
  if (body.recipientIds && body.recipientIds.length > 0) {
    for (const recipientId of body.recipientIds) {
      // TODO: 这里需要生成用接收人公钥加密的密码
      await env.DB.prepare('INSERT INTO asset_recipients (asset_id, recipient_id, encrypted_password) VALUES (?, ?, ?)')
        .bind(assetId, recipientId, 'PLACEHOLDER')
        .run();
    }
  }

  return jsonResponse({ id: assetId }, 201);
}

/**
 * 获取单个资产详情（服务端解密后返回客户端加密数据）
 */
export async function handleGetAsset(request: Request, env: Env, assetId: string): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  // 验证加密头
  const cryptoResult = requireCryptoHeaders(request);
  if ('error' in cryptoResult) {
    return errorResponse(cryptoResult.error, 400);
  }

  const asset = await env.DB.prepare('SELECT * FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, authResult.user.sub)
    .first<Asset>();

  if (!asset) {
    return errorResponse('Asset not found', 404);
  }

  // 服务端解密：还原到客户端加密的状态
  let clientEncryptedData: string;
  try {
    clientEncryptedData = await decryptAssetData(
      env,
      cryptoResult.clientSecret,
      asset.encrypted_data,
      authResult.user.sub,
    );
  } catch (err) {
    console.error('Failed to decrypt asset:', err);
    return errorResponse('Failed to decrypt asset', 500);
  }

  // 获取关联的接收人
  const recipients = await env.DB.prepare(
    `SELECT r.id, r.name, r.email, r.relationship
     FROM recipients r
     JOIN asset_recipients ar ON ar.recipient_id = r.id
     WHERE ar.asset_id = ?`,
  )
    .bind(assetId)
    .all();

  return jsonResponse({
    id: asset.id,
    type: asset.type,
    name: asset.name,
    encryptedData: clientEncryptedData,
    encryptedHint: asset.encrypted_hint,
    createdAt: asset.created_at,
    updatedAt: asset.updated_at,
    recipients: recipients.results ?? [],
  });
}

/**
 * 更新资产
 */
export async function handleUpdateAsset(request: Request, env: Env, assetId: string): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  // 检查资产是否存在
  const existing = await env.DB.prepare('SELECT id FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, authResult.user.sub)
    .first();

  if (!existing) {
    return errorResponse('Asset not found', 404);
  }

  const body = await parseJsonBody<UpdateAssetRequest>(request);
  if (!body) {
    return errorResponse('Invalid request body', 400);
  }

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (body.name) {
    updates.push('name = ?');
    values.push(body.name);
  }
  if (body.encryptedData) {
    // 验证加密头
    const cryptoResult = requireCryptoHeaders(request);
    if ('error' in cryptoResult) {
      return errorResponse(cryptoResult.error, 400);
    }

    // 服务端二次加密
    const serverEncryptedData = await encryptAssetData(
      env,
      cryptoResult.clientSecret,
      body.encryptedData,
      authResult.user.sub,
    );
    updates.push('encrypted_data = ?');
    values.push(serverEncryptedData);
  }
  if (body.encryptedHint !== undefined) {
    updates.push('encrypted_hint = ?');
    values.push(body.encryptedHint);
  }

  if (updates.length > 0) {
    updates.push('updated_at = ?');
    values.push(now());
    values.push(assetId);

    await env.DB.prepare(`UPDATE assets SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  // 更新接收人关联
  if (body.recipientIds) {
    // 删除旧的关联
    await env.DB.prepare('DELETE FROM asset_recipients WHERE asset_id = ?').bind(assetId).run();

    // 添加新的关联
    for (const recipientId of body.recipientIds) {
      await env.DB.prepare('INSERT INTO asset_recipients (asset_id, recipient_id, encrypted_password) VALUES (?, ?, ?)')
        .bind(assetId, recipientId, 'PLACEHOLDER')
        .run();
    }
  }

  return jsonResponse({ success: true });
}

/**
 * 删除资产
 */
export async function handleDeleteAsset(request: Request, env: Env, assetId: string): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  const result = await env.DB.prepare('DELETE FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, authResult.user.sub)
    .run();

  if (result.meta.changes === 0) {
    return errorResponse('Asset not found', 404);
  }

  return jsonResponse({ success: true });
}
