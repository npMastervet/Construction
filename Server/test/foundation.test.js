const assert = require("node:assert/strict");
const { test, before, after } = require("node:test");
const { once } = require("node:events");
const { readEnvironment } = require("../dist/config/environment");

// Test-only values; no real DB connection or Google authentication is required.
const testEnvironment = {
  NODE_ENV: "test",
  DATABASE_URL: "mysql://test:test@127.0.0.1:3306/construction_test",
  JWT_SECRET: "construction-test-only-secret-not-for-production",
  ALLOWED_ORIGINS: "http://localhost:5173",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
};

test("startup rejects missing/placeholder signing secrets and invalid configuration", () => {
  for (const value of [undefined, "", "change_me_in_env", "short"]) {
    assert.throws(() => readEnvironment({ ...testEnvironment, JWT_SECRET: value }), /JWT_SECRET/);
  }
  assert.throws(() => readEnvironment({ ...testEnvironment, DATABASE_URL: "postgres://localhost/db" }), /DATABASE_URL/);
  assert.throws(() => readEnvironment({ ...testEnvironment, PORT: "70000" }), /PORT/);
  assert.throws(() => readEnvironment({ ...testEnvironment, TRUST_PROXY_HOPS: "-1" }), /TRUST_PROXY/);
  assert.throws(() => readEnvironment({ ...testEnvironment, ALLOWED_ORIGINS: "*" }), /ALLOWED_ORIGINS/);
  assert.throws(() => readEnvironment({ ...testEnvironment, GOOGLE_CLIENT_ID: "partial-config" }), /GOOGLE_CLIENT/);
  assert.equal(readEnvironment(testEnvironment).trustProxy, 0);
});

let server;
let baseUrl;
let databaseAvailable = true;
before(async () => {
  Object.assign(process.env, testEnvironment);
  const { createApp } = require("../dist/app");
  const app = createApp(readEnvironment(testEnvironment), {
    probeDatabase: async () => { if (!databaseAvailable) throw new Error("test database unavailable"); },
  });
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await require("../dist/config/prisma").$disconnect();
});

test("compiled TypeScript app mounts the inherited auth routes and health endpoint", async () => {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).data.service, "construction-api");
  assert.equal(health.headers.get("x-powered-by"), null);
  const currentUser = await fetch(`${baseUrl}/api/auth/current-user`);
  assert.equal(currentUser.status, 401);
  const google = await fetch(`${baseUrl}/api/auth/google`, { redirect: "manual" });
  assert.equal(google.status, 503);
});

test("readiness reports database availability separately from process health", async () => {
  databaseAvailable = true;
  assert.equal((await fetch(`${baseUrl}/ready`)).status, 200);
  databaseAvailable = false;
  assert.equal((await fetch(`${baseUrl}/ready`)).status, 503);
  assert.equal((await fetch(`${baseUrl}/health`)).status, 200);
  databaseAvailable = true;
});

test("CORS allow-list, unknown paths and malformed JSON return controlled errors", async () => {
  const allowed = await fetch(`${baseUrl}/health`, { headers: { Origin: "http://localhost:5173" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");
  assert.equal((await fetch(`${baseUrl}/health`, { headers: { Origin: "https://untrusted.invalid" } })).status, 403);
  const missing = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).success, false);
  const malformed = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{",
  });
  assert.equal(malformed.status, 400);
});
