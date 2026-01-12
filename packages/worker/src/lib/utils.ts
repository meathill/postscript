/**
 * 通用工具函数
 */

/**
 * 生成 UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * 获取当前 Unix 时间戳（秒）
 */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * 计算两个时间戳之间的天数差
 */
export function daysBetween(from: number, to: number): number {
  return Math.floor((to - from) / (24 * 60 * 60));
}

/**
 * 创建成功响应
 */
export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * 创建错误响应
 */
export function errorResponse(error: string, status = 400): Response {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * 解析请求体 JSON
 */
export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

/**
 * 心跳频率对应的天数
 */
export const FREQUENCY_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

/**
 * 获取心跳频率对应的天数
 */
export function getFrequencyDays(frequency: string): number {
  return FREQUENCY_DAYS[frequency] ?? 7;
}
