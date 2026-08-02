import { Context } from 'hono';

function safeParseJSON(str: string | null | undefined, fallback: any): any {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

function parsePolicy(p: Record<string, any>): any {
  return {
    ...p,
    benefits: safeParseJSON(p.benefits, []),
    links: safeParseJSON(p.links, {}),
    communities: safeParseJSON(p.communities, []),
    tags: safeParseJSON(p.tags, []),
  };
}

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
    return c.json((result.results as any[]).map(parsePolicy));
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
    return c.json(parsePolicy(policy as Record<string, any>));
  } catch (err) {
    console.error('get policy error:', err);
    return c.json({ error: '获取政策失败' }, 500);
  }
}

export async function getPolicyStats(c: Context): Promise<Response> {
  try {
    const DB = c.env.DB;

    const results = await Promise.all([
      DB.prepare('SELECT COUNT(*) as count FROM policies').first(),
      DB.prepare('SELECT DISTINCT city FROM policies ORDER BY city').all(),
      DB.prepare('SELECT province, COUNT(*) as count, COUNT(DISTINCT city) as cities FROM policies GROUP BY province ORDER BY count DESC').all(),
      DB.prepare("SELECT substr(publish_date,1,4) as year, COUNT(*) as count FROM policies WHERE publish_date != '' GROUP BY year ORDER BY year").all(),
      DB.prepare('SELECT category, COUNT(*) as count FROM policies GROUP BY category ORDER BY count DESC').all(),
      DB.prepare('SELECT level, COUNT(*) as count FROM policies GROUP BY level ORDER BY count DESC').all(),
      DB.prepare('SELECT landing_status, COUNT(*) as count FROM policies GROUP BY landing_status').all(),
      DB.prepare('SELECT city, province, COUNT(*) as count FROM policies GROUP BY city ORDER BY count DESC LIMIT 20').all(),
      DB.prepare('SELECT benefits, requirements, tags FROM policies').all(),
    ]);

    const totalResult = results[0] as any;
    const citiesResult = results[1] as any;
    const provinceResult = results[2] as any;
    const yearResult = results[3] as any;
    const categoryResult = results[4] as any;
    const levelResult = results[5] as any;
    const landingResult = results[6] as any;
    const cityTopResult = results[7] as any;
    const allPolicies = results[8] as any;

    const itemCounts = new Map<string, number>();
    const fundingItems: { policy: string; item: string; amount: number; city: string }[] = [];
    const allIndustries = new Set<string>();

    for (const row of allPolicies.results) {
      if (row.benefits) {
        try {
          const benefits = JSON.parse(row.benefits);
          for (const b of benefits) {
            if (b?.item) {
              itemCounts.set(b.item, (itemCounts.get(b.item) || 0) + 1);
            }
            const amt = Number(b?.amount_max) || 0;
            if (amt > 0) {
              fundingItems.push({ policy: '', item: b.item || '', amount: amt, city: '' });
            }
          }
        } catch { /* skip */ }
      }
      if (row.requirements) {
        try {
          const req = JSON.parse(row.requirements);
          if (req?.industries) {
            for (const ind of req.industries) {
              if (ind) allIndustries.add(ind);
            }
          }
        } catch { /* skip */ }
      }
    }

    const benefitTags = [...itemCounts.entries()]
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    fundingItems.sort((a, b) => b.amount - a.amount);

    return c.json({
      total: totalResult?.count || 0,
      cities: citiesResult.results.map((r: any) => r.city),
      province_stats: provinceResult.results,
      year_stats: yearResult.results,
      category_stats: categoryResult.results,
      level_stats: levelResult.results,
      landing_stats: landingResult.results,
      city_top: cityTopResult.results,
      benefit_tags: benefitTags,
      funding_top: fundingItems.slice(0, 10),
      industry_count: allIndustries.size,
    });
  } catch (err) {
    console.error('get policy stats error:', err);
    return c.json({ error: '获取统计失败' }, 500);
  }
}
