/**
 * dateUtils.js — Unified date/timezone helpers (Frontend mirror of Server/src/utils/dateUtils.js)
 *
 * Convention:
 *  - ชั้น A (Calendar Date): เก็บเป็น UTC midnight; "วันนี้" ธุรกิจ = Bangkok calendar day
 *  - ชั้น B (Timestamp/Instant): DateTime UTC; แสดงด้วย timeZone: "Asia/Bangkok"
 *
 * Thailand = UTC+7 fixed offset (ไม่มี DST)
 */

export const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Normalize any stored @db.Date / calendar Date → UTC midnight
 * ใช้กับค่าที่อ่านจาก API — ห้ามใช้กับ "วันนี้" (ใช้ bangkokTodayAsUtc แทน)
 */
export function toUtcDateOnly(d) {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
}

/** Date → "YYYY-MM-DD" via UTC parts (ไม่พึ่ง local timezone) */
export function utcDateKey(d) {
  const x = d instanceof Date ? d : toUtcDateOnly(d);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, "0");
  const day = String(x.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Bangkok calendar day ของ instant → "YYYY-MM-DD"
 * ใช้สำหรับ "วันนี้" ธุรกิจ (lock/open, asOf default)
 * @param {Date} [now]
 * @returns {string} "YYYY-MM-DD"
 */
export function bangkokTodayKey(now = new Date()) {
  const bkk = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  const y = bkk.getUTCFullYear();
  const m = String(bkk.getUTCMonth() + 1).padStart(2, "0");
  const d = String(bkk.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Bangkok calendar day ของ instant → UTC midnight Date
 * @param {Date} [now]
 * @returns {Date}
 */
export function bangkokTodayAsUtc(now = new Date()) {
  const key = bangkokTodayKey(now);
  const [y, mo, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d));
}

/**
 * Bangkok calendar year ของ instant
 * @param {Date} [d]
 * @returns {number}
 */
export function bangkokYear(d = new Date()) {
  return Number(bangkokTodayKey(d).slice(0, 4));
}

/**
 * UTC today → "YYYY-MM-DD"
 * สำหรับ log/audit timestamp เท่านั้น — ห้ามใช้กับ business lock/asOf
 * @param {Date} [now]
 * @returns {string}
 */
export function utcTodayKey(now = new Date()) {
  return utcDateKey(toUtcDateOnly(now));
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/**
 * Calendar date → Thai display ("2 มกราคม 2568")
 * ใช้ UTC parts ป้องกัน off-by-one เมื่อ server เก็บ UTC midnight
 * @param {Date|string} dateVal
 * @returns {string}
 */
export function formatDateTh(dateVal) {
  const d = toUtcDateOnly(dateVal);
  return d.toLocaleDateString("th-TH", { timeZone: "UTC", dateStyle: "long" });
}

/**
 * Calendar date → Thai short display ("2 ม.ค. 2568")
 * @param {Date|string} dateVal
 * @returns {string}
 */
export function formatDateThShort(dateVal) {
  const d = toUtcDateOnly(dateVal);
  return d.toLocaleDateString("th-TH", { timeZone: "UTC", dateStyle: "medium" });
}

/**
 * Timestamp → Thai display ("2 ม.ค. 2568 09:30 น.")
 * ใช้ timeZone Asia/Bangkok เสมอ — ทุก user เห็นเวลาเดียวกัน
 * @param {Date|string} dateVal
 * @returns {string}
 */
export function formatTimestampTh(dateVal) {
  return new Date(dateVal).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * Timestamp → Thai date-only from Bangkok timezone
 * @param {Date|string} dateVal
 * @returns {string}
 */
export function formatTimestampDateTh(dateVal) {
  return new Date(dateVal).toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
  });
}
