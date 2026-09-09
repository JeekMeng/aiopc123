-- 009: opcs 表增加 slogan, contact_phone, contact_email, industry, sub_category 字段
ALTER TABLE opcs ADD COLUMN slogan TEXT DEFAULT '';
ALTER TABLE opcs ADD COLUMN contact_phone TEXT DEFAULT '';
ALTER TABLE opcs ADD COLUMN contact_email TEXT DEFAULT '';
ALTER TABLE opcs ADD COLUMN industry TEXT DEFAULT '';
ALTER TABLE opcs ADD COLUMN sub_category TEXT DEFAULT '';
