# Cloudflare Workers

注意：你对 Cloudflare Workers API 和限制的了解可能已过时。在执行任何 Workers、KV、R2、D1、Durable Objects、Queues、Vectorize、AI 或 Agents SDK 任务前，请始终检索最新文档。

## 语言声明

后续对话将使用**中文**进行交流。

## 文档

- https://developers.cloudflare.com/workers/
- MCP：`https://docs.mcp.cloudflare.com/mcp`

所有限制和配额请查阅产品的 `/platform/limits/` 页面，例如 `/workers/platform/limits`。

## 命令

| 命令 | 用途 |
|---------|---------|
| `npx wrangler dev` | 本地开发 |
| `npx wrangler deploy` | 部署到 Cloudflare |
| `npx wrangler types` | 生成 TypeScript 类型 |

修改 `wrangler.jsonc` 中的绑定后，运行 `wrangler types`。

## Node.js 兼容性

https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## 错误

- **Error 1102**（CPU/内存超限）：从 `/workers/platform/limits/` 获取限制信息
- **所有错误**：https://developers.cloudflare.com/workers/observability/errors/

## 产品文档

从以下路径获取 API 参考和限制信息：
`/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`

## 最佳实践（按需参考）

如果应用程序使用了 Durable Objects 或 Workflows，请查阅相关最佳实践：

- Durable Objects：https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
- Workflows：https://developers.cloudflare.com/workflows/build/rules-of-workflows/

