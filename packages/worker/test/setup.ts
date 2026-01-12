/**
 * 测试设置文件
 * 在测试运行前初始化数据库表
 */

import { env } from 'cloudflare:test';
import { beforeAll } from 'vitest';

beforeAll(async () => {
  // 创建数据库表 - 使用 prepare/run 而非 exec
  const statements = [
    // 用户表
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      apple_id TEXT UNIQUE,
      created_at INTEGER DEFAULT (unixepoch()),
      last_heartbeat INTEGER
    )`,
    // 数字资产表
    `CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('crypto', 'transfer', 'message')),
      name TEXT NOT NULL,
      encrypted_data TEXT NOT NULL,
      encrypted_hint TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    // 接收人表
    `CREATE TABLE IF NOT EXISTS recipients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      relationship TEXT,
      avatar_url TEXT,
      verified INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    // 资产-接收人关联表
    `CREATE TABLE IF NOT EXISTS asset_recipients (
      asset_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      encrypted_password TEXT NOT NULL,
      PRIMARY KEY (asset_id, recipient_id),
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE
    )`,
    // 心跳配置表
    `CREATE TABLE IF NOT EXISTS heartbeat_config (
      user_id TEXT PRIMARY KEY,
      frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
      grace_period INTEGER DEFAULT 7 CHECK (grace_period IN (7, 14, 30)),
      updated_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    // 传承记录表
    `CREATE TABLE IF NOT EXISTS legacy_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'countdown', 'delivered')),
      countdown_started_at INTEGER,
      delivered_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
  ];

  for (const sql of statements) {
    await env.DB.prepare(sql).run();
  }
});
