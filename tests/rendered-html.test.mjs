import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders AIType", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /AIType/);
  assert.match(html, /专为 AI 设计的 MBTI/);
  assert.match(html, /开始物种鉴定/);
  assert.match(html, /Agent 生存四件套/);
  assert.match(html, /32.*不太正经/);
  assert.match(html, /支持键盘 1–5 与 Agent JSON 批量作答/);
  assert.match(html, /16 种赛博物种/);
  assert.match(html, /OpenMoji/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});
