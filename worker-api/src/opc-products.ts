import { Context } from 'hono';
import { OpcProduct } from './db';

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
      'SELECT * FROM opc_products WHERE opc_id = ? ORDER BY created_at DESC'
    ).bind(opcId).all() as { results: OpcProduct[] };
    return c.json({ items: items.results });
  } catch (err) {
    console.error('list products error:', err);
    return c.json({ error: '获取产品列表失败' }, 500);
  }
}

export async function create(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    if (isNaN(opcId)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const body = await c.req.json() as { name?: string; description?: string; url?: string };
    if (!body.name || !body.name.trim()) return c.json({ error: '产品名称不能为空' }, 400);
    const result = await c.env.DB.prepare(
      'INSERT INTO opc_products (opc_id, user_id, name, description, url) VALUES (?, ?, ?, ?, ?)'
    ).bind(opcId, userId, body.name.trim(), body.description || '', body.url || '').run();
    const item = await c.env.DB.prepare('SELECT * FROM opc_products WHERE id = ?').bind(result.meta.last_row_id).first() as OpcProduct;
    return c.json({ item }, 201);
  } catch (err) {
    console.error('create product error:', err);
    return c.json({ error: '创建产品失败' }, 500);
  }
}

export async function update(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(opcId) || isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const existing = await c.env.DB.prepare('SELECT id FROM opc_products WHERE id = ? AND opc_id = ?').bind(id, opcId).first();
    if (!existing) return c.json({ error: '产品不存在' }, 404);
    const body = await c.req.json() as { name?: string; description?: string; url?: string };
    const updates: string[] = [];
    const values: (string | number)[] = [];
    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name.trim()); }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
    if (body.url !== undefined) { updates.push('url = ?'); values.push(body.url); }
    if (updates.length === 0) return c.json({ error: '没有需要更新的字段' }, 400);
    updates.push("updated_at = datetime('now')");
    values.push(id);
    await c.env.DB.prepare(`UPDATE opc_products SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
    const item = await c.env.DB.prepare('SELECT * FROM opc_products WHERE id = ?').bind(id).first() as OpcProduct;
    return c.json({ item });
  } catch (err) {
    console.error('update product error:', err);
    return c.json({ error: '更新产品失败' }, 500);
  }
}

export async function remove(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(opcId) || isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const info = await c.env.DB.prepare('DELETE FROM opc_products WHERE id = ? AND opc_id = ?').bind(id, opcId).run();
    if (info.meta.changes === 0) return c.json({ error: '产品不存在' }, 404);
    return c.json({ message: '已删除' });
  } catch (err) {
    console.error('delete product error:', err);
    return c.json({ error: '删除产品失败' }, 500);
  }
}
