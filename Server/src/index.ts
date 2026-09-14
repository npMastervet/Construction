import "dotenv/config";
import { readEnvironment } from "./config/environment";
import { createApp } from "./app";

const environment = readEnvironment(process.env);
const app = createApp(environment);
const server = app.listen(environment.port, () => {
  console.log(`Construction API listening on port ${environment.port}`);
});

let stopping = false;
function shutdown(exitCode: number) {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 10_000);
  timeout.unref();
  server.close(async () => {
    try {
      const prisma = require("./config/prisma");
      await prisma.$disconnect();
      process.exit(exitCode);
    } catch { process.exit(1); }
  });
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.message);
  shutdown(1);
});
process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled rejection:", reason instanceof Error ? reason.message : "Unknown error");
  shutdown(1);
});
