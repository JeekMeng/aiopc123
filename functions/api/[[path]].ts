export async function onRequest(context) {
  const url = new URL(context.request.url);
  const apiUrl = `https://aiopc-worker.3994983718.workers.dev${url.pathname}${url.search}`;

  const reqHeaders = new Headers(context.request.headers);
  reqHeaders.delete('host');

  const resp = await fetch(apiUrl, {
    method: context.request.method,
    headers: reqHeaders,
    body: context.request.body,
  });

  const respHeaders = new Headers(resp.headers);

  const setCookies = resp.headers.getSetCookie?.() || [];
  if (setCookies.length > 0) {
    respHeaders.delete('set-cookie');
    for (const sc of setCookies) {
      const rewritten = sc
        .replace(/;?\s*Domain=[^;]*/gi, '')
        .replace(/;?\s*Secure/gi, '')
        .replace(/;?\s*SameSite=\w+/gi, '; SameSite=Lax');
      respHeaders.append('Set-Cookie', rewritten);
    }
  }

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: respHeaders,
  });
}
