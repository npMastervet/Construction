const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { randomUUID } = require("node:crypto");

test("organization/project boundaries against a migrated real database", { skip: !process.env.CONSTRUCTION_TEST_DATABASE_URL }, async (t) => {
  const url = new URL(process.env.CONSTRUCTION_TEST_DATABASE_URL);
  assert.match(url.pathname, /_test$/, "Integration tests require a database name ending in _test");
  Object.assign(process.env, { DATABASE_URL: url.toString(), NODE_ENV: "test", JWT_SECRET: "construction-integration-test-secret-only-2026", ALLOWED_ORIGINS: "http://localhost:5174", GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "" });
  const db = require("../dist/config/prisma");
  const { bootstrapOrganization } = require("../dist/core/identity/bootstrap");
  const { ConstructionService } = require("../dist/modules/construction/service");
  const { createApp } = require("../dist/app");
  const { readEnvironment } = require("../dist/config/environment");
  const jwt = require("jsonwebtoken");
  const tag = randomUUID().slice(0, 8).toUpperCase();
  const seed = { code: `TEST-${tag}`, name: "Test organization", email: `owner-${tag}@example.test`, displayName: "Owner" };
  const boot = await bootstrapOrganization(db, seed);
  const other = await bootstrapOrganization(db, { ...seed, code: `OTHER-${tag}`, email: `other-${tag}@example.test` });
  const owner = await db.user.findUniqueOrThrow({ where: { email: seed.email.toLowerCase() } });
  const ownerOther = await db.organizationMember.findUniqueOrThrow({ where: { id: other.memberId } });
  const server = createApp(readEnvironment(process.env)).listen(0, "127.0.0.1"); await once(server, "listening");
  t.after(async () => { await new Promise((resolve) => server.close(resolve)); await db.$disconnect(); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const token = (id) => jwt.sign({ id, role: "SUPERADMIN", company: "ALL" }, process.env.JWT_SECRET, { expiresIn: "5m" });
  const request = async (user, path, method = "GET", body) => {
    const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(user ? { Authorization: `Bearer ${token(user)}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, ...(await response.json()) };
  };
  const root = `/organizations/${boot.organizationId}`;
  const add = async (name, role) => { const result = await request(owner.id, `${root}/members`, "POST", { email: `${name}-${tag}@example.test`, displayName: name, role }); assert.equal(result.status, 201); return result.data; };
  const accountant = await add("accountant", "ACCOUNTANT");
  const manager = await add("manager", "MEMBER");
  const recorder = await add("recorder", "MEMBER");
  const viewer = await add("viewer", "MEMBER");
  const outsider = await db.user.create({ data: { email: `outsider-${tag}@example.test`, displayName: "Outsider", role: "SUPERADMIN" } });
  const created = await request(owner.id, `${root}/projects`, "POST", { code: "P-01", name: "House 100%", clientName: "Client", clientContact: "Private", startDate: "2026-01-01", endDate: "2026-12-31" });
  assert.equal(created.status, 201);
  const project = created.data; const path = `${root}/projects/${project.id}`;
  for (const [member, role] of [[manager, "MANAGER"], [recorder, "RECORDER"], [viewer, "VIEWER"]]) {
    assert.equal((await request(owner.id, `${path}/members/${member.id}`, "PUT", { version: null, role, status: "ACTIVE", canReadCosts: role === "VIEWER" })).status, 200);
  }
  await t.test("bootstrap is repeatable without escalating or overwriting existing accounts", async () => {
    assert.equal((await bootstrapOrganization(db, seed)).created, false);
    await assert.rejects(bootstrapOrganization(db, { ...seed, email: outsider.email }), (e) => e.code === "BOOTSTRAP_CONFLICT");
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: owner.id } })).role, "USER");
  });
  await t.test("authentication, tenant isolation and global legacy role bypass are enforced", async () => {
    assert.equal((await request(null, `${root}/context`)).status, 401);
    assert.equal((await request(outsider.id, `${root}/context`)).status, 404);
    assert.equal((await request(ownerOther.userId, path)).status, 404);
    assert.equal((await request(owner.id, `/organizations/${other.organizationId}/projects`)).status, 404);
    assert.equal((await request(accountant.user.id, `${root}/projects`, "POST", { code: "BAD", name: "No", clientName: "No" })).status, 403);
    assert.equal((await request(owner.id, `${root}/projects?search=%25`)).data.length, 1);
    assert.equal((await request(owner.id, `${root}/projects?search=_`)).data.length, 0);
    assert.equal((await request(owner.id, `${root}/projects?pageSize=101`)).status, 400);
    const hidden = await request(owner.id, `${root}/projects`, "POST", { code: "P-02", name: "Unassigned", clientName: "Other" });
    assert.equal((await request(recorder.user.id, `${root}/projects/${hidden.data.id}`)).status, 404);
    const scoped = await request(recorder.user.id, `${root}/projects`); assert.equal(scoped.meta.total, 1);
  });
  await t.test("decimal contract calculations and financial field projection", async () => {
    const saved = await request(owner.id, `${path}/contract`, "PUT", { version: 1, netAmount: "0.50", vatRate: "0.07" }); assert.equal(saved.status, 200);
    assert.deepEqual(saved.data.contract, { netAmount: "0.50", vatRate: "0.070000", vatAmount: "0.04", grossAmount: "0.54" });
    for (const member of [recorder, viewer]) { const r = await request(member.user.id, path); assert.equal(r.status, 200); assert.equal("contract" in r.data, false); assert.equal("clientContact" in r.data, false); }
    assert.equal((await request(manager.user.id, path)).data.contract.grossAmount, "0.54");
    assert.equal((await request(manager.user.id, `${path}/contract`, "PUT", { version: 2, netAmount: "1", vatRate: "0" })).status, 403);
    assert.equal((await request(owner.id, `${path}/contract`, "PUT", { version: 2, netAmount: "9999999999999999.99", vatRate: "1" })).status, 400);
  });
  await t.test("strict validation, closed transitions and optimistic write conflicts", async () => {
    assert.equal((await request(owner.id, path, "PATCH", { version: 2, startDate: "2026-02-30" })).status, 400);
    assert.equal((await request(owner.id, path, "PATCH", { version: 2, startDate: "2027-01-01" })).status, 400);
    assert.equal((await request(owner.id, path, "PATCH", { version: 2, status: "APPROVED" })).status, 400);
    assert.equal((await request(manager.user.id, path, "PATCH", { version: 2, contractNet: "1" })).status, 403);
    const results = await Promise.all(["A", "B"].map((name) => request(owner.id, path, "PATCH", { version: 2, name })));
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    assert.equal((await request(owner.id, `${path}/transitions`, "POST", { version: 3, to: "QUOTATION" })).status, 200);
    assert.equal((await request(owner.id, `${path}/transitions`, "POST", { version: 4, to: "APPROVED" })).code, "PRECONDITION_FAILED");
    assert.equal((await request(owner.id, `${path}/transitions`, "POST", { version: 4, to: "CANCELLED" })).status, 400);
  });
  await t.test("large decimal products retain precision before cent rounding", async () => {
    const high = await request(owner.id, `${root}/projects`, "POST", { code: "HIGH", name: "Precision", clientName: "Client" });
    const result = await request(owner.id, `${root}/projects/${high.data.id}/contract`, "PUT", { version: 1, netAmount: "6000000000000000.01", vatRate: "0.499999" });
    assert.equal(result.status, 200);
    assert.equal(result.data.contract.vatAmount, "2999994000000000.00");
    assert.equal(result.data.contract.grossAmount, "8999994000000000.01");
  });
  await t.test("inherited refresh rotation remains atomic after adding business routes", async () => {
    const refreshToken = randomUUID();
    await db.refreshToken.create({ data: { tokenHash: require("node:crypto").createHash("sha256").update(refreshToken).digest("hex"), userId: owner.id, expiresAt: new Date(Date.now() + 60000) } });
    const results = await Promise.all([request(null, "/auth/refresh", "POST", { refreshToken }), request(null, "/auth/refresh", "POST", { refreshToken })]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 401]);
  });
  await t.test("suppliers enforce role projections and audit filtering", async () => {
    const result = await request(accountant.user.id, `${root}/suppliers`, "POST", { name: "Vendor", taxId: "1234567890123", email: "private@example.test" }); assert.equal(result.status, 201);
    const supplierPath = `${root}/suppliers/${result.data.id}`;
    assert.equal("taxId" in (await request(recorder.user.id, supplierPath)).data, false);
    assert.equal((await request(manager.user.id, supplierPath)).data.taxId, "1234567890123");
    assert.equal((await request(viewer.user.id, supplierPath)).status, 403);
    assert.equal((await request(ownerOther.userId, supplierPath)).status, 404);
    assert.equal((await request(accountant.user.id, supplierPath, "PATCH", { version: 1, status: "ARCHIVED" })).status, 200);
    assert.equal((await request(owner.id, `${root}/suppliers`)).meta.total, 0);
    assert.equal((await request(accountant.user.id, `${root}/audit-events`)).data.every((e) => e.entityType === "Supplier"), true);
    assert.equal((await request(manager.user.id, `${root}/audit-events`)).data.every((e) => e.projectId === project.id), true);
    assert.equal((await request(viewer.user.id, `${root}/audit-events`)).status, 403);
  });
  await t.test("revocation takes effect with unchanged access tokens", async () => {
    assert.equal((await request(owner.id, `${root}/members/${recorder.id}`, "PATCH", { version: 1, status: "SUSPENDED" })).status, 200);
    assert.equal((await request(recorder.user.id, path)).status, 404);
    await db.user.update({ where: { id: viewer.user.id }, data: { status: "INACTIVE" } });
    assert.equal((await request(viewer.user.id, path)).status, 401);
  });
  await t.test("database composite foreign keys reject cross-organization assignment", async () => {
    await assert.rejects(db.projectMember.create({ data: { organizationId: boot.organizationId, projectId: project.id, organizationMemberId: other.memberId, role: "MANAGER" } }));
  });
  await t.test("audit failure rolls back the business write", async () => {
    const failingDb = new Proxy(db, { get(target, prop) { if (prop === "$transaction") return (work, options) => target.$transaction((tx) => work(new Proxy(tx, { get(inner, key) { if (key === "auditLog") return { create: async () => { throw new Error("audit unavailable"); } }; return inner[key]; } })), options); return target[prop]; } });
    await assert.rejects(new ConstructionService(failingDb).createProject(owner.id, boot.organizationId, "rollback-test", { code: "ROLLBACK", name: "Should not persist", clientName: "Client" }), /audit unavailable/);
    assert.equal(await db.project.count({ where: { organizationId: boot.organizationId, code: "ROLLBACK" } }), 0);
  });
  await t.test("concurrent owner demotions cannot remove the final active owner", async () => {
    const second = await add("second-owner", "OWNER");
    const results = await Promise.all([request(owner.id, `${root}/members/${boot.memberId}`, "PATCH", { version: 1, role: "MEMBER" }), request(second.user.id, `${root}/members/${second.id}`, "PATCH", { version: 1, role: "MEMBER" })]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    assert.equal(await db.organizationMember.count({ where: { organizationId: boot.organizationId, role: "OWNER", status: "ACTIVE" } }), 1);
  });
});
