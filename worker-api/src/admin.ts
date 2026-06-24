import { Context } from 'hono';

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
    await c.env.DB.prepare('DELETE FROM bookmarks WHERE user_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM comments WHERE user_id = ?').bind(id).run();
    const result = await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    if (result.meta.changes === 0) {
      return c.json({ error: '用户不存在' }, 404);
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
    const body = await c.req.json() as { status: string };
    if (!['pending', 'approved', 'rejected'].includes(body.status)) {
      return c.json({ error: '无效的状态' }, 400);
    }
    const result = await c.env.DB.prepare(
      'UPDATE submissions SET status = ? WHERE id = ?'
    ).bind(body.status, id).run();
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
