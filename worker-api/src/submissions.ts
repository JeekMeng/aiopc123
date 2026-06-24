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
      notes?: string;
    };

    if (!body.name || !body.city || !body.summary || !body.website || !body.contact_name || !body.contact_phone) {
      return c.json({ error: '请填写所有必填项' }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO submissions (name, logo, city, categories, summary, detail, tags, website, wechat, contact_name, contact_phone, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      body.notes || ''
    ).run();

    return c.json({ message: '提交成功，我们将在1-3个工作日内完成审核', id: result.meta.last_row_id }, 201);
  } catch (err) {
    console.error('submission error:', err);
    return c.json({ error: '提交失败，请稍后重试' }, 500);
  }
}
