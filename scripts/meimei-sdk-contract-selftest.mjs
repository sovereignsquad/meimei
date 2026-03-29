#!/usr/bin/env node
/**
 * MM-KERNEL-402 — @meimei/sdk request shapes against a tiny mock HTTP server (no MeiMei dashboard).
 */
import assert from "node:assert/strict";
import http from "node:http";
import { MeiMeiKernelClient } from "../packages/meimei-sdk/index.mjs";

const APP_ID = "11111111-1111-4111-8111-111111111111";

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`PASS: ${msg}`);
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url || "/", "http://127.0.0.1");
  const path = u.pathname;
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const bodyText = Buffer.concat(chunks).toString("utf8");
    res.setHeader("content-type", "application/json");

    if (req.method === "POST" && path === `/api/meimei/v1/apps/${APP_ID}/inference`) {
      assert.equal(req.headers["x-meimei-app-id"], APP_ID);
      assert.equal(req.headers["x-meimei-trace-id"], "trace-sdk-selftest");
      const b = JSON.parse(bodyText || "{}");
      assert.equal(b.model, "router-auto");
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, echo: "inference", choices: [] }));
      return;
    }

    if (req.method === "POST" && path === `/api/meimei/v1/apps/${APP_ID}/jobs/enqueue`) {
      assert.equal(req.headers["x-meimei-app-id"], APP_ID);
      const b = JSON.parse(bodyText || "{}");
      assert.equal(b.adapterName, "pilot-inbox");
      assert.equal(b.payload?.kind, "inference_v1");
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, jobId: 42, traceId: b.traceId || "t", status: "pending" }));
      return;
    }

    if (req.method === "GET" && path === `/api/meimei/v1/apps/${APP_ID}/env`) {
      assert.equal(req.headers["x-meimei-app-id"], APP_ID);
      assert.equal(u.searchParams.get("keys"), "PORT,HOME");
      assert.equal(req.headers["content-type"], undefined);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, values: { PORT: "1", HOME: "/x" } }));
      return;
    }

    if (req.method === "GET" && path === `/api/meimei/v1/apps/${APP_ID}/fs/roots`) {
      assert.equal(req.headers["x-meimei-app-id"], APP_ID);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, roots: [{ configured: ".", resolved: "/tmp", exists: true }] }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ ok: false }));
  });
});

server.listen(0, "127.0.0.1", async () => {
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const client = new MeiMeiKernelClient({ baseUrl, appId: APP_ID });

  try {
    const inf = await client.inference(
      {
        model: "router-auto",
        messages: [{ role: "user", content: "hi" }],
        stream: false
      },
      { traceId: "trace-sdk-selftest" }
    );
    assert.equal(inf.ok, true);
    assert.equal(inf.json.echo, "inference");

    const job = await client.enqueueJob({
      adapterName: "pilot-inbox",
      traceId: "job-trace-1",
      payload: { kind: "inference_v1", request: { model: "x", messages: [] } }
    });
    assert.equal(job.ok, true);
    assert.equal(job.json.jobId, 42);

    const env = await client.readEnvKeys(["PORT", "HOME"]);
    assert.equal(env.ok, true);
    assert.equal(env.json.values?.HOME, "/x");

    const fsr = await client.readFilesystemRoots();
    assert.equal(fsr.ok, true);
    assert.equal(fsr.json.roots?.length, 1);

    ok("meimei-sdk contract selftest");
  } catch (e) {
    fail(e instanceof Error ? e.message : String(e));
  } finally {
    server.close();
  }
});
