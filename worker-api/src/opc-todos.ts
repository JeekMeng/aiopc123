import { Context } from 'hono';
import { OpcTodo } from './db';

async function verifyOpcOwnership(c: Context, opcId: number, userId: number): Promise<boolean> {
  const row = await c.env.DB.prepare('SELECT id FROM opcs WHERE id = ? AND user_id = ?').bind(opcId, userId).first();
  return !!row;
}

export async function list(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    if (isNaN(opcId)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const items = await c.env.DB.prepare(
      "SELECT * FROM opc_todos WHERE opc_id = ? ORDER BY done ASC, CASE WHEN due_date = '' THEN 1 ELSE 0 END ASC, due_date ASC, created_at DESC"
    ).bind(opcId).all() as { results: OpcTodo[] };
    return c.json({ items: items.results });
  } catch (err) {
    console.error('list todos error:', err);
    return c.json({ error: '获取待办列表失败' }, 500);
  }
}

export async function create(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    if (isNaN(opcId)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const body = await c.req.json() as { text?: string; priority?: string; due_date?: string };
    if (!body.text || !body.text.trim()) return c.json({ error: '待办内容不能为空' }, 400);
    const priority = ['low', 'medium', 'high'].includes(body.priority || '') ? body.priority : 'medium';
    const dueDate = body.due_date || '';
    const result = await c.env.DB.prepare(
      'INSERT INTO opc_todos (opc_id, user_id, text, priority, due_date) VALUES (?, ?, ?, ?, ?)'
    ).bind(opcId, userId, body.text.trim(), priority, dueDate).run();
    const item = await c.env.DB.prepare('SELECT * FROM opc_todos WHERE id = ?').bind(result.meta.last_row_id).first() as OpcTodo;
    return c.json({ item }, 201);
  } catch (err) {
    console.error('create todo error:', err);
    return c.json({ error: '创建待办失败' }, 500);
  }
}

export async function update(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(opcId) || isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const existing = await c.env.DB.prepare('SELECT id FROM opc_todos WHERE id = ? AND opc_id = ?').bind(id, opcId).first();
    if (!existing) return c.json({ error: '待办不存在' }, 404);
    const body = await c.req.json() as { text?: string; priority?: string; done?: boolean; due_date?: string };
    const updates: string[] = [];
    const values: (string | number)[] = [];
    if (body.text !== undefined) { updates.push('text = ?'); values.push(body.text.trim()); }
    if (body.priority !== undefined) { updates.push('priority = ?'); values.push(body.priority); }
    if (body.done !== undefined) { updates.push('done = ?'); values.push(body.done ? 1 : 0); }
    if (body.due_date !== undefined) { updates.push('due_date = ?'); values.push(body.due_date); }
    if (updates.length === 0) return c.json({ error: '没有需要更新的字段' }, 400);
    updates.push("updated_at = datetime('now')");
    values.push(id);
    await c.env.DB.prepare(`UPDATE opc_todos SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
    const item = await c.env.DB.prepare('SELECT * FROM opc_todos WHERE id = ?').bind(id).first() as OpcTodo;
    return c.json({ item });
  } catch (err) {
    console.error('update todo error:', err);
    return c.json({ error: '更新待办失败' }, 500);
  }
}

export async function remove(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(opcId) || isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const info = await c.env.DB.prepare('DELETE FROM opc_todos WHERE id = ? AND opc_id = ?').bind(id, opcId).run();
    if (info.meta.changes === 0) return c.json({ error: '待办不存在' }, 404);
    return c.json({ message: '已删除' });
  } catch (err) {
    console.error('delete todo error:', err);
    return c.json({ error: '删除待办失败' }, 500);
  }
}
