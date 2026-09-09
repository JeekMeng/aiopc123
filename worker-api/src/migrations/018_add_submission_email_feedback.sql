-- 018: submissions 添加电子邮箱和反馈方式字段
ALTER TABLE submissions ADD COLUMN email TEXT DEFAULT '';
ALTER TABLE submissions ADD COLUMN feedback_method TEXT DEFAULT 'page';
