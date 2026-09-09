CREATE TABLE IF NOT EXISTS nav_sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  url TEXT,
  description TEXT,
  logo TEXT,
  category TEXT DEFAULT '[]',
  tags TEXT DEFAULT '[]',
  score REAL DEFAULT 0,
  company TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
