"use strict";

const rateLimit = require("express-rate-limit");

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

// ครอบ /api ทั้งหมด — กันการยิงถล่มระดับกว้าง
const globalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: Number(process.env.RATE_LIMIT_MAX) || 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่" },
});

// เข้มกว่า globalLimiter — ใช้กับ /auth/google เพื่อกัน brute force
const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "พยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่" },
});

// ใช้ครอบ route ที่เขียนข้อมูล (POST/PATCH/DELETE) ของโมดูลที่จะเพิ่มเข้ามา
const writeLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่" },
});

// ผ่อนกว่า authLimiter — client เรียก refresh อัตโนมัติเมื่อ access token หมดอายุ
const refreshLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "คำขอ token มากเกินไป กรุณารอสักครู่" },
});

module.exports = {
  globalLimiter,
  authLimiter,
  writeLimiter,
  refreshLimiter,
};
