-- 016: 积分系统 —— users 加字段 + point_logs + sign_records 表

-- users 表新增积分字段
ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN streak_days INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_sign_date TEXT DEFAULT '';

-- 积分流水表
CREATE TABLE IF NOT EXISTS point_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT DEFAULT '',
  ref_id INTEGER DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 签到记录表
CREATE TABLE IF NOT EXISTS sign_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  sign_date TEXT NOT NULL,
  streak INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, sign_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
