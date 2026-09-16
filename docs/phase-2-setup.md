# เริ่มใช้งานระยะองค์กรและโครงการ

## สภาพแวดล้อมใช้งาน

1. `npm run setup` และ `npm run install:all` ตาม README
2. กำหนด DATABASE_URL ให้เป็นฐาน MySQL/MariaDB ของ Construction และกำหนด Google OAuth/ALLOWED_ORIGINS/JWT_SECRET ใน Server/.env
3. รัน `npm run prisma:generate --prefix Server` และ `npm run prisma:deploy --prefix Server` (migration เริ่มต้นใช้กับฐานใหม่; ฐานที่มีตารางเดิมต้องทำ baseline ตามประวัติจริงก่อน deploy)
4. สร้างกิจการและเจ้าของ โดยแทนค่าตัวอย่างด้วยข้อมูลที่ต้องการ:

```powershell
npm run bootstrap:organization --prefix Server -- --code MY-COMPANY --name "ชื่อกิจการ" --email "owner@example.com" --display-name "ชื่อเจ้าของ"
```

คำสั่งนี้สร้าง User ที่ยังไม่มีเพื่อให้เข้าผ่าน whitelist Google login ได้ ไม่เปลี่ยน profile/status ของ User เดิม และไม่ส่ง invitation email ถ้า code มีอยู่แต่เจ้าของไม่ตรงจะปฏิเสธ

5. `npm run dev:server` และ `npm run dev:client` แล้วเข้า `http://localhost:5174` ผ่าน Google ของอีเมลเจ้าของ เลือกกิจการ → สมาชิก → เพิ่มคน → โครงการ → มอบหมายทีม

การระงับสมาชิกกระทบเฉพาะกิจการนั้น ต้องมี OWNER active อย่างน้อยหนึ่งคน ส่วนโครงการเริ่ม DRAFT และยังไม่อนุมัติโดยไม่มี BOQ

## ทดสอบแยกจากฐานใช้งาน

ใช้ Docker Compose สำหรับฐานชั่วคราว tmpfs; รหัสใน compose เป็นข้อมูลทดสอบเท่านั้น ฐานนี้หายเมื่อหยุด container

```powershell
docker compose -f compose.test.yml up -d --wait
$env:DATABASE_URL='mysql://construction_test:construction_test_only@127.0.0.1:33316/construction_test'
$env:CONSTRUCTION_TEST_DATABASE_URL=$env:DATABASE_URL
npm run prisma:generate --prefix Server
npm run prisma:deploy --prefix Server
npm run check
docker compose -f compose.test.yml down
Remove-Item Env:DATABASE_URL, Env:CONSTRUCTION_TEST_DATABASE_URL
```

integration tests ไม่ reset ฐานและสร้าง fixture ด้วยรหัสสุ่มใหม่ทุกครั้ง ต้องกำหนดชื่อฐานลงท้าย `_test` และ URL แยกชัดเจน หากไม่กำหนด CONSTRUCTION_TEST_DATABASE_URL จะ skip เฉพาะ integration suite; GitHub Actions ตั้ง service และ URL ไว้ให้ทดสอบจริง

## ข้อผิดพลาดที่คาดหมาย

| รหัส | ความหมาย |
|---|---|
| 401 | credentials หรือสถานะ User ใช้งานไม่ได้ |
| 404 | ไม่มีข้อมูล หรืออยู่นอกกิจการ/โครงการที่เข้าถึงได้ |
| 403 | เข้าถึงบริบทได้แต่ไม่มีสิทธิ์ทำ action |
| 400 | รูปแบบข้อมูล/วันที่/field ไม่ถูกต้อง |
| 409 VERSION_CONFLICT | ผู้อื่นแก้ข้อมูลแล้ว ฟอร์มยังคง draft เดิมไว้; คัดลอกข้อมูลที่ต้องเก็บ ยกเลิก แล้วเปิดข้อมูลล่าสุดเพื่อแก้ใหม่ |
| 409 LAST_OWNER | ไม่อนุญาตลดสิทธิ์เจ้าของที่ใช้งานได้คนสุดท้าย |
| 409 PRECONDITION_FAILED | ยังไม่ผ่านเงื่อนไข BOQ/ต้นทุนสำหรับอนุมัติหรือปิดโครงการ |
