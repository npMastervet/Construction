"use strict";

/**
 * Routers ของ core ทั้งหมด — ลำดับใน array คือลำดับที่ mount ใน server.js
 *
 * ระวังเรื่องลำดับ: router ที่มี path แบบ `/:id` ต้องอยู่ *หลัง* router ที่มี path เจาะจง
 * มิฉะนั้น `/users/:id` จะกลืน path อย่าง `/users/me`
 *
 * การเพิ่มโมดูลใหม่ให้สร้าง `src/modules/<name>/index.js` ที่ export routers เป็น array
 * แล้ว require + spread เข้าไปใน server.js — ไม่ใช่ไฟล์นี้ (ไฟล์นี้สงวนไว้สำหรับ core)
 */
module.exports = [
  require("./auth/routes/auth"),
];
