import { Context } from 'hono';
import { UserNotification } from './db';

export async function listNotifications(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const items = await c.env.DB.prepare(
      'SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(userId).all() as { results: UserNotification[] };
    const unread = await c.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM user_notifications WHERE user_id = ? AND is_read = 0'
    ).bind(userId).first() as { cnt: number };
    return c.json({ items: items.results, unread: unread.cnt });
  } catch (err) {
    console.error('listNotifications error:', err);
    return c.json({ error: '获取通知失败' }, 500);
  }
}

export async function markRead(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    await c.env.DB.prepare(
      'UPDATE user_notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();
    return c.json({ message: '已标记' });
  } catch (err) {
    console.error('markRead error:', err);
    return c.json({ error: '操作失败' }, 500);
  }
}

export async function markAllRead(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    await c.env.DB.prepare(
      'UPDATE user_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
    ).bind(userId).run();
    return c.json({ message: '全部已读' });
  } catch (err) {
    console.error('markAllRead error:', err);
    return c.json({ error: '操作失败' }, 500);
  }
}

export async function removeNotification(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    const info = await c.env.DB.prepare(
      'DELETE FROM user_notifications WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();
    if (info.meta.changes === 0) return c.json({ error: '通知不存在' }, 404);
    return c.json({ message: '已删除' });
  } catch (err) {
    console.error('removeNotification error:', err);
    return c.json({ error: '删除失败' }, 500);
  }
}

export async function generateNotifications(c: Context, userId: number): Promise<void> {
  try {
    const user = await c.env.DB.prepare(
      'SELECT id, city, industries, interests, notify_prefs FROM users WHERE id = ?'
    ).bind(userId).first() as any;
    if (!user) return;

    let prefs: any = {};
    try { prefs = JSON.parse(user.notify_prefs || '{}'); } catch {}
    let industries: string[] = [];
    try { industries = JSON.parse(user.industries || '[]'); } catch {}
    let interests: string[] = [];
    try { interests = JSON.parse(user.interests || '[]'); } catch {}

    const existing = await c.env.DB.prepare(
      'SELECT ref_id FROM user_notifications WHERE user_id = ? AND created_at > datetime("now", "-1 day")'
    ).bind(userId).all() as { results: { ref_id: string }[] };
    const existingIds = new Set(existing.results.map((r: any) => r.ref_id));

    const notifications: { type: string; title: string; content: string; link: string; ref_id: string }[] = [];

    // 1. 政策推送：查 D1 policies 表，按城市+行业匹配
    if (prefs.policy_push !== false) {
      try {
        const policies = await c.env.DB.prepare(
          'SELECT id, name, city, province, summary, requirements FROM policies WHERE status = ? LIMIT 30'
        ).bind('active').all() as { results: any[] };
        for (const p of policies.results) {
          if (existingIds.has('policy_' + p.id)) continue;
          const cityMatch = !user.city || p.city === user.city || p.province === user.province;
          let reqIndustries: string[] = [];
          try { reqIndustries = JSON.parse(p.requirements || '{}').industries || []; } catch {}
          const indMatch = !industries.length || !reqIndustries.length ||
            reqIndustries.some((ri: string) => industries.some((ui: string) => ri.includes(ui) || ui.includes(ri)));
          if (cityMatch && indMatch) {
            notifications.push({
              type: 'policy',
              title: `[${p.city}] ${p.name}`,
              content: p.summary || '',
              link: '/policies/#' + p.id,
              ref_id: 'policy_' + p.id
            });
          }
        }
      } catch (e) { console.error('policy push error:', e); }
    }

    // 2. 工具推送：查 D1 nav_sites 表，按行业模糊匹配 category
    if (prefs.tool_push !== false && industries.length > 0) {
      try {
        const likeClauses = industries.map(() => 'category LIKE ?').join(' OR ');
        const likeParams = industries.map((ind: string) => '%' + ind + '%');
        const sites = await c.env.DB.prepare(
          `SELECT id, name, title, description, category FROM nav_sites WHERE ${likeClauses} LIMIT 10`
        ).bind(...likeParams).all() as { results: any[] };
        for (const site of sites.results) {
          if (existingIds.has('tool_' + site.id)) continue;
          notifications.push({
            type: 'tool',
            title: `收录工具：${site.name}`,
            content: site.description || site.title || '',
            link: '/site/',
            ref_id: 'tool_' + site.id
          });
        }
      } catch (e) { console.error('tool push error:', e); }
    }

    if (notifications.length > 0) {
      const stmt = c.env.DB.prepare(
        'INSERT INTO user_notifications (user_id, type, title, content, link, ref_id) VALUES (?, ?, ?, ?, ?, ?)'
      );
      const batch = notifications.slice(0, 10).map(n =>
        stmt.bind(userId, n.type, n.title, n.content, n.link, n.ref_id)
      );
      await c.env.DB.batch(batch);
    }
  } catch (err) {
    console.error('generateNotifications error:', err);
  }
}
