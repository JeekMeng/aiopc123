import { Context } from 'hono';
import { OpcTemplate } from './db';

function parseJsonField(val: string | undefined, fallback: string): string {
  if (!val) return fallback;
  try { JSON.parse(val); return val; } catch { return fallback; }
}

function parseDepartments(raw: string | undefined): any[] {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

// 用户端：获取启用的模板列表（可按行业筛选）
export async function listPublic(c: Context): Promise<Response> {
  try {
    const industry = c.req.query('industry');
    let query = 'SELECT * FROM opc_templates WHERE is_active = 1';
    const params: string[] = [];
    if (industry) {
      query += ' AND industry = ?';
      params.push(industry);
    }
    query += ' ORDER BY sort_order ASC, id ASC';
    const result = params.length
      ? await c.env.DB.prepare(query).bind(...params).all() as { results: OpcTemplate[] }
      : await c.env.DB.prepare(query).all() as { results: OpcTemplate[] };
    const templates = result.results.map(t => ({
      ...t,
      departments: parseDepartments(t.departments),
    }));
    return c.json({ templates });
  } catch (err) {
    console.error('list public templates error:', err);
    return c.json({ error: '获取模板列表失败' }, 500);
  }
}

// 管理员：获取全部模板
export async function listAdmin(c: Context): Promise<Response> {
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM opc_templates ORDER BY sort_order ASC, id ASC'
    ).all() as { results: OpcTemplate[] };
    const templates = result.results.map(t => ({
      ...t,
      departments: parseDepartments(t.departments),
    }));
    return c.json({ templates });
  } catch (err) {
    console.error('admin list templates error:', err);
    return c.json({ error: '获取模板列表失败' }, 500);
  }
}

