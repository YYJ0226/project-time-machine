import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// Real Next production HTTP integration, deliberately not a browser/visual test.
// All provider calls terminate at this in-process fixture, never real Supabase/AI/GitHub.
const token = "a".repeat(43);
const id = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
let revoked = false;
let unexpectedRequests = 0;
const snapshot = {
  version: 1,
  capturedAt: "2026-10-16T12:00:00Z",
  project: {
    name: "fixture",
    full_name: "student/fixture",
    html_url: "https://github.com/student/fixture",
  },
  evidence: [
    {
      id,
      kind: "commit",
      title: "HTTP_FIXTURE_EVIDENCE <script>alert(1)</script>",
      state: "recorded",
      source_url: "https://github.com/student/fixture/commit/abc",
      occurred_at: "2026-10-16T10:00:00Z",
    },
  ],
  links: [],
  narrative: {
    label: "AI 生成，经学生编辑并确认；不代表原始事实",
    reviewedAt: "2026-10-16T11:00:00Z",
    content: {
      summary: `APPROVED_FIXTURE_SUMMARY [${id}]`,
      gaps: "当前样本未显示用户测试，待核对。",
      script: `展示提交 [${id}]`,
      citations: [id],
    },
  },
  unreviewed: "PRIVATE_DRAFT_SENTINEL",
};
const fixture = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/rest/v1/rpc/get_public_review") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(!revoked && body.p_token === token ? snapshot : null),
    );
  } else {
    unexpectedRequests++;
    res.writeHead(503);
    res.end("Unexpected fixture request");
  }
});
fixture.listen(0, "127.0.0.1");
await once(fixture, "listening");
const fixturePort = fixture.address().port;
const reservation = createServer();
reservation.listen(0, "127.0.0.1");
await once(reservation, "listening");
const appPort = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const base = `http://127.0.0.1:${appPort}`;
const local = await readFile(new URL("../.env.local", import.meta.url), "utf8")
  .then(parseEnv)
  .catch(() => ({}));
