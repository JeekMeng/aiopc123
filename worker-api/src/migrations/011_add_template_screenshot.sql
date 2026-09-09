-- 011: 模板表新增 screenshot 字段，存放模板截图（base64 data URL）

ALTER TABLE opc_templates ADD COLUMN screenshot TEXT DEFAULT '';
