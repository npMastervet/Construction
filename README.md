# Construction Cost Manager

ฐานระบบบริหารต้นทุนงานก่อสร้าง สร้างจาก BaseReactAuth พร้อม React/Vite, Express/Prisma และ TypeScript สำหรับโค้ดใหม่

ขณะนี้มี Login, Session และโครงหน้าจอ โมดูลโครงการ/BOQ/ค่าใช้จ่ายยังไม่เปิดใช้งาน ดู [สถานะฐานระบบ](docs/foundation-status.md) และ [แบบแผนระบบ](SYSTEM_REBUILD_BLUEPRINT.md)

## เริ่มต้นบนเครื่องพัฒนา

ใช้ Node.js 22.12 ขึ้นไปในสาย 22 (ตรวจด้วย 22.23.1) และ npm 10 ขึ้นไป

1. รัน `npm run setup` ที่ root เพื่อสร้าง Client/.env และ Server/.env พร้อม JWT secret แบบสุ่ม คำสั่งไม่ทับไฟล์เดิมและไม่แสดง secret
2. รัน `npm run install:all` เพื่อติดตั้งทั้งสอง package ตาม lockfile
3. ตั้ง DATABASE_URL ใน Server/.env ให้ชี้ฐาน MySQL สำหรับ Construction โดยเฉพาะ
4. รัน `npm run prisma:generate --prefix Server` และ `npm run prisma:deploy --prefix Server` เพื่อสร้าง client และใช้ migration กับฐานที่ตั้งค่าไว้
5. ตั้ง GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET และ authorized callback เป็น http://localhost:5001/api/auth/google/callback
6. เพิ่มผู้ใช้คนแรกในฐานข้อมูลตามรายละเอียดด้านล่าง
7. เปิดสอง terminal: `npm run dev:server` และ `npm run dev:client`

Frontend: http://localhost:5174 — ใช้ /api ผ่าน Vite proxy ไป localhost:5001

API: /health ตรวจ process; /ready ตรวจ DB reachability (ไม่รับรองว่า migration/Google พร้อม)

หากยังไม่มี MySQL/Google credentials จะดูหน้า Login และตรวจ build/test ได้ แต่ยังยืนยัน Login จริงไม่ได้ Google route ตอบ 503 เมื่อไม่ได้ตั้งค่า credentials ไม่มีโหมดข้าม Login

## ผู้ดูแลคนแรก (ชั่วคราวก่อนมีหน้าจัดการผู้ใช้)

เมื่อใช้ migration แล้ว เปิด `npm run prisma:studio --prefix Server` และสร้าง User โดยใส่อีเมล Google ตัวพิมพ์เล็ก, displayName, role=SUPERADMIN, status=ACTIVE, authProvider=GOOGLE และ company ตาม enum ของฐานเดิม ค่า company ยังเป็น placeholder ไม่มีผลแยกข้อมูลตามองค์กร

อย่าใส่ข้อมูลโครงการจริงจนกว่าจะมีโมเดลองค์กรและสิทธิ์ตามแบบแผน

## คำสั่งตรวจและ build

- `npm run check`: lint, typecheck, backend tests และ build ทั้งสองฝั่ง
- `npm run prisma:validate --prefix Server`: ตรวจ schema (ต้องมี DATABASE_URL)
- `npm run build` แล้ว `npm start --prefix Server`: รัน backend ที่ compile แล้ว
- `npm run preview --prefix Client`: ดู static build/PWA; หากจะใช้ API ผ่าน preview ให้ตั้ง reverse proxy หรือ VITE_API_URL เป็น backend URL และ build ใหม่

Client/src มี TS/TSX ใหม่อยู่ร่วมกับ JS/JSX เดิม ส่วน Server/src compile ทั้ง TS และ CommonJS เดิมไป dist ด้วยโครง path เดิม Strict typecheck ใช้กับ TypeScript ใหม่; ไม่ได้อ้างว่า Core JavaScript ทั้งหมดถูกตรวจ type แล้ว

## โครงสร้าง

- Client/src/core: auth และ session
- Client/src/workspace: หน้าหลักและ shell
- Client/src/shared: UI/hooks/config ที่ใช้ร่วมกัน
- Client/src/modules: พื้นที่โมดูลธุรกิจที่จะเพิ่ม
- Server/src/index.ts: ตรวจ environment และเริ่ม server
- Server/src/app.ts: ประกอบ Express app, core routes, health/readiness และ errors
- Server/src/modules/index.ts: ลงทะเบียน business routers
- Server/prisma: schema และ migration ที่เก็บใน Git

อ่าน [การเพิ่มโมดูล](docs/adding-a-module.md) ก่อนเริ่มงานธุรกิจ

## ขอบเขตปัจจุบัน

Session ยังใช้ localStorage และ OAuth hash ตาม BaseReactAuth โดยเปลี่ยนชื่อ storage key สำหรับ Construction แล้ว การย้าย refresh token ไป HttpOnly cookie, OAuth state binding, สิทธิ์องค์กร/โครงการ และ full auth integration เป็นงานถัดไปก่อนเปิด production

ยังไม่ได้เลือก hosting, สร้าง MySQL จริง, ผูก Google account หรือ deploy ระบบ CI เป็น workflow ใน repository ที่จะทำงานเมื่อ push ไป GitHub
