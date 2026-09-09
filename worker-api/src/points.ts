import { Context } from 'hono';
import { User, PointLog, SignRecord } from './db';

// VIP 积分倍率
const VIP_POINT_MULTIPLIER: Record<string, number> = {
  '': 1,
  'vip': 1.5,
  'svip': 2,
};

// 签到基础积分
const SIGN_BASE_POINTS = 2;

// 连续签到奖励（每 7 天）
const STREAK_BONUS = 20;

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function calculateSignPoints(streak: number, multiplier: number): number {
  let base = SIGN_BASE_POINTS;
  // 每连续 7 天额外奖励
  if (streak > 0 && streak % 7 === 0) {
    base += STREAK_BONUS;
  }
  return Math.floor(base * multiplier);
}

// 每日签到
export async function signIn(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const today = getToday();

    // 获取用户信息
    const user = await c.env.DB.prepare(
      'SELECT id, points, vip_level, last_sign_date, streak_days FROM users WHERE id = ?'
    ).bind(userId).first() as User | null;
    if (!user) return c.json({ error: '用户不存在' }, 404);

    // 检查今日是否已签到
    if (user.last_sign_date === today) {
      return c.json({ error: '今日已签到', points: user.points, streak: user.streak_days, earned: 0 });
    }

    // 计算连续天数
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    let streak = 1;
    if (user.last_sign_date === yesterdayStr) {
      streak = (user.streak_days || 0) + 1;
    }

    // 计算积分
    const multiplier = VIP_POINT_MULTIPLIER[user.vip_level] || 1;
    const earned = calculateSignPoints(streak, multiplier);
    const newPoints = (user.points || 0) + earned;

    // 写入签到记录
    await c.env.DB.prepare(
      'INSERT OR REPLACE INTO sign_records (user_id, sign_date, streak) VALUES (?, ?, ?)'
    ).bind(userId, today, streak).run();

    // 更新用户积分
    await c.env.DB.prepare(
      'UPDATE users SET points = ?, streak_days = ?, last_sign_date = ? WHERE id = ?'
    ).bind(newPoints, streak, today, userId).run();

    // 写入积分流水
    await c.env.DB.prepare(
      'INSERT INTO point_logs (user_id, amount, type, action, description) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, earned, 'earn', 'sign_in', `每日签到 +${earned}`).run();

    return c.json({ points: newPoints, streak, earned });
  } catch (err) {
    console.error('sign in error:', err);
    return c.json({ error: '签到失败' }, 500);
  }
}

// 获取积分余额
export async function getPoints(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const user = await c.env.DB.prepare(
      'SELECT points, vip_level, streak_days FROM users WHERE id = ?'
    ).bind(userId).first() as { points: number; vip_level: string; streak_days: number } | null;
    if (!user) return c.json({ error: '用户不存在' }, 404);
    return c.json({ points: user.points || 0, level: user.vip_level, streak: user.streak_days || 0 });
  } catch (err) {
    console.error('get points error:', err);
    return c.json({ error: '获取积分失败' }, 500);
  }
}

// 积分流水
export async function getPointLogs(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 50);
    const offset = (page - 1) * limit;

    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM point_logs WHERE user_id = ?'
    ).bind(userId).first() as { total: number };

    const items = await c.env.DB.prepare(
      'SELECT * FROM point_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(userId, limit, offset).all() as { results: PointLog[] };

    return c.json({ items: items.results, total: countResult.total, page, limit });
  } catch (err) {
    console.error('get point logs error:', err);
    return c.json({ error: '获取积分流水失败' }, 500);
  }
}

// 增加积分（内部调用）
export async function addPoints(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const body = await c.req.json() as { action: string; amount: number; ref_id?: number; description?: string };
    if (!body.action || !body.amount || body.amount <= 0) {
      return c.json({ error: '参数无效' }, 400);
    }

    const user = await c.env.DB.prepare(
      'SELECT id, points, vip_level FROM users WHERE id = ?'
    ).bind(userId).first() as User | null;
    if (!user) return c.json({ error: '用户不存在' }, 404);

    const multiplier = VIP_POINT_MULTIPLIER[user.vip_level] || 1;
    const earned = Math.floor(body.amount * multiplier);
    const newPoints = (user.points || 0) + earned;

    // 检查积分上限
    const limits: Record<string, number> = { '': 500, 'vip': 2000, 'svip': Infinity };
    const maxPoints = limits[user.vip_level] || 500;
    const finalPoints = Math.min(newPoints, maxPoints);

    await c.env.DB.prepare(
      'UPDATE users SET points = ? WHERE id = ?'
    ).bind(finalPoints, userId).run();

    await c.env.DB.prepare(
      'INSERT INTO point_logs (user_id, amount, type, action, description, ref_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, earned, 'earn', body.action, body.description || body.action, body.ref_id || null).run();

    return c.json({ points: finalPoints, earned });
  } catch (err) {
    console.error('add points error:', err);
    return c.json({ error: '增加积分失败' }, 500);
  }
}

// 扣减积分（内部调用）
export async function deductPoints(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const body = await c.req.json() as { action: string; amount: number; ref_id?: number; description?: string };
    if (!body.action || !body.amount || body.amount <= 0) {
      return c.json({ error: '参数无效' }, 400);
    }

    const user = await c.env.DB.prepare(
      'SELECT id, points, vip_level FROM users WHERE id = ?'
    ).bind(userId).first() as User | null;
    if (!user) return c.json({ error: '用户不存在' }, 404);

    // VIP/SVIP 下载免费
    if ((user.vip_level === 'svip') && body.action === 'download') {
      await c.env.DB.prepare(
        'INSERT INTO point_logs (user_id, amount, type, action, description, ref_id) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(userId, 0, 'spend', body.action, 'SVIP 免费', body.ref_id || null).run();
      return c.json({ points: user.points || 0, deducted: 0 });
    }

    // VIP 下载半价
    let actualAmount = body.amount;
    if (user.vip_level === 'vip' && body.action === 'download') {
      actualAmount = Math.ceil(body.amount / 2);
    }

    if ((user.points || 0) < actualAmount) {
      return c.json({ error: '积分不足', points: user.points || 0, required: actualAmount }, 400);
    }

    const newPoints = (user.points || 0) - actualAmount;
    await c.env.DB.prepare(
      'UPDATE users SET points = ? WHERE id = ?'
    ).bind(newPoints, userId).run();

    await c.env.DB.prepare(
      'INSERT INTO point_logs (user_id, amount, type, action, description, ref_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, -actualAmount, 'spend', body.action, body.description || body.action, body.ref_id || null).run();

    return c.json({ points: newPoints, deducted: actualAmount });
  } catch (err) {
    console.error('deduct points error:', err);
    return c.json({ error: '扣减积分失败' }, 500);
  }
}
