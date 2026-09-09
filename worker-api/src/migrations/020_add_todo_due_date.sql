-- 020: 待办事项新增 due_date 字段
ALTER TABLE opc_todos ADD COLUMN due_date TEXT DEFAULT '';
