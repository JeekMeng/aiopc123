import { Context } from 'hono';
import { destroySession, getSessionCookie, clearSessionCookie } from './middleware';

const SETUP_SECRET = 'aiopc-admin-setup-2026';

export async function setupAdmin(c: Context): Promise<Response> {
  try {
    const body = await c.req.json() as { email: string; secret: string };
    if (body.secret !== SETUP_SECRET) {
      return c.json({ error: '密钥错误' }, 403);
    }
    const result = await c.env.DB.prepare(
      "UPDATE users SET role = 'admin' WHERE email = ?"
    ).bind(body.email).run();
    if (result.meta.changes === 0) {
      return c.json({ error: '用户不存在' }, 404);
    }
    return c.json({ message: '已将 ' + body.email + ' 设为管理员' });
  } catch (err) {
    console.error('setup admin error:', err);
    return c.json({ error: '设置失败' }, 500);
  }
}

export async function listUsers(c: Context): Promise<Response> {
  try {
    const users = await c.env.DB.prepare(
      'SELECT id, email, nickname, avatar, role, created_at, last_login_ip FROM users ORDER BY created_at DESC'
    ).all();
    return c.json({ users: users.results });
  } catch (err) {
    console.error('list users error:', err);
    return c.json({ error: '获取用户列表失败' }, 500);
  }
}

export async function updateRole(c: Context): Promise<Response> {
  try {
    const id = parseInt(c.req.param('id')!, 10);
    const body = await c.req.json() as { role: string };
    if (!['user', 'admin'].includes(body.role)) {
      return c.json({ error: '无效的角色' }, 400);
    }
    const result = await c.env.DB.prepare(
      'UPDATE users SET role = ? WHERE id = ?'
    ).bind(body.role, id).run();
    if (result.meta.changes === 0) {
      return c.json({ error: '用户不存在' }, 404);
    }
    return c.json({ message: '角色已更新' });
  } catch (err) {
    console.error('update role error:', err);
    return c.json({ error: '更新角色失败' }, 500);
  }
}

export async function deleteUser(c: Context): Promise<Response> {
  try {
    const id = parseInt(c.req.param('id')!, 10);
    const callerId = c.get('userId') as number;

    await c.env.DB.prepare('DELETE FROM bookmarks WHERE user_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM comments WHERE user_id = ?').bind(id).run();
    const result = await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    if (result.meta.changes === 0) {
      return c.json({ error: '用户不存在' }, 404);
    }

    if (id === callerId) {
      const sessionId = getSessionCookie(c);
      if (sessionId) {
        await destroySession(c.env.SESSIONS, sessionId);
      }
      clearSessionCookie(c);
    }

    return c.json({ message: '用户已删除' });
  } catch (err) {
    console.error('delete user error:', err);
    return c.json({ error: '删除用户失败' }, 500);
  }
}

export async function listAllComments(c: Context): Promise<Response> {
  try {
    const comments = await c.env.DB.prepare(
      `SELECT c.id, c.user_id, c.site_id, c.content, c.created_at,
              u.nickname, u.email
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC`
    ).all();
    return c.json({ comments: comments.results });
  } catch (err) {
    console.error('list all comments error:', err);
    return c.json({ error: '获取评论列表失败' }, 500);
  }
}

export async function listAllSubmissions(c: Context): Promise<Response> {
  try {
    const submissions = await c.env.DB.prepare(
      'SELECT * FROM submissions ORDER BY created_at DESC'
    ).all();
    return c.json({ submissions: submissions.results });
  } catch (err) {
    console.error('list submissions error:', err);
    return c.json({ error: '获取入驻申请列表失败' }, 500);
  }
}

export async function updateSubmissionStatus(c: Context): Promise<Response> {
  try {
    const id = parseInt(c.req.param('id')!, 10);
    const body = await c.req.json() as { status: string; review_note?: string };
    if (!['pending', 'approved', 'rejected'].includes(body.status)) {
      return c.json({ error: '无效的状态' }, 400);
    }
    const userId = c.get('userId') as number;
    let reviewedAt = '';
    let reviewedBy = '';
    if (body.status !== 'pending') {
      reviewedAt = new Date().toISOString();
      const admin = await c.env.DB.prepare('SELECT nickname, email FROM users WHERE id = ?').bind(userId).first() as { nickname: string; email: string } | null;
      reviewedBy = admin?.nickname || admin?.email || '';
    }
    const result = await c.env.DB.prepare(
      'UPDATE submissions SET status = ?, review_note = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?'
    ).bind(body.status, body.review_note || '', reviewedAt, reviewedBy, id).run();
    if (result.meta.changes === 0) {
      return c.json({ error: '申请不存在' }, 404);
    }
    return c.json({ message: '状态已更新' });
  } catch (err) {
    console.error('update submission status error:', err);
    return c.json({ error: '更新状态失败' }, 500);
  }
}

