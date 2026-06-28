import { Context } from 'hono';

export async function listPolicies(c: Context): Promise<Response> {
  try {
    const { city, status, province } = c.req.query();
    let sql = 'SELECT * FROM policies WHERE 1=1';
    const params: string[] = [];
    if (city) { sql += ' AND city = ?'; params.push(city); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (province) { sql += ' AND province = ?'; params.push(province); }
    sql += ' ORDER BY publish_date DESC';
    const result = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json(result.results);
  } catch (err) {
    console.error('list policies error:', err);
    return c.json({ error: '获取政策列表失败' }, 500);
  }
}

export async function getPolicy(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id')!;
    const policy = await c.env.DB.prepare('SELECT * FROM policies WHERE id = ?').bind(id).first();
    if (!policy) return c.json({ error: '政策不存在' }, 404);
    return c.json(policy);
  } catch (err) {
    console.error('get policy error:', err);
    return c.json({ error: '获取政策失败' }, 500);
  }
}

export async function getPolicyStats(c: Context): Promise<Response> {
  try {
    const totalResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM policies').first<{ count: number }>();
    const citiesResult = await c.env.DB.prepare('SELECT DISTINCT city FROM policies ORDER BY city').all<{ city: string }>();
    const allPolicies = await c.env.DB.prepare('SELECT benefits FROM policies').all<{ benefits: string }>();

    const itemCounts = new Map<string, number>();
    for (const row of allPolicies.results) {
      if (!row.benefits) continue;
      try {
        const benefits = JSON.parse(row.benefits);
        for (const b of benefits) {
          if (b.item) itemCounts.set(b.item, (itemCounts.get(b.item) || 0) + 1);
        }
      } catch { /* skip invalid JSON */ }
    }
    const benefitTags = [...itemCounts.entries()]
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    return c.json({
      total: totalResult?.count || 0,
      cities: citiesResult.results.map(r => r.city),
      benefit_tags: benefitTags,
    });
  } catch (err) {
    console.error('get policy stats error:', err);
    return c.json({ error: '获取统计失败' }, 500);
  }
}
