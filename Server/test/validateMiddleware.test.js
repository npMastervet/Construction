"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { z } = require("zod");
const { validate } = require("../src/middleware/validateMiddleware");

function createExpress5LikeReq(overrides = {}) {
  const query = { search: "dev", limit: "8", ...(overrides.query || {}) };
  const req = {
    body: overrides.body ?? {},
    params: overrides.params ?? {},
    validatedQuery: undefined,
  };
  Object.defineProperty(req, "query", {
    get() {
      return query;
    },
    configurable: true,
  });
  return { req, query };
}

function runMiddleware(middleware, req, res = {}) {
  return new Promise((resolve, reject) => {
    const next = (err) => (err ? reject(err) : resolve());
    middleware(req, res, next);
  });
}

test("validate stores parsed query on req.validatedQuery when req.query is read-only", async () => {
  const schema = z.object({
    query: z.object({
      search: z.string().max(100).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
    }),
  });
  const { req, query } = createExpress5LikeReq();
  const middleware = validate(schema);

  await runMiddleware(middleware, req);

  assert.deepEqual(req.validatedQuery, { search: "dev", limit: "8" });
  assert.equal(req.query, query);
  assert.equal(req.query.search, "dev");
});

test("validate does not throw when assigning to read-only req.query", async () => {
  const schema = z.object({
    query: z.object({ page: z.string().regex(/^\d+$/).optional() }),
  });
  const { req } = createExpress5LikeReq({ query: { page: "2" } });

  await assert.doesNotReject(() => runMiddleware(validate(schema), req));
  assert.equal(req.validatedQuery.page, "2");
});

test("validate returns 400 on invalid query", async () => {
  const schema = z.object({
    query: z.object({ limit: z.string().regex(/^\d+$/) }),
  });
  const { req } = createExpress5LikeReq({ query: { limit: "abc" } });
  let statusCode;
  let responseBody;

  await new Promise((resolve, reject) => {
    const resWithDone = {
      status(code) {
        statusCode = code;
        return resWithDone;
      },
      json(body) {
        responseBody = body;
        resolve();
        return resWithDone;
      },
    };
    validate(schema)(req, resWithDone, (err) => (err ? reject(err) : resolve()));
  });

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(responseBody.code, "VALIDATION");
  assert.ok(Array.isArray(responseBody.errors));
});
