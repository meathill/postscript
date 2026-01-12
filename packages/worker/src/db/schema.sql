-- Postscript 数据库 Schema
-- D1 SQLite 数据库

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  apple_id TEXT UNIQUE,
  created_at INTEGER DEFAULT (unixepoch()),
  last_heartbeat INTEGER
);

-- 数字资产表（加密存储）
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('crypto', 'transfer', 'message')),
  name TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  encrypted_hint TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 接收人表
CREATE TABLE IF NOT EXISTS recipients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship TEXT,
  avatar_url TEXT,
  verified INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 资产-接收人关联表
CREATE TABLE IF NOT EXISTS asset_recipients (
  asset_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  PRIMARY KEY (asset_id, recipient_id),
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE
);

-- 心跳配置表
CREATE TABLE IF NOT EXISTS heartbeat_config (
  user_id TEXT PRIMARY KEY,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  grace_period INTEGER DEFAULT 7 CHECK (grace_period IN (7, 14, 30)),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 传承记录表
CREATE TABLE IF NOT EXISTS legacy_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'countdown', 'delivered')),
  countdown_started_at INTEGER,
  delivered_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_recipients_user_id ON recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_recipients_asset_id ON asset_recipients(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_recipients_recipient_id ON asset_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_legacy_records_user_id ON legacy_records(user_id);
CREATE INDEX IF NOT EXISTS idx_legacy_records_status ON legacy_records(status);
