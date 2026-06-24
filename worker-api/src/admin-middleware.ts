import { Context } from 'hono';
import { getSessionCookie, getUserIdFromSession } from './middleware';

export async function requireAdmin(c: Context, next: () => Promise<void>): Promise<Response | void> {
  const sessionId = getSessionCookie(c);
  const userId = await getUserIdFromSession(c.env.SESSIONS, sessionId);
  if (!userId) {
    return c.json({ error: '请先登录' }, 401);
  }
  const user = await c.env.DB.prepare(
    'SELECT role FROM users WHERE id = ?'
  ).bind(userId).first() as { role: string } | null;
  if (!user || user.role !== 'admin') {
    return c.json({ error: '权限不足' }, 403);
  }
  c.set('userId', userId);
  await next();
}
