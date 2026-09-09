import { Context } from 'hono';

export async function create(c: Context): Promise<Response> {
  try {
    const body = await c.req.json() as {
      name: string;
      logo?: string;
      city: string;
      categories: string[];
      summary: string;
      detail?: string;
      tags: string[];
      website: string;
      wechat?: string;
      contact_name: string;
      contact_phone: string;
      email?: string;
      feedback_method?: string;
      notes?: string;
    };

    if (!body.name || !body.city || !body.summary || !body.website || !body.contact_name || !body.contact_phone) {
      return c.json({ error: '请填写所有必填项' }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO submissions (name, logo, city, categories, summary, detail, tags, website, wechat, contact_name, contact_phone, email, feedback_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.name,
      body.logo || '',
      body.city,
      JSON.stringify(body.categories || []),
      body.summary,
      body.detail || '',
      JSON.stringify(body.tags || []),
      body.website,
      body.wechat || '',
      body.contact_name,
      body.contact_phone,
      body.email || '',
      body.feedback_method || 'page',
      body.notes || ''
    ).run();

    return c.json({ message: '提交成功，我们将在1-3个工作日内完成审核', id: result.meta.last_row_id }, 201);
  } catch (err) {
    console.error('submission error:', err);
    return c.json({ error: '提交失败，请稍后重试' }, 500);
  }
}

export async function querySubmission(c: Context): Promise<Response> {
  try {
    const phone = c.req.query('phone') || '';
    const website = c.req.query('website') || '';
    const email = c.req.query('email') || '';
    if (!phone && !website && !email) {
      return c.json({ error: '请提供联系电话、登记网址或电子邮箱' }, 400);
    }
    let sql = 'SELECT id, name, logo, city, categories, summary, website, email, feedback_method, status, review_note, reviewed_at, reviewed_by, created_at FROM submissions WHERE ';
    const conditions: string[] = [];
    const params: string[] = [];
    if (phone) {
      conditions.push('contact_phone = ?');
      params.push(phone);
    }
    if (website) {
      let domain = website.trim().toLowerCase();
      domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
      conditions.push("LOWER(REPLACE(REPLACE(REPLACE(REPLACE(website, 'https://', ''), 'http://', ''), 'www.', ''), '/', '')) LIKE ?");
      params.push('%' + domain + '%');
    }
    if (email) {
      conditions.push('LOWER(email) = LOWER(?)');
      params.push(email.trim());
    }
    sql += conditions.join(' OR ');
    sql += ' ORDER BY created_at DESC';
    const result = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json({ items: result.results || [] });
  } catch (err) {
    console.error('query submission error:', err);
    return c.json({ error: '查询失败' }, 500);
  }
}
