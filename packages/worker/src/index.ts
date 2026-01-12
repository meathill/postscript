/**
 * Postscript Worker - API 入口
 *
 * 处理所有 API 请求和定时任务
 */

import type { Env } from './lib/env';
import { errorResponse } from './lib/utils';

// 路由处理器
import { handleAppleSignIn, handleGetMe, handleLogout } from './routes/auth';
import {
  handleCreateAsset,
  handleDeleteAsset,
  handleGetAsset,
  handleListAssets,
  handleUpdateAsset,
} from './routes/assets';
import {
  handleCreateRecipient,
  handleDeleteRecipient,
  handleGetRecipient,
  handleListRecipients,
  handleUpdateRecipient,
} from './routes/recipients';
import {
  handleGetHeartbeatConfig,
  handleGetHeartbeatStatus,
  handleHeartbeat,
  handleUpdateHeartbeatConfig,
} from './routes/heartbeat';

/**
 * CORS 响应头
 */
function corsHeaders(): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-HSM-Secret');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

/**
 * 处理 OPTIONS 预检请求
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

/**
 * 包装响应，添加 CORS 头
 */
async function withCors(handler: () => Promise<Response>): Promise<Response> {
  const response = await handler();
  const headers = corsHeaders();
  response.headers.forEach((value, key) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    return withCors(async () => {
      // Auth 路由
      if (path === '/api/auth/apple' && method === 'POST') {
        return handleAppleSignIn(request, env);
      }
      if (path === '/api/auth/me' && method === 'GET') {
        return handleGetMe(request, env);
      }
      if (path === '/api/auth/logout' && method === 'POST') {
        return handleLogout(request, env);
      }

      // Assets 路由
      if (path === '/api/assets' && method === 'GET') {
        return handleListAssets(request, env);
      }
      if (path === '/api/assets' && method === 'POST') {
        return handleCreateAsset(request, env);
      }

      const assetMatch = path.match(/^\/api\/assets\/([^/]+)$/);
      if (assetMatch) {
        const assetId = assetMatch[1];
        switch (method) {
          case 'GET':
            return handleGetAsset(request, env, assetId);
          case 'PUT':
            return handleUpdateAsset(request, env, assetId);
          case 'DELETE':
            return handleDeleteAsset(request, env, assetId);
        }
      }

      // Recipients 路由
      if (path === '/api/recipients' && method === 'GET') {
        return handleListRecipients(request, env);
      }
      if (path === '/api/recipients' && method === 'POST') {
        return handleCreateRecipient(request, env);
      }

      const recipientMatch = path.match(/^\/api\/recipients\/([^/]+)$/);
      if (recipientMatch) {
        const recipientId = recipientMatch[1];
        switch (method) {
          case 'GET':
            return handleGetRecipient(request, env, recipientId);
          case 'PUT':
            return handleUpdateRecipient(request, env, recipientId);
          case 'DELETE':
            return handleDeleteRecipient(request, env, recipientId);
        }
      }

      // Heartbeat 路由
      if (path === '/api/heartbeat' && method === 'POST') {
        return handleHeartbeat(request, env);
      }
      if (path === '/api/heartbeat/status' && method === 'GET') {
        return handleGetHeartbeatStatus(request, env);
      }
      if (path === '/api/heartbeat/config' && method === 'GET') {
        return handleGetHeartbeatConfig(request, env);
      }
      if (path === '/api/heartbeat/config' && method === 'PUT') {
        return handleUpdateHeartbeatConfig(request, env);
      }

      // 健康检查
      if (path === '/api/health' && method === 'GET') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 404
      return errorResponse('Not found', 404);
    });
  },

  /**
   * 定时任务 - 检查用户心跳状态
   * 每小时执行一次
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Scheduled task triggered at ${new Date(event.scheduledTime).toISOString()}`);

    // 获取所有需要检查的用户
    const users = await env.DB.prepare(
      `SELECT u.id, u.email, u.last_heartbeat, h.frequency, h.grace_period
       FROM users u
       LEFT JOIN heartbeat_config h ON h.user_id = u.id
       WHERE u.last_heartbeat IS NOT NULL`,
    ).all<{
      id: string;
      email: string;
      last_heartbeat: number;
      frequency: string | null;
      grace_period: number | null;
    }>();

    const currentTime = Math.floor(Date.now() / 1000);
    const SECONDS_PER_DAY = 24 * 60 * 60;

    for (const user of users.results ?? []) {
      const frequency = user.frequency ?? 'weekly';
      const gracePeriod = user.grace_period ?? 7;
      const frequencyDays = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 30;

      const lastHeartbeat = user.last_heartbeat;
      const deadline = lastHeartbeat + (frequencyDays + gracePeriod) * SECONDS_PER_DAY;

      if (currentTime >= deadline) {
        // 用户已超时，触发资产传递流程
        console.log(`User ${user.id} exceeded deadline, triggering legacy transfer`);

        // 检查是否已经有传递记录
        const existingRecord = await env.DB.prepare(
          `SELECT id FROM legacy_records WHERE user_id = ? AND status = 'delivered'`,
        )
          .bind(user.id)
          .first();

        if (!existingRecord) {
          // 创建传递记录
          const recordId = crypto.randomUUID();
          await env.DB.prepare(
            `INSERT INTO legacy_records (id, user_id, status, delivered_at, created_at)
             VALUES (?, ?, 'delivered', ?, ?)`,
          )
            .bind(recordId, user.id, currentTime, currentTime)
            .run();

          // TODO: 发送资产传递邮件给接收人
          // 这里需要获取用户的所有资产和对应接收人，然后发送邮件
          console.log(`Legacy transfer initiated for user ${user.id}`);
        }
      } else if (currentTime >= lastHeartbeat + frequencyDays * SECONDS_PER_DAY) {
        // 用户进入倒计时期间
        const existingRecord = await env.DB.prepare(
          `SELECT id, status FROM legacy_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
        )
          .bind(user.id)
          .first<{ id: string; status: string }>();

        if (!existingRecord || existingRecord.status === 'active') {
          // 更新或创建倒计时记录
          if (existingRecord) {
            await env.DB.prepare(
              `UPDATE legacy_records SET status = 'countdown', countdown_started_at = ? WHERE id = ?`,
            )
              .bind(currentTime, existingRecord.id)
              .run();
          } else {
            const recordId = crypto.randomUUID();
            await env.DB.prepare(
              `INSERT INTO legacy_records (id, user_id, status, countdown_started_at, created_at)
               VALUES (?, ?, 'countdown', ?, ?)`,
            )
              .bind(recordId, user.id, currentTime, currentTime)
              .run();
          }

          // TODO: 发送提醒邮件给用户
          console.log(`Countdown started for user ${user.id}`);
        }
      }
    }

    console.log('Scheduled task completed');
  },
} satisfies ExportedHandler<Env>;
