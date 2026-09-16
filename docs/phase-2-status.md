# ระยะข้อมูลกิจการและโครงการ

อัปเดต 14 กันยายน 2026 — ใช้ BaseReactAuth เป็นฐานเดิมและเพิ่ม business modules ด้วย TypeScript

## ส่งมอบแล้ว

- Migration `20260914120000_organization_projects` เพิ่ม 6 ตารางโดยไม่ลบหรือเปลี่ยน auth tables เดิม พร้อม composite foreign keys ป้องกันการมอบหมายสมาชิกคนละกิจการ
- CLI bootstrap สร้างกิจการและ OWNER โดยระบุอีเมลชัดเจน ทำซ้ำได้สำหรับเจ้าของเดิม ไม่ยกระดับบัญชีที่มีอยู่แล้ว ไม่เปิด public registration และไม่ส่งอีเมล
- API รายการกิจการ/context/แก้ไขกิจการ, เพิ่มและแก้สมาชิก, โครงการ/สัญญา/สถานะ/ทีม, ผู้ขาย/เก็บเข้าคลัง และ audit ตาม contract ระยะ 0
- OWNER/ACCOUNTANT/MEMBER และ MANAGER/RECORDER/VIEWER ตรวจจากฐานข้อมูลทุกคำขอ; USER/HR/ADMIN/SUPERADMIN เดิมไม่ข้ามสิทธิ์กิจการ
- DTO แยกข้อมูลสัญญาและข้อมูลติดต่อผู้ขายตามสิทธิ์, query/count จำกัดกิจการและโครงการ, audit จำกัดขอบเขตตาม role
- การแก้ไขใช้ version; การเขียนล็อก organization row แล้วตรวจสมาชิกและบันทึก audit ใน transaction เดียว รองรับคำขอลดสิทธิ์ OWNER พร้อมกันโดยยังเหลือเจ้าของอย่างน้อยหนึ่งคน
- เงินสัญญารับ/ส่งเป็น decimal string, คูณด้วย precision 40 แล้วปัด HALF_UP ที่สตางค์ ตรวจ overflow ก่อนเขียน
- หน้าจอเลือกกิจการ รายการ/สร้าง/แก้ไขโครงการ สัญญา ทีม สมาชิก ผู้ขาย ตั้งค่ากิจการ และประวัติ พร้อม RHF/Zod, TanStack Query และ lazy routes
- Cache แยก user/org/project และล้างเมื่อ logout/สลับกิจการ; ฟอร์มใช้ snapshot/version เดิมและไม่ทับ draft จาก background refetch

## ตรวจสอบแล้ว

- `npm run check`: lint, TypeScript, tests และ build ทั้ง Client/Server ผ่าน
- Prisma validate/generate ผ่าน; migration deploy จากฐานว่างใน MariaDB 10.11 ผ่านทั้ง 2 migrations
- Server tests 19 กรณีผ่าน ไม่มี skip เมื่อกำหนด `CONSTRUCTION_TEST_DATABASE_URL`
- integration suite ใช้ 2 กิจการจริงในฐานทดสอบ: cross-org/list/detail/count, legacy-role bypass, projection, date/query validation, concurrency/version, final OWNER, member/global revocation, foreign keys, audit rollback, supplier archive/audit scope
- ตรวจเงิน 0.50 × 0.07 ได้ VAT 0.04 และยอดขนาดใหญ่ที่เสี่ยงปัดเศษซ้ำ; refresh token เดิมแข่งกันได้ผู้ชนะเพียงหนึ่งคำขอ
- ตรวจเบราว์เซอร์กับ API/ฐานแยก: เลือกกิจการ สร้างโครงการ บันทึกสัญญา 100000.00 + VAT 7000.00 = 107000.00 เพิ่มผู้ขายโดยเว้นข้อมูลเสริม เพิ่มสมาชิกสมมติ มอบหมาย RECORDER และตรวจหน้าจอกว้าง 390px
- Google login จริงยังไม่ได้ทดสอบ: browser smoke ใช้ JWT ของบัญชีสมมติที่ลงนามด้วย secret เฉพาะ API ทดสอบ ไม่มี endpoint bypass เพิ่มในระบบ

## ขอบเขตที่ยังรอระยะถัดไป

ยังไม่มี BOQ/cost/payment/ไฟล์แนบ/รายงาน ดังนั้น QUOTATION → APPROVED และ IN_PROGRESS → COMPLETED ตอบ `409 PRECONDITION_FAILED` จนกว่าจะตรวจ baseline และยอดต้นทุนได้จริง ไม่สร้าง baseline สมมติให้ผ่าน

Auth ยังคง localStorage/hash transport ของฐานเดิม; HttpOnly cookie และ OAuth browser-state binding ยังรอ hardening ไม่เปลี่ยน legacy enum ในระยะนี้

ฐานข้อมูลใน `Server/.env` ยังเป็นค่าตัวอย่าง ไม่ได้ deploy migration ไปฐานใช้งานจริง และไม่ได้เพิ่มสมาชิกจริงให้ผู้ใช้โดยเดาอีเมล เริ่มตั้งค่าตาม [คู่มือ](phase-2-setup.md) ก่อน UAT

งานถัดไปที่เหมาะสมคือ BOQ draft/revision/approval และ baseline โดยใช้สิทธิ์ โครงการ decimal และ audit ที่เตรียมไว้แล้ว
