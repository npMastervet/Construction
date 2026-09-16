# สถานะพื้นฐานระบบ

อัปเดต: 14 กันยายน 2026

## สิ่งที่มีแล้ว

- นำ BaseReactAuth commit `366e065904b531528cd6ab0a44bb1fa237868e69` มาเป็นฐานในโปรเจกต์ Construction
- React/Vite, Express/Prisma, app shell, Google-login routes และ refresh-token rotation เดิม
- TypeScript tooling สำหรับโค้ดใหม่ทั้ง Client และ Server โดย JavaScript เดิมยังอยู่ร่วมได้
- การตั้งค่า Construction แยกชื่อ โลโก้ และ local development ports: Client `5174`, Server `5001`
- Runtime environment validation, `/health`, `/ready`, server test suite และ GitHub Actions workflow
- Prisma migration เริ่มต้นเฉพาะ auth models: User, RefreshToken และ LoginAttempt
- ระยะองค์กร/โครงการ: Organization, OrganizationMember, Project, ProjectMember, Supplier, AuditLog พร้อม additive migration และหน้าจอ/API ดู [สถานะระยะ 2](phase-2-status.md)
- ตรวจสิทธิ์จากสมาชิกที่ active, จำกัดขอบเขต query/DTO, version conflict และ audit ใน transaction; ทดสอบกับ MariaDB แยกจริง

## ข้อกำหนดที่จัดทำแล้ว

- [ชุดระยะ 0](phase-0/README.md): ERD/data dictionary, permission matrix, state transitions และ API contract สำหรับองค์กร/โครงการ/ผู้ขาย
- กำหนดค่าเริ่มต้นตามที่ผู้ใช้มอบหมาย พร้อม reference สองโครงการสมมติและตัวตรวจเลขแยกจาก application
- เริ่มพัฒนาระยะข้อมูลและสิทธิ์ได้จากข้อกำหนดชุดนี้; การเทียบกับเอกสารงานจริงยังเป็นเงื่อนไขก่อน UAT
- ระยะปรับฐานใน blueprint ยังมีงาน Auth hardening/การเชื่อม Google และ DB จริงค้างอยู่ ไม่ถือว่าเสร็จทั้งระยะ

## สิ่งที่ยังไม่มี

- BOQ, ค่าใช้จ่ายจริงและ VAT ระดับรายการค่าใช้จ่าย, ใบเสร็จ, การจ่ายเงิน, dashboard และรายงาน
- ฐานข้อมูลใช้งานจริง, Google OAuth credentials, production hosting และการทดสอบ login จริง (ฐาน Docker ที่ใช้ตรวจงานเป็นฐานทดสอบชั่วคราว)
- การย้าย refresh token ไป HttpOnly cookie และ OAuth state binding ตามแบบแผน

ยังต้องตั้งค่าสภาพแวดล้อมจริงและทำ UAT ก่อนเปิดใช้งานจริง; UserRole/UserCompany เดิมไม่ให้สิทธิ์ข้ามองค์กรโดยปริยาย
