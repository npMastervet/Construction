"use strict";

const { z } = require("zod");

function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.params !== undefined) req.params = parsed.params;
      // Express 5: req.query is a read-only getter — store parsed query separately
      if (parsed.query !== undefined) req.validatedQuery = parsed.query;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "ข้อมูลไม่ถูกต้อง",
          code: "VALIDATION",
          errors: err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}

module.exports = { validate };
