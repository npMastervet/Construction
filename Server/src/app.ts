import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import type { RuntimeEnvironment } from "./config/environment";
import { createModuleRouters } from "./modules";

export interface AppDependencies {
  probeDatabase?: () => Promise<void>;
}

/** Called after environment validation; legacy CommonJS modules stay reusable. */
export function createApp(environment: RuntimeEnvironment, dependencies: AppDependencies = {}) {
  const passport = require("./config/passportGoogle");
  const prisma = require("./config/prisma");
  const coreRouters = require("./core/index");
  const { globalLimiter } = require("./middleware/rateLimitMiddleware");
  const probeDatabase = dependencies.probeDatabase || (async () => { await prisma.$queryRaw`SELECT 1`; });
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", environment.trustProxy);
  app.set("etag", false);
  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || environment.allowedOrigins.includes(origin)) return callback(null, true);
      callback(Object.assign(new Error("Not allowed by CORS"), { statusCode: 403 }));
    },
    credentials: true,
  }));
  app.use(morgan(environment.production ? "combined" : "dev"));
  app.use(express.json({ limit: "2mb" }));
  app.use(passport.initialize());
  app.use("/api", globalLimiter);
  for (const router of [...coreRouters, ...createModuleRouters()]) app.use("/api", router);

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { service: "construction-api", status: "up" } });
  });
  app.get("/ready", async (_req, res) => {
    try {
      await probeDatabase();
      res.json({ success: true, data: { database: "reachable" } });
    } catch {
      res.status(503).json({ success: false, message: "Database is unavailable" });
    }
  });
  app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));
  const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const candidate = Number(error.statusCode || error.status);
    const status = Number.isInteger(candidate) && candidate >= 400 && candidate <= 599 ? candidate : 500;
    console.error("Request failed:", error.message);
    res.status(status).json({
      success: false,
      message: status >= 500 && environment.production ? "Server error" : error.message || "Server error",
      ...(status < 500 && error.code ? { code: error.code } : {}),
      ...(status < 500 && error.details ? { details: error.details } : {}),
    });
  };
  app.use(errorHandler);
  return app;
}
