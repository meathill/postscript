/**
 * 接收人管理路由
 * GET /api/recipients - 获取接收人列表
 * POST /api/recipients - 添加接收人
 * GET /api/recipients/:id - 获取接收人详情
 * PUT /api/recipients/:id - 更新接收人
 * DELETE /api/recipients/:id - 删除接收人
 */

import type { Recipient } from '../db/types';
import type { Env } from '../lib/env';
import { requireAuth } from '../lib/auth';
import { errorResponse, generateId, jsonResponse, now, parseJsonBody } from '../lib/utils';

interface CreateRecipientRequest {
  name: string;
  email: string;
  relationship?: string;
  avatarUrl?: string;
}

interface UpdateRecipientRequest {
  name?: string;
  email?: string;
  relationship?: string;
  avatarUrl?: string;
}

/**
 * 获取用户所有接收人
 */
export async function handleListRecipients(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  const recipients = await env.DB.prepare(
    `SELECT r.id, r.name, r.email, r.relationship, r.avatar_url, r.verified, r.created_at,
            COUNT(ar.asset_id) as asset_count
     FROM recipients r
     LEFT JOIN asset_recipients ar ON ar.recipient_id = r.id
     WHERE r.user_id = ?
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
  )
    .bind(authResult.user.sub)
    .all<Recipient & { asset_count: number }>();

  return jsonResponse(
    (recipients.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      relationship: r.relationship,
      avatarUrl: r.avatar_url,
      verified: Boolean(r.verified),
      createdAt: r.created_at,
      assetCount: r.asset_count,
    })),
  );
}

/**
 * 添加接收人
 */
export async function handleCreateRecipient(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<CreateRecipientRequest>(request);
  if (!body?.name || !body?.email) {
    return errorResponse('Missing required fields: name, email', 400);
  }

  // 验证 email 格式
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return errorResponse('Invalid email format', 400);
  }

  // 检查是否已存在相同 email 的接收人
  const existing = await env.DB.prepare('SELECT id FROM recipients WHERE user_id = ? AND email = ?')
    .bind(authResult.user.sub, body.email)
    .first();

  if (existing) {
    return errorResponse('Recipient with this email already exists', 409);
  }

  const recipientId = generateId();
  const timestamp = now();

  await env.DB.prepare(
    `INSERT INTO recipients (id, user_id, name, email, relationship, avatar_url, verified, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
  )
    .bind(
      recipientId,
      authResult.user.sub,
      body.name,
      body.email,
      body.relationship ?? null,
      body.avatarUrl ?? null,
      timestamp,
    )
    .run();

  // TODO: 发送验证邮件给接收人

  return jsonResponse({ id: recipientId }, 201);
}

/**
 * 获取接收人详情
 */
export async function handleGetRecipient(request: Request, env: Env, recipientId: string): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  const recipient = await env.DB.prepare('SELECT * FROM recipients WHERE id = ? AND user_id = ?')
    .bind(recipientId, authResult.user.sub)
    .first<Recipient>();

  if (!recipient) {
    return errorResponse('Recipient not found', 404);
  }

  // 获取关联的资产
  const assets = await env.DB.prepare(
    `SELECT a.id, a.type, a.name
     FROM assets a
     JOIN asset_recipients ar ON ar.asset_id = a.id
     WHERE ar.recipient_id = ?`,
  )
    .bind(recipientId)
    .all();

  return jsonResponse({
    id: recipient.id,
    name: recipient.name,
    email: recipient.email,
    relationship: recipient.relationship,
    avatarUrl: recipient.avatar_url,
    verified: Boolean(recipient.verified),
    createdAt: recipient.created_at,
    assets: assets.results ?? [],
  });
}

/**
 * 更新接收人
 */
export async function handleUpdateRecipient(request: Request, env: Env, recipientId: string): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  const existing = await env.DB.prepare('SELECT id FROM recipients WHERE id = ? AND user_id = ?')
    .bind(recipientId, authResult.user.sub)
    .first();

  if (!existing) {
    return errorResponse('Recipient not found', 404);
  }

  const body = await parseJsonBody<UpdateRecipientRequest>(request);
  if (!body) {
    return errorResponse('Invalid request body', 400);
  }

  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (body.name) {
    updates.push('name = ?');
    values.push(body.name);
  }
  if (body.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return errorResponse('Invalid email format', 400);
    }
    updates.push('email = ?');
    values.push(body.email);
    // 更改邮箱需要重新验证
    updates.push('verified = 0');
  }
  if (body.relationship !== undefined) {
    updates.push('relationship = ?');
    values.push(body.relationship);
  }
  if (body.avatarUrl !== undefined) {
    updates.push('avatar_url = ?');
    values.push(body.avatarUrl);
  }

  if (updates.length > 0) {
    values.push(recipientId);
    await env.DB.prepare(`UPDATE recipients SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  return jsonResponse({ success: true });
}

/**
 * 删除接收人
 */
export async function handleDeleteRecipient(request: Request, env: Env, recipientId: string): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  const result = await env.DB.prepare('DELETE FROM recipients WHERE id = ? AND user_id = ?')
    .bind(recipientId, authResult.user.sub)
    .run();

  if (result.meta.changes === 0) {
    return errorResponse('Recipient not found', 404);
  }

  return jsonResponse({ success: true });
}
