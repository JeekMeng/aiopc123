import { Context } from 'hono';
import { OpcDepartment } from './db';

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
      'SELECT * FROM opc_departments WHERE opc_id = ? ORDER BY sort_order ASC, id ASC'
    ).bind(opcId).all() as { results: OpcDepartment[] };
    // Parse tools JSON for each item
    const parsed = items.results.map(d => {
      let tools: any[] = [];
      try { tools = JSON.parse(d.tools || '[]'); } catch { tools = []; }
      return { ...d, tools };
    });
    return c.json({ items: parsed });
  } catch (err) {
    console.error('list departments error:', err);
    return c.json({ error: '获取部门列表失败' }, 500);
  }
}

export async function create(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    if (isNaN(opcId)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const body = await c.req.json() as { name?: string; description?: string; leader?: string; tools?: any[] };
    if (!body.name || !body.name.trim()) return c.json({ error: '部门名称不能为空' }, 400);
    const toolsJson = JSON.stringify(body.tools || []);
    const result = await c.env.DB.prepare(
      'INSERT INTO opc_departments (opc_id, user_id, name, description, leader, tools) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(opcId, userId, body.name.trim(), body.description || '', body.leader || '', toolsJson).run();
    const item = await c.env.DB.prepare('SELECT * FROM opc_departments WHERE id = ?').bind(result.meta.last_row_id).first() as OpcDepartment;
    let parsedTools: any[] = [];
    try { parsedTools = JSON.parse(item.tools || '[]'); } catch { parsedTools = []; }
    return c.json({ item: { ...item, tools: parsedTools } }, 201);
  } catch (err) {
    console.error('create department error:', err);
    return c.json({ error: '创建部门失败' }, 500);
  }
}

export async function update(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(opcId) || isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const existing = await c.env.DB.prepare('SELECT id FROM opc_departments WHERE id = ? AND opc_id = ?').bind(id, opcId).first();
    if (!existing) return c.json({ error: '部门不存在' }, 404);
    const body = await c.req.json() as { name?: string; description?: string; leader?: string; tools?: any[] };
    const updates: string[] = [];
    const values: (string | number)[] = [];
    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name.trim()); }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
    if (body.leader !== undefined) { updates.push('leader = ?'); values.push(body.leader); }
    if (body.tools !== undefined) { updates.push('tools = ?'); values.push(JSON.stringify(body.tools)); }
    if (updates.length === 0) return c.json({ error: '没有需要更新的字段' }, 400);
    updates.push("updated_at = datetime('now')");
    values.push(id);
    await c.env.DB.prepare(`UPDATE opc_departments SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
    const item = await c.env.DB.prepare('SELECT * FROM opc_departments WHERE id = ?').bind(id).first() as OpcDepartment;
    let parsedTools: any[] = [];
    try { parsedTools = JSON.parse(item.tools || '[]'); } catch { parsedTools = []; }
    return c.json({ item: { ...item, tools: parsedTools } });
  } catch (err) {
    console.error('update department error:', err);
    return c.json({ error: '更新部门失败' }, 500);
  }
}

export async function remove(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(opcId) || isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const info = await c.env.DB.prepare('DELETE FROM opc_departments WHERE id = ? AND opc_id = ?').bind(id, opcId).run();
    if (info.meta.changes === 0) return c.json({ error: '部门不存在' }, 404);
    return c.json({ message: '已删除' });
  } catch (err) {
    console.error('delete department error:', err);
    return c.json({ error: '删除部门失败' }, 500);
  }
}

export async function addTool(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    const deptId = parseInt(c.req.param('deptId')!, 10);
    if (isNaN(opcId) || isNaN(deptId)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const dept = await c.env.DB.prepare('SELECT id, tools FROM opc_departments WHERE id = ? AND opc_id = ?').bind(deptId, opcId).first() as OpcDepartment | null;
    if (!dept) return c.json({ error: '部门不存在' }, 404);
    const body = await c.req.json() as { name?: string; url?: string; icon?: string; bg?: string; logo?: string };
    if (!body.name || !body.url) return c.json({ error: '工具名称和URL不能为空' }, 400);
    let tools: any[] = [];
    try { tools = JSON.parse(dept.tools || '[]'); } catch { tools = []; }
    tools.push({ name: body.name, url: body.url, icon: body.icon || 'fas fa-link', bg: body.bg || '#007AFF', logo: body.logo || '' });
    await c.env.DB.prepare("UPDATE opc_departments SET tools = ?, updated_at = datetime('now') WHERE id = ?").bind(JSON.stringify(tools), deptId).run();
    return c.json({ item: { id: deptId, tools } });
  } catch (err) {
    console.error('add tool error:', err);
    return c.json({ error: '添加工具失败' }, 500);
  }
}

export async function removeTool(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    const deptId = parseInt(c.req.param('deptId')!, 10);
    const toolIndex = parseInt(c.req.param('toolIndex')!, 10);
    if (isNaN(opcId) || isNaN(deptId) || isNaN(toolIndex)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const dept = await c.env.DB.prepare('SELECT id, tools FROM opc_departments WHERE id = ? AND opc_id = ?').bind(deptId, opcId).first() as OpcDepartment | null;
    if (!dept) return c.json({ error: '部门不存在' }, 404);
    let tools: any[] = [];
    try { tools = JSON.parse(dept.tools || '[]'); } catch { tools = []; }
    if (toolIndex < 0 || toolIndex >= tools.length) return c.json({ error: '工具索引无效' }, 400);
    tools.splice(toolIndex, 1);
    await c.env.DB.prepare("UPDATE opc_departments SET tools = ?, updated_at = datetime('now') WHERE id = ?").bind(JSON.stringify(tools), deptId).run();
    return c.json({ item: { id: deptId, tools } });
  } catch (err) {
    console.error('remove tool error:', err);
    return c.json({ error: '删除工具失败' }, 500);
  }
}

export async function replaceTools(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    const deptId = parseInt(c.req.param('deptId')!, 10);
    if (isNaN(opcId) || isNaN(deptId)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const dept = await c.env.DB.prepare('SELECT id FROM opc_departments WHERE id = ? AND opc_id = ?').bind(deptId, opcId).first();
    if (!dept) return c.json({ error: '部门不存在' }, 404);
    const body = await c.req.json() as { tools?: any[] };
    if (!Array.isArray(body.tools)) return c.json({ error: 'tools 必须是数组' }, 400);
    await c.env.DB.prepare("UPDATE opc_departments SET tools = ?, updated_at = datetime('now') WHERE id = ?").bind(JSON.stringify(body.tools), deptId).run();
    return c.json({ item: { id: deptId, tools: body.tools } });
  } catch (err) {
    console.error('replace tools error:', err);
    return c.json({ error: '更新工具失败' }, 500);
  }
}

// 批量更新部门排序
export async function reorder(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('opcId')!, 10);
    if (isNaN(opcId)) return c.json({ error: '无效的ID' }, 400);
    if (!await verifyOpcOwnership(c, opcId, userId)) return c.json({ error: '无权限' }, 403);
    const body = await c.req.json() as { ids?: number[] };
    if (!Array.isArray(body.ids) || !body.ids.length) return c.json({ error: 'ids 必须是非空数组' }, 400);
    // 逐个更新 sort_order
    for (let i = 0; i < body.ids.length; i++) {
      await c.env.DB.prepare(
        "UPDATE opc_departments SET sort_order = ?, updated_at = datetime('now') WHERE id = ? AND opc_id = ?"
      ).bind(i, body.ids[i], opcId).run();
    }
    return c.json({ ok: true });
  } catch (err) {
    console.error('reorder departments error:', err);
    return c.json({ error: '排序更新失败' }, 500);
  }
}
