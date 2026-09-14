// อัปเวอร์ชัน (patch) + บันทึกวันที่อัปเวอร์ชันแบบเข้ารหัส base64 ลง package.json
// ใช้ผ่าน `npm run build:up-ver` (bump+build) หรือ `npm run release:patch` (bump อย่างเดียว)
// build ธรรมดา (`npm run build`) จะ "ไม่" เรียกสคริปต์นี้ — เวอร์ชันจึงไม่เปลี่ยน
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const pkgPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json")
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))

const [major, minor, patch] = String(pkg.version).split(".").map(Number)
const nextVersion = `${major}.${minor}.${patch + 1}`
// เข้ารหัส base64 ของ ISO timestamp — ถอดด้วย: atob(value) หรือ Buffer.from(value,"base64").toString()
const versionDate = Buffer.from(new Date().toISOString()).toString("base64")

// เขียน version ใหม่ + วาง versionDate ถัดจาก version ทันที โดยรักษาลำดับ field อื่นไว้
const ordered = {}
for (const key of Object.keys(pkg)) {
  if (key === "versionDate") continue // เขียนใหม่ถัดจาก version เสมอ
  ordered[key] = key === "version" ? nextVersion : pkg[key]
  if (key === "version") ordered.versionDate = versionDate
}

writeFileSync(pkgPath, JSON.stringify(ordered, null, 2) + "\n")
console.log(`✓ version ${pkg.version} → ${nextVersion}  | versionDate(base64) ${versionDate}`)
