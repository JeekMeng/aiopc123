import { Context } from 'hono';

export async function adminListPolicies(c: Context): Promise<Response> {
  try {
    const { search } = c.req.query();
    let sql = 'SELECT * FROM policies';
    const params: string[] = [];
    if (search) {
      sql += " WHERE name LIKE ? OR city LIKE ? OR issuer LIKE ?";
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    sql += ' ORDER BY publish_date DESC';
    const result = await c.env.DB.prepare(sql).bind(...params).all();
    const policies = (result.results as any[]).map(p => ({
      ...p,
      benefits: safeParseJSON(p.benefits, []),
      links: safeParseJSON(p.links, {}),
      communities: safeParseJSON(p.communities, []),
      tags: safeParseJSON(p.tags, []),
    }));
    return c.json({ policies });
  } catch (err) {
    console.error('admin list policies error:', err);
    return c.json({ error: '获取政策列表失败' }, 500);
  }
}

export async function adminCreatePolicy(c: Context): Promise<Response> {
  try {
    const body = await c.req.json() as Record<string, any>;
    const { id, name, city, province, district, level, issuer, publish_date, status, category, summary, benefits, requirements, application, links, communities, tags, landing_status, materials } = body;
    if (!id || !name || !city) {
      return c.json({ error: '缺少必要字段 (id, name, city)' }, 400);
    }
    await c.env.DB.prepare(
      `INSERT INTO policies (id, name, city, province, district, level, issuer, publish_date, status, category, summary, benefits, requirements, application, links, communities, tags, landing_status, materials)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, name, city || '', province || '', district || '', level || 'city',
      issuer || '', publish_date || '', status || 'active', category || '',
      summary || '', JSON.stringify(benefits || []), requirements || '',
      application || '', JSON.stringify(links || {}), JSON.stringify(communities || []),
      JSON.stringify(tags || []), landing_status || '', materials || ''
    ).run();
    const policy = await c.env.DB.prepare('SELECT * FROM policies WHERE id = ?').bind(id).first();
    return c.json(policy, 201);
  } catch (err: any) {
    console.error('admin create policy error:', err);
    if (err?.message?.includes('UNIQUE constraint')) {
      return c.json({ error: '政策 ID 已存在' }, 409);
    }
    return c.json({ error: '创建政策失败' }, 500);
  }
}

export async function adminUpdatePolicy(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id')!;
    const existing = await c.env.DB.prepare('SELECT id FROM policies WHERE id = ?').bind(id).first();
    if (!existing) return c.json({ error: '政策不存在' }, 404);

    const body = await c.req.json() as Record<string, any>;
    const fields = ['name', 'city', 'province', 'district', 'level', 'issuer', 'publish_date', 'status', 'category', 'summary', 'requirements', 'application', 'landing_status', 'materials'];
    const jsonFields = ['benefits', 'links', 'communities', 'tags'];

    const setClauses: string[] = [];
    const params: any[] = [];

    for (const f of fields) {
      if (body[f] !== undefined) {
        setClauses.push(`${f} = ?`);
        params.push(body[f]);
      }
    }
    for (const f of jsonFields) {
      if (body[f] !== undefined) {
        setClauses.push(`${f} = ?`);
        params.push(JSON.stringify(body[f]));
      }
    }

    if (setClauses.length === 0) return c.json({ error: '没有需要更新的字段' }, 400);

    setClauses.push("updated_at = datetime('now')");
    params.push(id);

    await c.env.DB.prepare(`UPDATE policies SET ${setClauses.join(', ')} WHERE id = ?`).bind(...params).run();
    const policy = await c.env.DB.prepare('SELECT * FROM policies WHERE id = ?').bind(id).first();
    return c.json(policy);
  } catch (err) {
    console.error('admin update policy error:', err);
    return c.json({ error: '更新政策失败' }, 500);
  }
}

export async function adminDeletePolicy(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id')!;
    const result = await c.env.DB.prepare('DELETE FROM policies WHERE id = ?').bind(id).run();
    if (result.meta.changes === 0) return c.json({ error: '政策不存在' }, 404);
    return c.json({ message: '政策已删除' });
  } catch (err) {
    console.error('admin delete policy error:', err);
    return c.json({ error: '删除政策失败' }, 500);
  }
}

export async function adminImportPolicies(c: Context): Promise<Response> {
  try {
    const body = await c.req.json() as any;
    const policies = body.policies || body;
    if (!Array.isArray(policies)) {
      return c.json({ error: '格式错误，需要 policies 数组' }, 400);
    }

    let imported = 0;
    for (const p of policies) {
      try {
        await c.env.DB.prepare(
          `INSERT OR REPLACE INTO policies (id, name, city, province, district, level, issuer, publish_date, status, category, summary, benefits, requirements, application, links, communities, tags, landing_status, materials, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
          p.id, p.name, p.city || '', p.province || '', p.district || '', p.level || 'city',
          p.issuer || '', p.publish_date || '', p.status || 'active', p.category || '',
          p.summary || '', JSON.stringify(p.benefits || []), p.requirements || '',
          p.application || '', JSON.stringify(p.links || {}), JSON.stringify(p.communities || []),
          JSON.stringify(p.tags || []), p.landing_status || '', p.materials || ''
        ).run();
        imported++;
      } catch (err) {
        console.error(`import policy ${p.id} error:`, err);
      }
    }
    return c.json({ message: `导入完成`, imported, total: policies.length });
  } catch (err) {
    console.error('admin import policies error:', err);
    return c.json({ error: '导入政策失败' }, 500);
  }
}

export async function adminExportPolicies(c: Context): Promise<Response> {
  try {
    const policies = await c.env.DB.prepare('SELECT * FROM policies ORDER BY publish_date DESC').all();
    const parsed = (policies.results as any[]).map(p => ({
      ...p,
      benefits: safeParseJSON(p.benefits, []),
      links: safeParseJSON(p.links, {}),
      communities: safeParseJSON(p.communities, []),
      tags: safeParseJSON(p.tags, []),
    }));
    return c.json(parsed);
  } catch (err) {
    console.error('admin export policies error:', err);
    return c.json({ error: '导出政策失败' }, 500);
  }
}

function safeParseJSON(str: string | null | undefined, fallback: any): any {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}
