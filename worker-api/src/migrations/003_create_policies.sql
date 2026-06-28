-- 迁移 003: 创建 policies 表
CREATE TABLE IF NOT EXISTS policies (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  city          TEXT NOT NULL,
  province      TEXT DEFAULT '',
  district      TEXT DEFAULT '',
  level         TEXT DEFAULT 'city',
  issuer        TEXT DEFAULT '',
  publish_date  TEXT DEFAULT '',
  status        TEXT DEFAULT 'active',
  category      TEXT DEFAULT '',
  summary       TEXT DEFAULT '',
  benefits      TEXT DEFAULT '[]',
  requirements  TEXT DEFAULT '',
  application   TEXT DEFAULT '',
  links         TEXT DEFAULT '{}',
  communities   TEXT DEFAULT '[]',
  tags          TEXT DEFAULT '[]',
  landing_status TEXT DEFAULT '',
  materials     TEXT DEFAULT '',
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_policies_city ON policies(city);
CREATE INDEX IF NOT EXISTS idx_policies_province ON policies(province);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_publish_date ON policies(publish_date);
