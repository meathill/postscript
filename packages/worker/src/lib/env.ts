/**
 * Worker 环境变量类型定义
 */

export interface Env {
  /** D1 数据库 */
  DB: D1Database;
  /** KV 存储（用于 session 等） */
  KV: KVNamespace;
  /** HSM 服务密钥分片 */
  HSM_SECRET_PART: string;
  /** JWT 签名密钥 */
  JWT_SECRET: string;
  /** Apple Sign-In 相关配置 */
  APPLE_CLIENT_ID: string;
  APPLE_TEAM_ID: string;
  APPLE_KEY_ID: string;
  APPLE_PRIVATE_KEY: string;
  /** 邮件发送服务 API Key */
  RESEND_API_KEY?: string;
}
