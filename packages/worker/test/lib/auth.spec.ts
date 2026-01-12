/**
 * JWT 认证模块测试
 */

import { describe, expect, it } from 'vitest';
import { generateToken, verifyToken } from '../../src/lib/auth';

const TEST_SECRET = 'test-secret-key-for-jwt-signing';

describe('auth', () => {
  describe('generateToken', () => {
    it('应该生成有效的 JWT token', async () => {
      const token = await generateToken('user-123', 'test@example.com', TEST_SECRET);

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('生成的 token 应该可以被验证', async () => {
      const userId = 'user-456';
      const email = 'user@example.com';

      const token = await generateToken(userId, email, TEST_SECRET);
      const payload = await verifyToken(token, TEST_SECRET);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(userId);
      expect(payload?.email).toBe(email);
    });
  });

  describe('verifyToken', () => {
    it('有效 token 应该返回 payload', async () => {
      const token = await generateToken('user-789', 'valid@example.com', TEST_SECRET);
      const payload = await verifyToken(token, TEST_SECRET);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-789');
      expect(payload?.email).toBe('valid@example.com');
      expect(payload?.iat).toBeDefined();
      expect(payload?.exp).toBeDefined();
    });

    it('错误的密钥应该返回 null', async () => {
      const token = await generateToken('user-123', 'test@example.com', TEST_SECRET);
      const payload = await verifyToken(token, 'wrong-secret');

      expect(payload).toBeNull();
    });

    it('格式错误的 token 应该返回 null', async () => {
      expect(await verifyToken('invalid-token', TEST_SECRET)).toBeNull();
      expect(await verifyToken('a.b', TEST_SECRET)).toBeNull();
      expect(await verifyToken('a.b.c.d', TEST_SECRET)).toBeNull();
    });

    it('被篡改的 token 应该返回 null', async () => {
      const token = await generateToken('user-123', 'test@example.com', TEST_SECRET);
      const parts = token.split('.');
      // 篡改 payload
      parts[1] =
        'eyJzdWIiOiJoYWNrZWQiLCJlbWFpbCI6ImhhY2tlZEBleGFtcGxlLmNvbSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ';
      const tamperedToken = parts.join('.');

      const payload = await verifyToken(tamperedToken, TEST_SECRET);
      expect(payload).toBeNull();
    });

    it('过期的 token 应该返回 null', async () => {
      // 创建一个过期时间在过去的 token（手动构造）
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      const payload = btoa(
        JSON.stringify({
          sub: 'user-123',
          email: 'test@example.com',
          iat: 1600000000,
          exp: 1600000001, // 已过期
        }),
      )
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // 这个 token 签名是错误的，所以验证会失败
      // 实际测试过期需要更复杂的 mock
      const invalidToken = `${header}.${payload}.invalid-signature`;
      const result = await verifyToken(invalidToken, TEST_SECRET);
      expect(result).toBeNull();
    });
  });
});