export async function deleteSubmission(c: Context): Promise<Response> {
  try {
    const id = parseInt(c.req.param('id')!, 10);
    const result = await c.env.DB.prepare('DELETE FROM submissions WHERE id = ?').bind(id).run();
    if (result.meta.changes === 0) {
      return c.json({ error: '申请不存在' }, 404);
    }
    return c.json({ message: '申请已删除' });
  } catch (err) {
    console.error('delete submission error:', err);
    return c.json({ error: '删除失败' }, 500);
  }
}

export async function deleteComment(c: Context): Promise<Response> {
  try {
    const id = parseInt(c.req.param('id')!, 10);
    const result = await c.env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
    if (result.meta.changes === 0) {
      return c.json({ error: '评论不存在' }, 404);
    }
    return c.json({ message: '评论已删除' });
  } catch (err) {
    console.error('admin delete comment error:', err);
    return c.json({ error: '删除评论失败' }, 500);
  }
}

export async function listAllBookmarks(c: Context): Promise<Response> {
  try {
    const bookmarks = await c.env.DB.prepare(
      `SELECT b.id, b.user_id, b.site_id, b.title, b.url, b.description, b.logo, b.is_public, b.created_at,
              u.nickname, u.email
       FROM bookmarks b
       LEFT JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC`
    ).all();
    return c.json({ bookmarks: bookmarks.results });
  } catch (err) {
    console.error('admin list bookmarks error:', err);
    return c.json({ error: '获取收藏列表失败' }, 500);
  }
}

export async function adminDeleteBookmark(c: Context): Promise<Response> {
  try {
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(id)) return c.json({ error: '无效的收藏ID' }, 400);
    const info = await c.env.DB.prepare('DELETE FROM bookmarks WHERE id = ?').bind(id).run();
    if (info.meta.changes === 0) return c.json({ error: '收藏不存在' }, 404);
    return c.json({ message: '收藏已删除' });
  } catch (err) {
    console.error('admin delete bookmark error:', err);
    return c.json({ error: '删除收藏失败' }, 500);
  }
}

export async function listAllOpcs(c: Context): Promise<Response> {
  try {
    const opcs = await c.env.DB.prepare(
      `SELECT o.id, o.user_id, o.name, o.description, o.logo, o.address, o.website, o.is_active, o.created_at, o.updated_at,
              u.nickname, u.email
       FROM opcs o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    ).all();
    return c.json({ opcs: opcs.results });
  } catch (err) {
    console.error('admin list opcs error:', err);
    return c.json({ error: '获取一人公司列表失败' }, 500);
  }
}

export async function adminDeleteOpc(c: Context): Promise<Response> {
  try {
    const id = parseInt(c.req.param('id')!, 10);
    if (isNaN(id)) return c.json({ error: '无效的ID' }, 400);
    const info = await c.env.DB.prepare('DELETE FROM opcs WHERE id = ?').bind(id).run();
    if (info.meta.changes === 0) return c.json({ error: '一人公司不存在' }, 404);
    return c.json({ message: '已删除' });
  } catch (err) {
    console.error('admin delete opc error:', err);
    return c.json({ error: '删除一人公司失败' }, 500);
  }
}

export async function setUserVipLevel(c: Context): Promise<Response> {
  try {
    const id = parseInt(c.req.param('id')!, 10);
    const body = await c.req.json() as { vip_level: string };
    if (!['', 'vip', 'svip'].includes(body.vip_level)) {
      return c.json({ error: '无效的会员等级' }, 400);
    }
    const result = await c.env.DB.prepare(
      'UPDATE users SET vip_level = ? WHERE id = ?'
    ).bind(body.vip_level, id).run();
    if (result.meta.changes === 0) {
      return c.json({ error: '用户不存在' }, 404);
    }
    return c.json({ message: '会员等级已更新' });
  } catch (err) {
    console.error('set user vip level error:', err);
    return c.json({ error: '更新会员等级失败' }, 500);
  }
}
