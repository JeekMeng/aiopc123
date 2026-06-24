import { Context } from 'hono';
import { getCookie } from 'hono/cookie';

const SESSION_PREFIX = 'session:';

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function makeSessionKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}`;
}

export async function createSession(
  SESSIONS: KVNamespace,
  userId: number,
  ttlSeconds = 86400 * 7
): Promise<string> {
  const sessionId = generateSessionId();
  await SESSIONS.put(makeSessionKey(sessionId), String(userId), {
    expirationTtl: ttlSeconds,
  });
  return sessionId;
}

export async function destroySession(SESSIONS: KVNamespace, sessionId: string): Promise<void> {
  await SESSIONS.delete(makeSessionKey(sessionId));
}

export async function getUserIdFromSession(
  SESSIONS: KVNamespace,
  sessionId: string | undefined
): Promise<number | null> {
  if (!sessionId) return null;
  const userId = await SESSIONS.get(makeSessionKey(sessionId));
  return userId ? parseInt(userId, 10) : null;
}

const SESSION_COOKIE = 'session_id';

export function setSessionCookie(c: Context, sessionId: string): void {
  c.header(
    'Set-Cookie',
    `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${86400 * 7}`
  );
}

export function clearSessionCookie(c: Context): void {
  c.header(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export function getSessionCookie(c: Context): string | undefined {
  return getCookie(c)[SESSION_COOKIE];
}

export async function requireAuth(c: Context, next: () => Promise<void>): Promise<Response | void> {
  const sessionId = getSessionCookie(c);
  const userId = await getUserIdFromSession(c.env.SESSIONS, sessionId);
  if (!userId) {
    return c.json({ error: '请先登录' }, 401);
  }
  c.set('userId', userId);
  await next();
}
