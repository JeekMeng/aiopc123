import { Context } from 'hono';
import { Comment } from './db';
import { getSessionCookie, getUserIdFromSession } from './middleware';

export async function list(c: Context): Promise<Response> {
  try {
    const siteId = c.req.query('site');
    const mine = c.req.query('mine');

    if (mine === '1') {
      const headerUserId = c.req.header('X-Auth-User-Id');
      const userId = headerUserId
        ? parseInt(headerUserId, 10)
        : await getUserIdFromSession(c.env.SESSIONS, getSessionCookie(c));
      if (!userId) {
        return c.json({ error: '请先登录' }, 401);
      }
      const comments = await c.env.DB.prepare(
        `SELECT c.id, c.user_id, c.site_id, c.parent_id, c.content, c.created_at,
                u.nickname, u.avatar
         FROM comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.user_id = ?
         ORDER BY c.created_at DESC`
      ).bind(userId).all() as { results: Comment[] };
      return c.json({ comments: comments.results });
    }

    if (!siteId) {
      return c.json({ error: '缺少 site 参数' }, 400);
    }

    const comments = await c.env.DB.prepare(
      `SELECT c.id, c.user_id, c.site_id, c.parent_id, c.content, c.created_at,
              u.nickname, u.avatar
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.site_id = ?
       ORDER BY c.created_at ASC`
    ).bind(siteId).all() as { results: Comment[] };

    return c.json({ comments: comments.results });
  } catch (err) {
    console.error('list comments error:', err);
    return c.json({ error: '获取评论列表失败' }, 500);
  }
}

export async function create(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const body = await c.req.json() as {
      site_id: string;
      content: string;
      parent_id?: number | null;
    };

    if (!body.site_id || !body.content) {
      return c.json({ error: '站点ID和评论内容不能为空' }, 400);
    }

    if (body.content.length > 1000) {
      return c.json({ error: '评论内容不能超过 1000 字' }, 400);
    }

    const result = await c.env.DB.prepare(
      'INSERT INTO comments (user_id, site_id, parent_id, content) VALUES (?, ?, ?, ?)'
    ).bind(
      userId,
      body.site_id,
      body.parent_id || null,
      body.content
    ).run();

    const commentId = result.meta.last_row_id as number;
    const comment = await c.env.DB.prepare(
      `SELECT c.id, c.user_id, c.site_id, c.parent_id, c.content, c.created_at,
              u.nickname, u.avatar
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`
    ).bind(commentId).first() as Comment;

    return c.json({ comment }, 201);
  } catch (err) {
    console.error('create comment error:', err);
    return c.json({ error: '发表评论失败' }, 500);
  }
}

export async function remove(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const id = parseInt(c.req.param('id')!, 10);

    const existing = await c.env.DB.prepare(
      'SELECT id FROM comments WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existing) {
      return c.json({ error: '评论不存在或无权删除' }, 404);
    }

    await c.env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
    return c.json({ message: '已删除评论' });
  } catch (err) {
    console.error('delete comment error:', err);
    return c.json({ error: '删除评论失败' }, 500);
  }
}
