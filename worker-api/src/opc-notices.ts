import { Context } from 'hono';
import { OpcNotice } from './db';

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
      'SELECT * FROM opc_notices WHERE opc_id = ? ORDER BY created_at DESC'
    ).bind(opcId).all() as { results: OpcNotice[] };
    return c.json({ items: items.results });
  } catch (err) {
    console.error('list notices error:', err);
    return c.json({ error: '获取通知列表失败' }, 500);
  }
}

export async function create(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    if (isNaN(opcId)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const body = await c.req.json() as { type?: string; title?: string; content?: string };
    if (!body.title || !body.title.trim()) return c.json({ error: '通知标题不能为空' }, 400);
    const type = ['system', 'product', 'dept', 'todo'].includes(body.type || '') ? body.type : 'system';
    const result = await c.env.DB.prepare(
      'INSERT INTO opc_notices (opc_id, user_id, type, title, content) VALUES (?, ?, ?, ?, ?)'
    ).bind(opcId, userId, type, body.title.trim(), body.content || '').run();
    const item = await c.env.DB.prepare('SELECT * FROM opc_notices WHERE id = ?').bind(result.meta.last_row_id).first() as OpcNotice;
    return c.json({ item }, 201);
  } catch (err) {
    console.error('create notice error:', err);
    return c.json({ error: '创建通知失败' }, 500);
  }
}

export async function markRead(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(opcId) || isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    await c.env.DB.prepare('UPDATE opc_notices SET is_read = 1 WHERE id = ? AND opc_id = ?').bind(id, opcId).run();
    return c.json({ message: '已标记' });
  } catch (err) {
    console.error('mark notice read error:', err);
    return c.json({ error: '操作失败' }, 500);
  }
}

export async function markAllRead(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    if (isNaN(opcId)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    await c.env.DB.prepare('UPDATE opc_notices SET is_read = 1 WHERE opc_id = ? AND is_read = 0').bind(opcId).run();
    return c.json({ message: '已全部标记' });
  } catch (err) {
    console.error('mark all read error:', err);
    return c.json({ error: '操作失败' }, 500);
  }
}

export async function remove(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(opcId) || isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const info = await c.env.DB.prepare('DELETE FROM opc_notices WHERE id = ? AND opc_id = ?').bind(id, opcId).run();
    if (info.meta.changes === 0) return c.json({ error: '通知不存在' }, 404);
    return c.json({ message: '已删除' });
  } catch (err) {
    console.error('delete notice error:', err);
    return c.json({ error: '删除通知失败' }, 500);
  }
}
