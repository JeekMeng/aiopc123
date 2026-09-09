-- 015: 给 opc_departments 添加 sort_order 字段，支持拖拽排序
ALTER TABLE opc_departments ADD COLUMN sort_order INTEGER DEFAULT 0;
