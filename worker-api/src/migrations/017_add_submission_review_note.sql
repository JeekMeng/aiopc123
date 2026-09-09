-- 017: 给 submissions 添加审核备注字段
ALTER TABLE submissions ADD COLUMN review_note TEXT DEFAULT '';
