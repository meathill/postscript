/**
 * 工具函数测试
 */

import { describe, expect, it } from 'vitest';
import {
  daysBetween,
  errorResponse,
  generateId,
  getFrequencyDays,
  jsonResponse,
  now,
  parseJsonBody,
} from '../../src/lib/utils';

describe('utils', () => {
  describe('generateId', () => {
    it('应该生成有效的 UUID v4', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('每次生成的 ID 应该不同', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('now', () => {
    it('应该返回当前时间戳（秒）', () => {
      const before = Math.floor(Date.now() / 1000);
      const result = now();
      const after = Math.floor(Date.now() / 1000);

      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });
  });

  describe('daysBetween', () => {
    it('应该正确计算天数差', () => {
      const SECONDS_PER_DAY = 24 * 60 * 60;
      const from = 1000000;
      const to = from + 5 * SECONDS_PER_DAY;

      expect(daysBetween(from, to)).toBe(5);
    });

    it('同一时间应该返回 0', () => {
      const time = 1000000;
      expect(daysBetween(time, time)).toBe(0);
    });

    it('不足一天应该返回 0', () => {
      const from = 1000000;
      const to = from + 12 * 60 * 60; // 12 小时
      expect(daysBetween(from, to)).toBe(0);
    });
  });

  describe('jsonResponse', () => {
    it('应该返回正确格式的 JSON 响应', async () => {
      const data = { foo: 'bar', num: 123 };
      const response = jsonResponse(data);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const body = await response.json();
      expect(body).toEqual({ success: true, data });
    });

    it('应该支持自定义状态码', async () => {
      const response = jsonResponse({ id: '123' }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('errorResponse', () => {
    it('应该返回正确格式的错误响应', async () => {
      const response = errorResponse('Something went wrong');

      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const body = await response.json();
      expect(body).toEqual({ success: false, error: 'Something went wrong' });
    });

    it('应该支持自定义状态码', async () => {
      const response = errorResponse('Not found', 404);
      expect(response.status).toBe(404);
    });
  });

  describe('parseJsonBody', () => {
    it('应该正确解析 JSON 请求体', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify({ name: 'test', value: 42 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseJsonBody<{ name: string; value: number }>(request);
      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('无效 JSON 应该返回 null', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        body: 'invalid json',
      });

      const result = await parseJsonBody(request);
      expect(result).toBeNull();
    });
  });

  describe('getFrequencyDays', () => {
    it('daily 应该返回 1', () => {
      expect(getFrequencyDays('daily')).toBe(1);
    });

    it('weekly 应该返回 7', () => {
      expect(getFrequencyDays('weekly')).toBe(7);
    });

    it('monthly 应该返回 30', () => {
      expect(getFrequencyDays('monthly')).toBe(30);
    });

    it('未知频率应该默认返回 7', () => {
      expect(getFrequencyDays('unknown')).toBe(7);
    });
  });
});
