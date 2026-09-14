import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const [directory, example] of [["Client", ".env.Example"], ["Server", ".env.example"]]) {
  const target = path.join(root, directory, ".env");
  if (existsSync(target)) {
    console.log(`${directory}/.env already exists; left unchanged.`);
    continue;
  }
  let content = readFileSync(path.join(root, directory, example), "utf8");
  if (directory === "Server") content = content.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(48).toString("hex")}`);
  writeFileSync(target, content, { flag: "wx", mode: 0o600 });
  console.log(`Created ${directory}/.env.`);
}
console.log("Set DATABASE_URL and Google OAuth credentials in Server/.env before login testing. Secrets were not printed.");