const env = { ...process.env };
// Empty overrides prevent Next's dotenv loader from restoring local credentials.
for (const name of new Set([...Object.keys(local), ...Object.keys(env)])) {
  if (
    name in local ||
    /SUPABASE|DEEPSEEK|GITHUB|TOKEN|PASSWORD|SECRET|PROXY|VERCEL/i.test(name)
  )
    env[name] = "";
}
Object.assign(env, {
  NODE_ENV: "production",
  PTM_TEST_BUILD: "1",
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${fixturePort}`,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_fixture_only",
  APP_ORIGIN: "https://release.example.invalid",
  NO_PROXY: "localhost,127.0.0.1,::1",
});
// Build-time font downloads may need the user's proxy. No real provider credentials are inherited.
const buildEnv = { ...env };
for (const name of ["HTTPS_PROXY", "HTTP_PROXY", "https_proxy", "http_proxy"])
  if (local[name] || process.env[name])
    buildEnv[name] = local[name] || process.env[name];
const next = new URL("../node_modules/next/dist/bin/next", import.meta.url);
const children = new Set();
const launch = (args, childEnv) => {
  const child = spawn(process.execPath, [fileURLToPath(next), ...args], {
    cwd: new URL("..", import.meta.url),
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  children.add(child);
  // Keep output for failures, but do not print logs containing cookies or provider payloads.
  let tail = "";
  child.stdout.on("data", (data) => {
    tail = (tail + data).slice(-4000);
  });
  child.stderr.on("data", (data) => {
    tail = (tail + data).slice(-4000);
  });
  child.on("error", () => {});
  return { child, tail: () => tail };
};
const request = (path) =>
  fetch(base + path, {
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
  });
let server;
try {
  console.log(
    "Building isolated production HTTP fixture (.next-smoke; no real credentials or writes)…",
  );
  const build = launch(["build"], buildEnv);
  const buildTimeout = setTimeout(() => build.child.kill(), 180000);
  buildTimeout.unref();
  let code;
  try {
    [code] = await once(build.child, "exit");
  } finally {
    clearTimeout(buildTimeout);
  }
  assert.equal(
    code,
    0,
    "Isolated production build failed. Run npm run build to inspect diagnostics.",
  );
  server = launch(
    ["start", "--hostname", "127.0.0.1", "--port", String(appPort)],
    env,
  );
  const deadline = Date.now() + 45000;
  let up = false;
  while (Date.now() < deadline && server.child.exitCode === null) {
    try {
      const response = await request("/api/health");
      if (response.status === 200) {
        up = true;
        break;
      }
    } catch {}
    await delay(250);
  }
  assert.ok(up, "Fixture production server did not start");
  let passed = 0;
  const check = async (name, fn) => {
    await fn();
    passed++;
    console.log(`PASS ${name}`);
  };
  await check(
    "public health is non-cached and independent of providers",
    async () => {
      const response = await request("/api/health");
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        status: "ok",
        app: "project-time-machine",
      });
      assert.match(response.headers.get("cache-control"), /no-store/);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.equal(response.headers.get("x-frame-options"), "DENY");
      assert.match(
        response.headers.get("content-security-policy"),
        /frame-ancestors 'none'/,
      );
      assert.equal(response.headers.get("x-powered-by"), null);
    },
  );
  await check(
    "incomplete production configuration fails readiness without leaking details",
    async () => {
      const response = await request("/api/ready");
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), {
        status: "configuration_required",
      });
    },
  );
  await check(
    "public homepage and login render without upstream authentication",
    async () => {
      for (const path of ["/", "/login"]) {
        const response = await request(path);
        assert.equal(response.status, 200);
        assert.match(await response.text(), /Project Time Machine/);
      }
    },
  );
  await check("callback ignores spoofed forwarded host", async () => {
    const response = await fetch(base + "/auth/callback?next=//evil.invalid", {
      headers: { "x-forwarded-host": "evil.invalid" },
      redirect: "manual",
    });
    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      "https://release.example.invalid/auth/auth-code-error",
    );
  });
  await check("private export requires a session", async () => {
    const response = await request(
      `/app/projects/${projectId}/export?format=report`,
    );
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location"), /\/login\?error=session$/);
  });
  await check(
    "anonymous snapshot renders approved text but not private drafts or executable HTML",
    async () => {
      const response = await request(`/review/${token}`);
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(html, /APPROVED_FIXTURE_SUMMARY/);
      assert.match(html, /HTTP_FIXTURE_EVIDENCE/);
      assert.ok(!html.includes("PRIVATE_DRAFT_SENTINEL"));
      assert.ok(!html.includes("<script>alert(1)</script>"));
      assert.equal(response.headers.get("set-cookie"), null);
      assert.equal(response.headers.get("referrer-policy"), "no-referrer");
      assert.match(response.headers.get("x-robots-tag"), /noindex/);
      assert.match(response.headers.get("cache-control"), /no-store/);
    },
  );
  await check(
    "revocation is rechecked on the next anonymous request",
    async () => {
      revoked = true;
      const response = await request(`/review/${token}`);
      const html = await response.text();
      assert.match(html, /此审阅链接不可用/);
      assert.ok(!html.includes("APPROVED_FIXTURE_SUMMARY"));
    },
  );
  await check(
    "malformed capability is rejected and never authenticated",
    async () => {
      const response = await request("/review/not-a-token");
      assert.match(await response.text(), /此审阅链接不可用/);
      assert.equal(unexpectedRequests, 0);
    },
  );
  console.log(
    `PASS: ${passed} production HTTP checks. Fixtures are synthetic; browser interactions and cloud policies are checked separately.`,
  );
} catch (error) {
  console.error("HTTP integration failed:", error.message);
  process.exitCode = 1;
} finally {
  for (const child of children) if (child.exitCode === null) child.kill();
  fixture.closeAllConnections();
  await new Promise((resolve) => fixture.close(resolve));
}
