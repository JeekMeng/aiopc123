import { Context } from 'hono';

interface SiteData {
  id: string;
  name: string;
  url: string;
  logo: string;
  company: string;
  category: string[];
  tags: string[];
  score: number;
  description: string;
}

export async function syncSites(c: Context): Promise<Response> {
  try {
    const body = await c.req.json() as SiteData[];
    if (!Array.isArray(body)) return c.json({ error: '数据格式错误' }, 400);

    let count = 0;
    for (const s of body) {
      if (!s.id || !s.name) continue;
      await c.env.DB.prepare(
        `INSERT OR REPLACE INTO nav_sites (id, name, title, url, description, logo, category, tags, score, company, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        String(s.id),
        s.name,
        s.name + (s.company ? ' - ' + s.company : ''),
        s.url || '',
        s.description || '',
        s.logo || '',
        JSON.stringify(s.category || []),
        JSON.stringify(s.tags || []),
        s.score || 0,
        s.company || ''
      ).run();
      count++;
    }

    return c.json({ success: true, count });
  } catch (err) {
    console.error('sync sites error:', err);
    return c.json({ error: '同步失败: ' + (err as Error).message }, 500);
  }
}

export async function listSites(c: Context): Promise<Response> {
  try {
    const q = c.req.query('q') || '';
    let results;
    if (q) {
      const like = `%${q}%`;
      results = await c.env.DB.prepare(
        `SELECT * FROM nav_sites WHERE name LIKE ? OR description LIKE ? OR tags LIKE ? OR company LIKE ? ORDER BY score DESC LIMIT 200`
      ).bind(like, like, like, like).all();
    } else {
      results = await c.env.DB.prepare(
        `SELECT * FROM nav_sites ORDER BY score DESC LIMIT 200`
      ).all();
    }
    const items = (results.results || []).map((r: any) => ({
      ...r,
      category: (() => { try { return JSON.parse(r.category || '[]'); } catch { return []; } })(),
      tags: (() => { try { return JSON.parse(r.tags || '[]'); } catch { return []; } })(),
    }));
    return c.json({ items, total: items.length });
  } catch (err) {
    console.error('list nav_sites error:', err);
    return c.json({ error: '查询失败' }, 500);
  }
}

export async function listLogos(c: Context): Promise<Response> {
  try {
    const results = await c.env.DB.prepare(
      `SELECT name, logo FROM nav_sites ORDER BY score DESC`
    ).all();
    return c.json({ items: results.results || [] });
  } catch (err) {
    console.error('list logos error:', err);
    return c.json({ error: '查询失败' }, 500);
  }
}
