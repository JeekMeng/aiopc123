import { Context } from 'hono';
import { Opc } from './db';

const VIP_OPC_LIMITS: Record<string, number> = {
  '': 1,
  'vip': 3,
  'svip': 10,
  'admin': 10,
};

const OPC_FIELDS = 'id, user_id, name, description, logo, address, website, slogan, contact_phone, contact_email, industry, sub_category, is_active, is_default, created_at, updated_at';

export async function list(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const opcs = await c.env.DB.prepare(
      `SELECT ${OPC_FIELDS} FROM opcs WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`
    ).bind(userId).all() as { results: Opc[] };
    return c.json({ opcs: opcs.results });
  } catch (err) {
    console.error('list opcs error:', err);
    return c.json({ error: '获取一人公司列表失败' }, 500);
  }
}

export async function getOne(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    const opc = await c.env.DB.prepare(
      `SELECT ${OPC_FIELDS} FROM opcs WHERE id = ? AND user_id = ?`
    ).bind(id, userId).first() as Opc | null;
    if (!opc) return c.json({ error: '一人公司不存在' }, 404);
    return c.json({ opc });
  } catch (err) {
    console.error('get opc error:', err);
    return c.json({ error: '获取一人公司信息失败' }, 500);
  }
}

export async function create(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const body = await c.req.json() as {
      name: string;
      description?: string;
      logo?: string;
      address?: string;
      website?: string;
      slogan?: string;
      contact_phone?: string;
      contact_email?: string;
      industry?: string;
      sub_category?: string;
      departments?: { name: string; description?: string; leader?: string; tools?: any[] }[];
      products?: { name: string; description?: string; url?: string }[];
    };

    if (!body.name || !body.name.trim()) {
      return c.json({ error: '公司名称不能为空' }, 400);
    }

    const user = await c.env.DB.prepare(
      'SELECT vip_level FROM users WHERE id = ?'
    ).bind(userId).first() as { vip_level: string } | null;
    if (!user) return c.json({ error: '用户不存在' }, 404);

    const vipLevel = user.vip_level || '';
    const limit = VIP_OPC_LIMITS[vipLevel] ?? 1;

    const existing = await c.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM opcs WHERE user_id = ?'
    ).bind(userId).first() as { cnt: number };

    if (existing.cnt >= limit) {
      return c.json({ error: `已达创建上限（${limit}个），请升级会员` }, 403);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO opcs (user_id, name, description, logo, address, website, slogan, contact_phone, contact_email, industry, sub_category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId,
      body.name.trim(),
      body.description || '',
      body.logo || '',
      body.address || '',
      body.website || '',
      body.slogan || '',
      body.contact_phone || '',
      body.contact_email || '',
      body.industry || '',
      body.sub_category || ''
    ).run();

    const opcId = result.meta.last_row_id as number;

    // 批量创建部门（含 tools）
    if (body.departments && body.departments.length > 0) {
      const stmt = await c.env.DB.prepare(
        'INSERT INTO opc_departments (opc_id, user_id, name, description, leader, tools) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const dept of body.departments) {
        if (dept.name && dept.name.trim()) {
          const toolsJson = JSON.stringify(dept.tools || []);
          await stmt.bind(opcId, userId, dept.name.trim(), dept.description || '', dept.leader || '', toolsJson).run();
        }
      }
    }

    // 批量创建产品
    if (body.products && body.products.length > 0) {
      const stmt = await c.env.DB.prepare(
        'INSERT INTO opc_products (opc_id, user_id, name, description, url) VALUES (?, ?, ?, ?, ?)'
      );
      for (const prod of body.products) {
        if (prod.name && prod.name.trim()) {
          await stmt.bind(opcId, userId, prod.name.trim(), prod.description || '', prod.url || '').run();
        }
      }
    }

    const opc = await c.env.DB.prepare(
      `SELECT ${OPC_FIELDS} FROM opcs WHERE id = ?`
    ).bind(opcId).first() as Opc;

    return c.json({ opc }, 201);
  } catch (err) {
    console.error('create opc error:', err);
    return c.json({ error: '创建一人公司失败' }, 500);
  }
}

export async function update(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(id)) return c.json({ error: '无效的ID' }, 400);

    const existing = await c.env.DB.prepare(
      'SELECT id FROM opcs WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();
    if (!existing) return c.json({ error: '一人公司不存在' }, 404);

    const body = await c.req.json() as {
      name?: string;
      description?: string;
      logo?: string;
      address?: string;
      website?: string;
      slogan?: string;
      contact_phone?: string;
      contact_email?: string;
      industry?: string;
      sub_category?: string;
    };

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name.trim()); }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
    if (body.logo !== undefined) { updates.push('logo = ?'); values.push(body.logo); }
    if (body.address !== undefined) { updates.push('address = ?'); values.push(body.address); }
    if (body.website !== undefined) { updates.push('website = ?'); values.push(body.website); }
    if (body.slogan !== undefined) { updates.push('slogan = ?'); values.push(body.slogan); }
    if (body.contact_phone !== undefined) { updates.push('contact_phone = ?'); values.push(body.contact_phone); }
    if (body.contact_email !== undefined) { updates.push('contact_email = ?'); values.push(body.contact_email); }
    if (body.industry !== undefined) { updates.push('industry = ?'); values.push(body.industry); }
    if (body.sub_category !== undefined) { updates.push('sub_category = ?'); values.push(body.sub_category); }

    if (updates.length === 0) {
      return c.json({ error: '没有需要更新的字段' }, 400);
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    await c.env.DB.prepare(
      `UPDATE opcs SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const opc = await c.env.DB.prepare(
      `SELECT ${OPC_FIELDS} FROM opcs WHERE id = ?`
    ).bind(id).first() as Opc;

    return c.json({ opc });
  } catch (err) {
    console.error('update opc error:', err);
    return c.json({ error: '更新一人公司失败' }, 500);
  }
}

export async function remove(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(id)) return c.json({ error: '无效的ID' }, 400);

    const info = await c.env.DB.prepare(
      'DELETE FROM opcs WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();
    if (info.meta.changes === 0) return c.json({ error: '一人公司不存在' }, 404);
    return c.json({ message: '已删除' });
  } catch (err) {
    console.error('delete opc error:', err);
    return c.json({ error: '删除一人公司失败' }, 500);
  }
}

export async function setDefault(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    const existing = await c.env.DB.prepare('SELECT id FROM opcs WHERE id = ? AND user_id = ?').bind(id, userId).first();
    if (!existing) return c.json({ error: '一人公司不存在' }, 404);
    await c.env.DB.prepare('UPDATE opcs SET is_default = 0 WHERE user_id = ?').bind(userId).run();
    await c.env.DB.prepare('UPDATE opcs SET is_default = 1 WHERE id = ? AND user_id = ?').bind(id, userId).run();
    return c.json({ message: '已设为默认' });
  } catch (err) {
    console.error('set default opc error:', err);
    return c.json({ error: '设置默认失败' }, 500);
  }
}
