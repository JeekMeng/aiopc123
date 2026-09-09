import { Context } from 'hono';

export async function uploadLogo(c: Context): Promise<Response> {
  try {
    const userId = c.get('userId') as number;
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return c.json({ error: '请选择文件' }, 400);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: '仅支持 JPG/PNG/GIF/WebP/SVG 格式' }, 400);
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: '文件大小不能超过 2MB' }, 400);
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    var binary = '';
    for (var i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${file.type};base64,${base64}`;

    return c.json({ url: dataUrl });
  } catch (err) {
    console.error('upload logo error:', err);
    return c.json({ error: '上传失败' }, 500);
  }
}
