-- 019: submissions 添加审核时间和审核人员字段
ALTER TABLE submissions ADD COLUMN reviewed_at TEXT DEFAULT '';
ALTER TABLE submissions ADD COLUMN reviewed_by TEXT DEFAULT '';
