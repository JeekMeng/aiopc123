import { Context } from 'hono';
import { Bookmark } from './db';

export async function list(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const bookmarks = await c.env.DB.prepare(
      'SELECT id, site_id, title, url, description, logo, is_public, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all() as { results: Bookmark[] };

    return c.json({ bookmarks: bookmarks.results });
  } catch (err) {
    console.error('list bookmarks error:', err);
    return c.json({ error: '获取收藏列表失败' }, 500);
  }
}

export async function create(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const body = await c.req.json() as {
      site_id?: number;
      title: string;
      url: string;
      description?: string;
      logo?: string;
      is_public?: boolean;
    };

    if (!body.title || !body.url) {
      return c.json({ error: '标题和链接不能为空' }, 400);
    }

    if (body.site_id) {
      const dup = await c.env.DB.prepare(
        'SELECT id FROM bookmarks WHERE user_id = ? AND site_id = ?'
      ).bind(userId, body.site_id).first();
      if (dup) {
        const bookmark = await c.env.DB.prepare(
          'SELECT * FROM bookmarks WHERE id = ?'
        ).bind(dup.id).first() as Bookmark;
        return c.json({ bookmark }, 200);
      }
    }

    const result = await c.env.DB.prepare(
      'INSERT INTO bookmarks (user_id, site_id, title, url, description, logo, is_public) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      userId,
      body.site_id || null,
      body.title,
      body.url,
      body.description || '',
      body.logo || '',
      body.is_public ? 1 : 0
    ).run();

    const bookmarkId = result.meta.last_row_id as number;
    const bookmark = await c.env.DB.prepare(
      'SELECT * FROM bookmarks WHERE id = ?'
    ).bind(bookmarkId).first() as Bookmark;

    return c.json({ bookmark }, 201);
  } catch (err) {
    console.error('create bookmark error:', err);
    return c.json({ error: '添加收藏失败' }, 500);
  }
}

export async function update(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const id = parseInt(c.req.param('id')!, 10);
    const body = await c.req.json() as {
      title?: string;
      url?: string;
      description?: string;
      logo?: string;
      is_public?: boolean;
    };

    const existing = await c.env.DB.prepare(
      'SELECT id FROM bookmarks WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existing) {
      return c.json({ error: '收藏不存在' }, 404);
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    const { title, url, description, logo, is_public } = body;
    if (title !== undefined) { updates.push('title = ?'); values.push(title!); }
    if (url !== undefined) { updates.push('url = ?'); values.push(url!); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description!); }
    if (logo !== undefined) { updates.push('logo = ?'); values.push(logo!); }
    if (is_public !== undefined) { updates.push('is_public = ?'); values.push(is_public ? 1 : 0); }

    if (updates.length === 0) {
      return c.json({ error: '没有需要更新的字段' }, 400);
    }

    values.push(id);
    await c.env.DB.prepare(
      `UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const bookmark = await c.env.DB.prepare(
      'SELECT * FROM bookmarks WHERE id = ?'
    ).bind(id).first() as Bookmark;

    return c.json({ bookmark });
  } catch (err) {
    console.error('update bookmark error:', err);
    return c.json({ error: '更新收藏失败' }, 500);
  }
}

export async function remove(c: Context): Promise<Response> {
  try {
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(id)) return c.json({ error: '无效的收藏ID' }, 400);
    const info = await c.env.DB.prepare('DELETE FROM bookmarks WHERE id = ?').bind(id).run();
    if (info.meta.changes === 0) return c.json({ error: '收藏不存在' }, 404);
    return c.json({ message: '已删除收藏' });
  } catch (err) {
    console.error('delete bookmark error:', err);
    return c.json({ error: '删除收藏失败' }, 500);
  }
}
