/**
 * API 集成测试
 */

import { SELF, env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

// 用于测试的 mock token（通过 generateToken 生成）
const TEST_USER_ID = 'test-user-123';
const TEST_EMAIL = 'test@example.com';

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * 创建带认证的请求
 */
function createAuthRequest(path: string, options: RequestInit = {}, token?: string): Request {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  return new Request(`http://localhost${path}`, {
    ...options,
    headers,
  });
}

/**
 * 生成测试用的 JWT token
 */
async function generateTestToken(): Promise<string> {
  const { generateToken } = await import('../../src/lib/auth');
  return generateToken(TEST_USER_ID, TEST_EMAIL, env.JWT_SECRET);
}

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('GET /api/health 应该返回 ok', async () => {
      const response = await SELF.fetch('http://localhost/api/health', { method: 'GET' });

      expect(response.status).toBe(200);
      const body = (await response.json()) as { status: string; timestamp: number };
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('OPTIONS 请求应该返回正确的 CORS 头', async () => {
      const response = await SELF.fetch('http://localhost/api/assets', { method: 'OPTIONS' });

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('所有响应应该包含 CORS 头', async () => {
      const response = await SELF.fetch('http://localhost/api/health', { method: 'GET' });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Auth Endpoints', () => {
    it('POST /api/auth/apple 缺少 token 应该返回 400', async () => {
      const request = createAuthRequest('/api/auth/apple', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await SELF.fetch(request);

      expect(response.status).toBe(400);
      const body = (await response.json()) as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error).toContain('identity token');
    });

    it('GET /api/auth/me 未认证应该返回 401', async () => {
      const request = createAuthRequest('/api/auth/me', { method: 'GET' });
      const response = await SELF.fetch(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Assets Endpoints', () => {
    it('GET /api/assets 未认证应该返回 401', async () => {
      const request = createAuthRequest('/api/assets', { method: 'GET' });
      const response = await SELF.fetch(request);

      expect(response.status).toBe(401);
    });

    it('POST /api/assets 缺少 HSM 头应该返回 400', async () => {
      const token = await generateTestToken();

      // 先创建测试用户
      await env.DB.prepare('INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)')
        .bind(TEST_USER_ID, TEST_EMAIL)
        .run();

      const request = createAuthRequest(
        '/api/assets',
        {
          method: 'POST',
          body: JSON.stringify({ type: 'crypto', name: 'Test', encryptedData: 'abc' }),
        },
        token,
      );
      const response = await SELF.fetch(request);

      expect(response.status).toBe(400);
      const body = (await response.json()) as ApiResponse;
      expect(body.error).toContain('X-HSM-Secret');
    });
  });

  describe('Recipients Endpoints', () => {
    it('GET /api/recipients 未认证应该返回 401', async () => {
      const request = createAuthRequest('/api/recipients', { method: 'GET' });
      const response = await SELF.fetch(request);

      expect(response.status).toBe(401);
    });

    it('POST /api/recipients 无效邮箱应该返回 400', async () => {
      const token = await generateTestToken();

      // 确保用户存在
      await env.DB.prepare('INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)')
        .bind(TEST_USER_ID, TEST_EMAIL)
        .run();

      const request = createAuthRequest(
        '/api/recipients',
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Test', email: 'invalid-email' }),
        },
        token,
      );
      const response = await SELF.fetch(request);

      expect(response.status).toBe(400);
      const body = (await response.json()) as ApiResponse;
      expect(body.error).toContain('email');
    });
  });

  describe('Heartbeat Endpoints', () => {
    it('POST /api/heartbeat 未认证应该返回 401', async () => {
      const request = createAuthRequest('/api/heartbeat', { method: 'POST' });
      const response = await SELF.fetch(request);

      expect(response.status).toBe(401);
    });

    it('GET /api/heartbeat/status 未认证应该返回 401', async () => {
      const request = createAuthRequest('/api/heartbeat/status', { method: 'GET' });
      const response = await SELF.fetch(request);

      expect(response.status).toBe(401);
    });

    it('PUT /api/heartbeat/config 无效频率应该返回 400', async () => {
      const token = await generateTestToken();

      // 确保用户存在
      await env.DB.prepare('INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)')
        .bind(TEST_USER_ID, TEST_EMAIL)
        .run();

      const request = createAuthRequest(
        '/api/heartbeat/config',
        {
          method: 'PUT',
          body: JSON.stringify({ frequency: 'invalid' }),
        },
        token,
      );
      const response = await SELF.fetch(request);

      expect(response.status).toBe(400);
      const body = (await response.json()) as ApiResponse;
      expect(body.error).toContain('frequency');
    });
  });

  describe('404 Not Found', () => {
    it('不存在的路径应该返回 404', async () => {
      const response = await SELF.fetch('http://localhost/api/nonexistent', { method: 'GET' });

      expect(response.status).toBe(404);
    });
  });
});
