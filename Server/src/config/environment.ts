export interface RuntimeEnvironment {
  port: number;
  allowedOrigins: string[];
  trustProxy: number;
  production: boolean;
}

/** Validate before loading the inherited auth/Prisma modules. Never log values. */
export function readEnvironment(env: NodeJS.ProcessEnv): RuntimeEnvironment {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || env.JWT_SECRET === "change_me_in_env") {
    throw new Error("JWT_SECRET must contain at least 32 characters. Run npm run setup or configure Server/.env.");
  }
  let databaseUrl: URL;
  try {
    databaseUrl = new URL(env.DATABASE_URL || "");
  } catch {
    throw new Error("DATABASE_URL must be a valid MySQL connection URL.");
  }
  if (databaseUrl.protocol !== "mysql:" || !databaseUrl.hostname || databaseUrl.pathname.length < 2) {
    throw new Error("DATABASE_URL must specify a MySQL host and database.");
  }
  const port = Number(env.PORT || "5001");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be between 1 and 65535.");
  const trustProxy = Number(env.TRUST_PROXY_HOPS || "0");
  if (!Number.isInteger(trustProxy) || trustProxy < 0 || trustProxy > 10) throw new Error("TRUST_PROXY_HOPS must be between 0 and 10.");
  const refreshDays = Number(env.JWT_REFRESH_EXPIRES_DAYS || "30");
  if (!Number.isInteger(refreshDays) || refreshDays < 1 || refreshDays > 365) throw new Error("JWT_REFRESH_EXPIRES_DAYS must be between 1 and 365.");
  if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
    throw new Error("Configure both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or leave both empty.");
  }
  const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (allowedOrigins.length === 0) throw new Error("ALLOWED_ORIGINS must include the frontend origin.");
  for (const origin of allowedOrigins) {
    let parsed: URL;
    try { parsed = new URL(origin); } catch { throw new Error("ALLOWED_ORIGINS contains an invalid origin."); }
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error("ALLOWED_ORIGINS must contain exact HTTP(S) origins without paths.");
    }
  }
  return { port, allowedOrigins, trustProxy, production: env.NODE_ENV === "production" };
}
