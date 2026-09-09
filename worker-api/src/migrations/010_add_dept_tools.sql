-- 010: 部门表新增 tools 字段，存储 AI 工具列表

ALTER TABLE opc_departments ADD COLUMN tools TEXT DEFAULT '[]';
-- tools: JSON 数组，格式：
-- [{"name":"Claude","icon":"fa-robot","url":"https://claude.ai","bg":"#10A37F"}]
