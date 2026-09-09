-- 006: OPC 子功能表（产品、部门、待办、通知）

CREATE TABLE IF NOT EXISTS opc_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opc_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (opc_id) REFERENCES opcs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS opc_departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opc_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  leader TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (opc_id) REFERENCES opcs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS opc_todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opc_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  done INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (opc_id) REFERENCES opcs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS opc_notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opc_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  type TEXT DEFAULT 'system',
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (opc_id) REFERENCES opcs(id) ON DELETE CASCADE
);
