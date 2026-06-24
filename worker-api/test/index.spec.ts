import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
  SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("aiopc-worker API", () => {
  it("health check returns ok", async () => {
    const request = new IncomingRequest("http://example.com/api/health");
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
    const data = await response.json() as { status: string };
    expect(data.status).toBe("ok");
  });

  it("not found for unknown routes", async () => {
    const response = await SELF.fetch("https://example.com/api/nonexistent");
    expect(response.status).toBe(404);
  });
});
