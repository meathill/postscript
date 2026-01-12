/**
 * 心跳/打卡路由
 * POST /api/heartbeat - 用户打卡
 * GET /api/heartbeat/status - 获取心跳状态
 * GET /api/heartbeat/config - 获取心跳配置
 * PUT /api/heartbeat/config - 更新心跳配置
 */

import type { HeartbeatConfig, HeartbeatFrequency } from '../db/types';
import type { Env } from '../lib/env';
import { requireAuth } from '../lib/auth';
import { daysBetween, errorResponse, getFrequencyDays, jsonResponse, now, parseJsonBody } from '../lib/utils';

interface UpdateConfigRequest {
  frequency?: HeartbeatFrequency;
  gracePeriod?: number;
}

/**
 * 用户打卡 - 重置心跳计时器
 */
export async function handleHeartbeat(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  const timestamp = now();

  // 更新最后心跳时间
  await env.DB.prepare('UPDATE users SET last_heartbeat = ? WHERE id = ?').bind(timestamp, authResult.user.sub).run();

  // 如果有倒计时记录，恢复为 active 状态
  await env.DB.prepare(
    `UPDATE legacy_records SET status = 'active', countdown_started_at = NULL WHERE user_id = ? AND status = 'countdown'`,
  )
    .bind(authResult.user.sub)
    .run();

  return jsonResponse({
    success: true,
    lastHeartbeat: timestamp,
    message: 'Heartbeat recorded successfully',
  });
}

/**
 * 获取心跳状态
 */
export async function handleGetHeartbeatStatus(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  // 获取用户最后心跳时间
  const user = await env.DB.prepare('SELECT last_heartbeat FROM users WHERE id = ?')
    .bind(authResult.user.sub)
    .first<{ last_heartbeat: number | null }>();

  // 获取心跳配置
  const config = await env.DB.prepare('SELECT * FROM heartbeat_config WHERE user_id = ?')
    .bind(authResult.user.sub)
    .first<HeartbeatConfig>();

  const lastHeartbeat = user?.last_heartbeat ?? now();
  const frequency = config?.frequency ?? 'weekly';
  const gracePeriod = config?.grace_period ?? 7;
  const frequencyDays = getFrequencyDays(frequency);

  const currentTime = now();
  const daysSinceLastHeartbeat = daysBetween(lastHeartbeat, currentTime);

  // 计算状态
  let status: 'active' | 'warning' | 'countdown';
  let daysRemaining: number;

  if (daysSinceLastHeartbeat < frequencyDays) {
    // 在正常周期内
    status = 'active';
    daysRemaining = frequencyDays - daysSinceLastHeartbeat;
  } else if (daysSinceLastHeartbeat < frequencyDays + gracePeriod) {
    // 在 grace period 内
    status = 'countdown';
    daysRemaining = frequencyDays + gracePeriod - daysSinceLastHeartbeat;
  } else {
    // 已超时（理论上不会到这里，scheduled 任务会处理）
    status = 'countdown';
    daysRemaining = 0;
  }

  // 在接近截止日期时警告
  if (status === 'active' && daysRemaining <= 2) {
    status = 'warning';
  }

  // 计算下次截止日期
  const nextDue = lastHeartbeat + frequencyDays * 24 * 60 * 60;
  const finalDeadline = nextDue + gracePeriod * 24 * 60 * 60;

  return jsonResponse({
    status,
    lastHeartbeat,
    nextDue,
    finalDeadline,
    daysRemaining,
    config: {
      frequency,
      gracePeriod,
    },
  });
}

/**
 * 获取心跳配置
 */
export async function handleGetHeartbeatConfig(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  const config = await env.DB.prepare('SELECT * FROM heartbeat_config WHERE user_id = ?')
    .bind(authResult.user.sub)
    .first<HeartbeatConfig>();

  if (!config) {
    // 返回默认配置
    return jsonResponse({
      frequency: 'weekly',
      gracePeriod: 7,
    });
  }

  return jsonResponse({
    frequency: config.frequency,
    gracePeriod: config.grace_period,
    updatedAt: config.updated_at,
  });
}

/**
 * 更新心跳配置
 */
export async function handleUpdateHeartbeatConfig(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env);
  if ('error' in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<UpdateConfigRequest>(request);
  if (!body) {
    return errorResponse('Invalid request body', 400);
  }

  const validFrequencies: HeartbeatFrequency[] = ['daily', 'weekly', 'monthly'];
  const validGracePeriods = [7, 14, 30];

  if (body.frequency && !validFrequencies.includes(body.frequency)) {
    return errorResponse('Invalid frequency. Must be one of: daily, weekly, monthly', 400);
  }

  if (body.gracePeriod && !validGracePeriods.includes(body.gracePeriod)) {
    return errorResponse('Invalid grace period. Must be one of: 7, 14, 30', 400);
  }

  const timestamp = now();

  // 检查是否存在配置
  const existing = await env.DB.prepare('SELECT user_id FROM heartbeat_config WHERE user_id = ?')
    .bind(authResult.user.sub)
    .first();

  if (existing) {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.frequency) {
      updates.push('frequency = ?');
      values.push(body.frequency);
    }
    if (body.gracePeriod) {
      updates.push('grace_period = ?');
      values.push(body.gracePeriod);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(timestamp);
      values.push(authResult.user.sub);

      await env.DB.prepare(`UPDATE heartbeat_config SET ${updates.join(', ')} WHERE user_id = ?`)
        .bind(...values)
        .run();
    }
  } else {
    await env.DB.prepare(
      'INSERT INTO heartbeat_config (user_id, frequency, grace_period, updated_at) VALUES (?, ?, ?, ?)',
    )
      .bind(authResult.user.sub, body.frequency ?? 'weekly', body.gracePeriod ?? 7, timestamp)
      .run();
  }

  return jsonResponse({ success: true });
}
