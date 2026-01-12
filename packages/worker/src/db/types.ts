/**
 * 数据库类型定义
 */

/** 用户表 */
export interface User {
  id: string;
  email: string;
  apple_id: string | null;
  created_at: number;
  last_heartbeat: number | null;
}

/** 数字资产类型 */
export type AssetType = 'crypto' | 'transfer' | 'message';

/** 数字资产表 */
export interface Asset {
  id: string;
  user_id: string;
  type: AssetType;
  name: string;
  encrypted_data: string;
  encrypted_hint: string | null;
  created_at: number;
  updated_at: number;
}

/** 接收人表 */
export interface Recipient {
  id: string;
  user_id: string;
  name: string;
  email: string;
  relationship: string | null;
  avatar_url: string | null;
  verified: boolean;
  created_at: number;
}

/** 资产-接收人关联表 */
export interface AssetRecipient {
  asset_id: string;
  recipient_id: string;
  /** 用接收人密钥加密的解密密码 */
  encrypted_password: string;
}

/** 打卡频率 */
export type HeartbeatFrequency = 'daily' | 'weekly' | 'monthly';

/** 心跳配置表 */
export interface HeartbeatConfig {
  user_id: string;
  /** 打卡频率，默认 weekly (7天) */
  frequency: HeartbeatFrequency;
  /** Grace period 天数，可选 7/14/30 */
  grace_period: number;
  updated_at: number;
}

/** 传承状态 */
export type LegacyStatus = 'active' | 'countdown' | 'delivered';

/** 传承记录表 */
export interface LegacyRecord {
  id: string;
  user_id: string;
  status: LegacyStatus;
  /** 倒计时开始时间 */
  countdown_started_at: number | null;
  /** 资产交付时间 */
  delivered_at: number | null;
  created_at: number;
}
