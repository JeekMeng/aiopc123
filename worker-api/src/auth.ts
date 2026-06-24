import { Context } from 'hono';
import { User } from './db';
import {
  createSession,
  destroySession,
  getUserIdFromSession,
  setSessionCookie,
  clearSessionCookie,
  getSessionCookie,
} from './middleware';

function getClientIP(c: Context): string {
  return c.req.header('cf-connecting-ip')
    || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || '';
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key, 256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key, 256
  );
  const computed = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === hashHex;
}

export async function register(c: Context): Promise<Response> {
  try {
    const body = await c.req.json() as { email: string; password: string; nickname: string };
    const { email, password, nickname } = body;

    if (!email || !password || !nickname) {
      return c.json({ error: '邮箱、密码和昵称不能为空' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: '密码至少 6 位' }, 400);
    }

    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return c.json({ error: '该邮箱已注册' }, 409);
    }

    const passwordHash = await hashPassword(password);
    const ip = getClientIP(c);
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, nickname, last_login_ip) VALUES (?, ?, ?, ?)'
    ).bind(email, passwordHash, nickname, ip).run();

    const userId = result.meta.last_row_id as number;
    const sessionId = await createSession(c.env.SESSIONS, userId);
    setSessionCookie(c, sessionId);

    return c.json({
      user: { id: userId, email, nickname, avatar: '', role: 'user' },
    }, 201);
  } catch (err) {
    console.error('register error:', err);
    return c.json({ error: '注册失败，请稍后重试' }, 500);
  }
}

export async function login(c: Context): Promise<Response> {
  try {
    const body = await c.req.json() as { email: string; password: string };
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: '邮箱和密码不能为空' }, 400);
    }

    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, nickname, avatar, role FROM users WHERE email = ?'
    ).bind(email).first() as User | null;

    if (!user) {
      return c.json({ error: '邮箱或密码错误' }, 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ error: '邮箱或密码错误' }, 401);
    }

    const ip = getClientIP(c);
    await c.env.DB.prepare(
      'UPDATE users SET last_login_ip = ? WHERE id = ?'
    ).bind(ip, user.id).run();

    const sessionId = await createSession(c.env.SESSIONS, user.id);
    setSessionCookie(c, sessionId);

    return c.json({
      user: { id: user.id, email: user.email, nickname: user.nickname, avatar: user.avatar, role: user.role },
    });
  } catch (err) {
    console.error('login error:', err);
    return c.json({ error: '登录失败，请稍后重试' }, 500);
  }
}

export async function logout(c: Context): Promise<Response> {
  const sessionId = getSessionCookie(c);
  if (sessionId) {
    await destroySession(c.env.SESSIONS, sessionId);
  }
  clearSessionCookie(c);
  return c.json({ message: '已退出登录' });
}

export async function changePassword(c: Context): Promise<Response> {
  try {
    const headerUserId = c.req.header('X-Auth-User-Id');
    const userId = headerUserId
      ? parseInt(headerUserId, 10)
      : await getUserIdFromSession(c.env.SESSIONS, getSessionCookie(c));
    if (!userId) return c.json({ error: '请先登录' }, 401);

    const body = await c.req.json() as { currentPassword: string; newPassword: string };
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return c.json({ error: '当前密码和新密码不能为空' }, 400);
    }
    if (newPassword.length < 6) {
      return c.json({ error: '新密码至少 6 位' }, 400);
    }

    const user = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(userId).first() as { password_hash: string } | null;

    if (!user) return c.json({ error: '用户不存在' }, 404);

    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) return c.json({ error: '当前密码错误' }, 401);

    const newHash = await hashPassword(newPassword);
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(newHash, userId).run();

    return c.json({ message: '密码修改成功' });
  } catch (err) {
    console.error('changePassword error:', err);
    return c.json({ error: '密码修改失败，请稍后重试' }, 500);
  }
}

export async function getMe(c: Context): Promise<Response> {
  const headerUserId = c.req.header('X-Auth-User-Id');
  const userId = headerUserId
    ? parseInt(headerUserId, 10)
    : getSessionCookie(c)
      ? await getUserIdFromSession(c.env.SESSIONS, getSessionCookie(c))
      : null;

  if (!userId) {
    return c.json({ user: null });
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, nickname, avatar, role FROM users WHERE id = ?'
  ).bind(userId).first() as User | null;

  if (!user) {
    return c.json({ user: null });
  }

  return c.json({
    user: { id: user.id, email: user.email, nickname: user.nickname, avatar: user.avatar, role: user.role },
  });
}
