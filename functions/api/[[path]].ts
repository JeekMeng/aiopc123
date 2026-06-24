export async function onRequest(context) {
  const url = new URL(context.request.url);
  const apiUrl = `https://aiopc-worker.3994983718.workers.dev${url.pathname}${url.search}`;
  return fetch(apiUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
  });
}