// 管理员：创建模板
export async function create(c: Context): Promise<Response> {
  try {
    const body = await c.req.json() as {
      name?: string; industry?: string; description?: string;
      screenshot?: string; step_data?: string; departments?: string;
      sort_order?: number; is_active?: number;
    };
    if (!body.name || !body.name.trim()) return c.json({ error: '模板名称不能为空' }, 400);
    if (!body.industry || !body.industry.trim()) return c.json({ error: '行业类型不能为空' }, 400);
    const stepData = parseJsonField(body.step_data, '{}');
    const departments = parseJsonField(body.departments, '[]');
    const result = await c.env.DB.prepare(
      `INSERT INTO opc_templates (name, industry, description, screenshot, step_data, departments, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.name.trim(), body.industry.trim(), body.description || '',
      body.screenshot || '', stepData, departments,
      body.sort_order || 0, body.is_active !== undefined ? body.is_active : 1
    ).run();
    const item = await c.env.DB.prepare('SELECT * FROM opc_templates WHERE id = ?')
      .bind(result.meta.last_row_id).first() as OpcTemplate;
    return c.json({ template: { ...item, departments: parseDepartments(item.departments) } }, 201);
  } catch (err) {
    console.error('create template error:', err);
    return c.json({ error: '创建模板失败' }, 500);
  }
}

// 管理员：更新模板
export async function update(c: Context): Promise<Response> {
  try {
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    const existing = await c.env.DB.prepare('SELECT id FROM opc_templates WHERE id = ?').bind(id).first();
    if (!existing) return c.json({ error: '模板不存在' }, 404);
    const body = await c.req.json() as {
      name?: string; industry?: string; description?: string;
      screenshot?: string; step_data?: string; departments?: string;
      sort_order?: number; is_active?: number;
    };
    const updates: string[] = [];
    const values: (string | number)[] = [];
    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name.trim()); }
    if (body.industry !== undefined) { updates.push('industry = ?'); values.push(body.industry.trim()); }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
    if (body.screenshot !== undefined) { updates.push('screenshot = ?'); values.push(body.screenshot); }
    if (body.step_data !== undefined) {
      updates.push('step_data = ?'); values.push(parseJsonField(body.step_data, '{}'));
    }
    if (body.departments !== undefined) {
      updates.push('departments = ?'); values.push(parseJsonField(body.departments, '[]'));
    }
    if (body.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(body.sort_order); }
    if (body.is_active !== undefined) { updates.push('is_active = ?'); values.push(body.is_active); }
    if (updates.length === 0) return c.json({ error: '没有需要更新的字段' }, 400);
    updates.push("updated_at = datetime('now')");
    values.push(id);
    await c.env.DB.prepare(`UPDATE opc_templates SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
    const item = await c.env.DB.prepare('SELECT * FROM opc_templates WHERE id = ?').bind(id).first() as OpcTemplate;
    return c.json({ template: { ...item, departments: parseDepartments(item.departments) } });
  } catch (err) {
    console.error('update template error:', err);
    return c.json({ error: '更新模板失败' }, 500);
  }
}

// 管理员：删除模板
export async function remove(c: Context): Promise<Response> {
  try {
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    const info = await c.env.DB.prepare('DELETE FROM opc_templates WHERE id = ?').bind(id).run();
    if (info.meta.changes === 0) return c.json({ error: '模板不存在' }, 404);
    return c.json({ message: '已删除' });
  } catch (err) {
    console.error('delete template error:', err);
    return c.json({ error: '删除模板失败' }, 500);
  }
}

// 用户：将 OPC 分享为公开模板
export async function shareTemplate(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcId = parseInt(c.req.param('id')!, 10);
    if (isNaN(opcId)) return c.json({ error: '无效的ID' }, 400);
    // 验证 OPC 所有权
    const opc = await c.env.DB.prepare(
      'SELECT id, name, industry, sub_category, slogan, description, address FROM opcs WHERE id = ? AND user_id = ?'
    ).bind(opcId, userId).first() as any;
    if (!opc) return c.json({ error: '一人公司不存在' }, 404);

    const body = await c.req.json() as { step_data?: string; template_name?: string };
    const stepData = body.step_data || '{}';
    try { JSON.parse(stepData); } catch { return c.json({ error: '路线图数据格式错误' }, 400); }

    const tplName = body.template_name || (opc.name + '模板');
    const industry = opc.industry || '其他';

    const result = await c.env.DB.prepare(
      `INSERT INTO opc_templates (name, industry, description, step_data, sort_order, is_active)
       VALUES (?, ?, ?, ?, 0, 1)`
    ).bind(tplName, industry, opc.description || opc.slogan || '', stepData).run();

    const item = await c.env.DB.prepare('SELECT * FROM opc_templates WHERE id = ?')
      .bind(result.meta.last_row_id).first();

    // 分享成功后加积分（提交审核 +10）
    let earned = 0;
    try {
      const user = await c.env.DB.prepare('SELECT points, vip_level FROM users WHERE id = ?').bind(userId).first() as { points: number; vip_level: string } | null;
      if (user) {
        const multiplier: Record<string, number> = { '': 1, 'vip': 1.5, 'svip': 2 };
        earned = Math.floor(10 * (multiplier[user.vip_level] || 1));
        const maxPts: Record<string, number> = { '': 500, 'vip': 2000, 'svip': 999999 };
        const max = maxPts[user.vip_level] || 500;
        const newPts = Math.min((user.points || 0) + earned, max);
        await c.env.DB.prepare('UPDATE users SET points = ? WHERE id = ?').bind(newPts, userId).run();
        await c.env.DB.prepare('INSERT INTO point_logs (user_id, amount, type, action, description, ref_id) VALUES (?, ?, ?, ?, ?, ?)').bind(userId, earned, 'earn', 'share_template', '分享模板 +' + earned, result.meta.last_row_id).run();
      }
    } catch (e) { console.error('add points error:', e); }

    return c.json({ template: item, earned }, 201);
  } catch (err) {
    console.error('share template error:', err);
    return c.json({ error: '分享模板失败' }, 500);
  }
}
