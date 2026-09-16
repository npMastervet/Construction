# แบบแผนสร้างระบบ Construction Cost Manager ใหม่

วันที่: 14 กันยายน 2026  
สถานะ: เริ่มตั้งฐาน BaseReactAuth แล้ว และกำหนดข้อรายละเอียดระยะ 0 ใน `docs/phase-0/README.md`; ดูสิ่งที่พัฒนาแล้วจริงใน `docs/foundation-status.md`

## 1. เป้าหมายและหลักฐานประกอบ

สร้างเว็บแอปภาษาไทยสำหรับบริหารต้นทุนงานก่อสร้าง/รีโนเวท โดยใช้ BaseReactAuth เป็นฐานทางเทคนิค และนำโครงสร้างธุรกิจ กระบวนการ และขอบเขตฟีเจอร์จาก SYSTEM_OVERVIEW.md มาออกแบบใหม่

- แหล่งความต้องการ: `D:\Productions\Construction\SYSTEM_OVERVIEW.md`
- ฐานระบบที่ตรวจ: `D:\Productions\BaseReactAuth` รวม README, AGENTS.md, schema, auth, middleware, app routes และ config หลัก
- ยังไม่ได้ตรวจซอร์สแอปก่อสร้างเดิมหรือข้อมูลจากเบราว์เซอร์จริง ข้อสรุปเกี่ยวกับระบบเดิมจึงอ้างอิงเอกสาร ไม่ใช่ผลทดสอบซอร์สเดิม
- การสร้างใหม่หมายถึงพัฒนาโมดูลธุรกิจใหม่บนฐานเดิม ไม่สร้างระบบ Login และ UI framework ซ้ำทั้งหมด
- เอกสารนี้กำหนดค่าเริ่มต้นให้ลงมือออกแบบต่อได้ ประเด็นที่ยังไม่ทราบระบุไว้ในหัวข้อ 15

## 2. ขอบเขตและสมมติฐานเริ่มต้น

รุ่นแรกสำหรับหนึ่งกิจการ มีผู้ใช้หลายคนและหลายโครงการ ผู้ใช้เข้า Google Login ตามรายชื่อที่ผู้ดูแลเพิ่มไว้ ใช้ภาษาไทย เงินบาท และเขตเวลา Asia/Bangkok ใช้งานออนไลน์เป็นหลัก

ข้อมูลธุรกิจเป็นขององค์กร ผู้ใช้มีสมาชิกองค์กรและสิทธิ์โครงการ เริ่มด้วยองค์กรเดียว แต่ schema รองรับการแบ่งองค์กร ไม่ทำหน้าสมัครเปิดองค์กรเองหรือระบบ SaaS billing ในรุ่นแรก

### รวมในรุ่นหลัก

1. Google Login, Session, จัดการผู้ใช้และสมาชิกโครงการ
2. ข้อมูลองค์กรและการตั้งค่าที่จำเป็น
3. Projects, Suppliers, BOQ และ BOQ ฉบับอนุมัติ
4. Actual Costs พร้อมรายการย่อย VAT ไฟล์แนบ และประวัติจ่ายเงิน
5. Dashboard, Cost Control และรายงาน 6 ประเภทตามเอกสารเดิม
6. Export Excel ตามสิทธิ์และตัวกรอง
7. ประวัติการเปลี่ยนแปลงข้อมูลสำคัญ การสำรองและกู้คืน
8. ขั้นตอนนำเข้าข้อมูลเดิมแบบครั้งเดียว เมื่อพบข้อมูลที่ต้องรักษา

### งานต่อยอดแยกจากรุ่นหลัก

- AI อ่านใบเสร็จจริง
- สร้างใบเสนอราคา/สัญญา PDF จากรูปแบบเอกสารจริง
- Import Excel แบบผู้ใช้ทำเองสำหรับหลายรูปแบบไฟล์
- Offline write และการ Sync/แก้ข้อมูลชนกัน
- Email/password, สมัครสมาชิกเอง และกู้รหัสผ่าน
- จัดซื้อ/PO, คลังวัสดุ, เงินเดือน, บัญชีแยกประเภท, ภาษีหัก ณ ที่จ่าย และการรับเงินจากลูกค้า
- Workflow อนุมัติหลายระดับและระบบแจ้งเตือนหลายช่องทาง

รายงาน VAT รุ่นแรกเป็นสรุปจากข้อมูลที่บันทึกเพื่อบริหารภายใน ไม่กำหนดให้เป็นระบบยื่นภาษีหรือรับรองการใช้เครดิตภาษี

## 3. สิ่งที่ใช้ต่อ ปรับ และพัฒนาใหม่

| กลุ่ม | แนวทาง |
|---|---|
| Client/Server, core/modules/shared | คงแนวโครงสร้างของ BaseReactAuth |
| App shell, UI components, theme, mobile layout | ใช้ต่อ ปรับชื่อ เมนู เนื้อหา และ branding |
| API client, Query provider, auth store | ใช้ต่อ ปรับสัญญาข้อมูลและการจัดการ session เมื่อจำเป็น |
| Google OAuth, JWT, refresh rotation | ใช้เป็นฐาน ปรับความปลอดภัยและเพิ่มทดสอบก่อนใช้จริง |
| UserRole และ UserCompany แบบเดิม | ปรับเป็นสิทธิ์ระบบ สมาชิกองค์กร และสิทธิ์โครงการ ไม่ใช้ลำดับ HR แทนหน้าที่งานก่อสร้าง |
| Login attempt log | ใช้ต่อ เพิ่ม business audit แยกต่างหาก |
| Domain/UI ก่อสร้าง | สร้างใหม่ตามพฤติกรรมในเอกสาร ตรวจสูตรและ workflow ด้วยตัวอย่างจริง |
| Supabase Auth/RLS, local guest bypass | ไม่ใช้ในสถาปัตยกรรมใหม่ การแยกข้อมูลบังคับที่ Backend |
| localStorage business repository | เลิกใช้เป็นแหล่งข้อมูลจริง ใช้ได้เฉพาะ preferences ที่ไม่อ่อนไหว |
| รูปใบเสร็จ data URL | แยกเป็น private file storage และ metadata |

เริ่มระบบใหม่ใน `D:\Productions\Construction` โดยนำ snapshot ของ BaseReactAuth มาเป็นฐานในช่วงพัฒนา บันทึก commit ต้นทาง และไม่คัดลอก `.git`, secrets, node_modules หรือ build output ไม่แก้โปรเจกต์ต้นแบบแทนระบบใหม่

## 4. เทคโนโลยีและนโยบาย TypeScript

| ส่วน | แบบแผน |
|---|---|
| Frontend | React + Vite SPA, React Router, Tailwind/shadcn ตามฐาน |
| Server state | TanStack Query; query keys รวมขอบเขตองค์กร/โครงการ/ตัวกรอง และล้าง cache เมื่อออกจากระบบ |
| Auth/UI state | Zustand ตามฐาน; ไม่เก็บข้อมูลธุรกิจทั้งระบบซ้ำใน global store |
| Forms | React Hook Form + Zod พร้อมตรวจซ้ำที่ Backend |
| Backend | Node.js + Express แบบ modular monolith |
| Database | MySQL + Prisma ใช้ migration ที่ติดตามใน Git |
| Files | Private object storage ที่รองรับ S3 API; dev ใช้ adapter สำหรับไฟล์ภายในได้ |
| Reports | Backend รวมยอดและบังคับสิทธิ์; Client แสดงกราฟและตาราง |
| Charts/Excel | เลือกแพ็กเกจเมื่อเริ่มส่วนงาน ตรวจความเข้ากันได้และเงื่อนไขการใช้ แล้ว pin ผ่าน lockfile |

โค้ดใหม่ทั้งหมดที่เป็น application logic ใช้ TypeScript: Client `.ts/.tsx`, Server `.ts` และ API DTO ที่มี type ชัดเจน

BaseReactAuth เดิมเป็น JavaScript จึงให้ Core/UI เดิมอยู่ร่วมได้ในระยะแรก ตั้งค่า TS boundary และตรวจ type สำหรับโค้ดใหม่จริง ไม่เปลี่ยนนามสกุลไฟล์อย่างเดียว และไม่ใช้ `any` เพื่อกลบปัญหาทั่วระบบ การแปลง Core ทั้งหมดเป็น TypeScript เป็นงานภายหลังที่แยกประเมิน ไม่ใช่เกณฑ์ส่งมอบรุ่นหลัก

ช่วงปรับฐานต้องกำหนด Node runtime, module format และขั้นตอน compile/run ของ Server ให้ CommonJS เดิมทำงานกับ TypeScript ใหม่ได้ ทดสอบจาก clean install ไม่อัปเกรดทุก dependency ไปเวอร์ชันล่าสุดพร้อมกัน ใช้เวอร์ชันที่ตรวจผ่านร่วมกัน

## 5. สถาปัตยกรรมและโครงสร้างเป้าหมาย

```text
Construction/
  Client/src/
    components/ui/                 # UI kit เดิม
    core/auth/                     # login/session
    core/access/                   # permission helpers/guards
    modules/administration/        # ผู้ใช้ องค์กร และหน้าตั้งค่า
    modules/construction/
      projects/
      suppliers/
      boq/
      actual-costs/
      cost-control/
      reports/
      receipts/
    shared/                        # reusable UI/hooks/utils
    workspace/                     # dashboard composition และ navigation
    layouts/
    routes/
  Server/src/
    core/auth/
    core/identity/                 # organization/membership/access
    core/files/                    # storage interface และ metadata
    core/audit/
    core/login-attempts/
    modules/administration/
    modules/construction/
      projects/
      suppliers/
      boq/
      actual-costs/
      payments/
      reporting/
      receipts/
    config/
    middleware/
  Server/prisma/
  contracts/                       # API DTO/schema ที่แชร์ได้เท่านั้น
  docs/
```

โครงสร้างนี้เป็นเป้าหมาย จะสร้างโฟลเดอร์เมื่อมีส่วนงานจริง ไม่สร้าง abstraction ว่างจำนวนมากล่วงหน้า

กฎความรับผิดชอบ:

- `core` ไม่ import จาก `modules`; โมดูลเป็นฝ่ายใช้บริการ core
- Domain module มี pages/components/api/hooks ฝั่ง Client และ routes/controllers/services/validation ฝั่ง Server ตามความจำเป็น
- Controller แปลง HTTP; Service บังคับกฎธุรกิจ สิทธิ์ และ transaction; Prisma เข้าถึงผ่านบริการที่รู้ขอบเขตข้อมูล
- ไม่สร้าง generic CRUD repository ที่ทำให้หลีกเลี่ยงเงื่อนไข organization/project ได้ง่าย
- DTO ที่แชร์ไม่มี Prisma client, database credentials หรือโค้ด server-only
- Reports อ่านบริการ query ของโดเมน ไม่เรียก controller ของโมดูลอื่น และไม่สร้างยอดอีกชุดที่แก้เองได้
- คง API envelope `{ success, data, meta, message }`; ระบุ error code สำหรับ validation, forbidden และ conflict
- เส้นทางและเมนูมีจุดประกาศชัดเจน โหลดหน้าธุรกิจและไลบรารีหนักเมื่อเข้าหน้านั้น

## 6. ข้อมูลหลักและความสัมพันธ์

| Entity | หน้าที่และข้อกำหนดสำคัญ |
|---|---|
| User | ตัวตนและสถานะบัญชี; สิทธิ์ดูแลระบบแยกจากหน้าที่ในองค์กร |
| Organization | กิจการ เจ้าของข้อมูล; แทน UserCompany enum |
| OrganizationMember | userId + organizationId + role + status; unique ต่อคู่ |
| Project | organizationId, code, client/contact snapshot, location, dates, status, contract amounts, version |
| ProjectMember | สมาชิกองค์กรที่ได้รับสิทธิ์ในโครงการ; คนต่างองค์กรใส่ร่วมไม่ได้ |
| Supplier | organizationId, ข้อมูลผู้ขาย/ผู้รับเหมาช่วง; ใช้ร่วมกันภายในองค์กร |
| BoqVersion | projectId, revision, draft/approved/superseded, ผู้อนุมัติ/เวลา และยอด snapshot |
| BoqItem | boqVersionId, category, description, unit, quantity, estimatedUnitCost, total |
| ActualCost | เอกสารค่าใช้จ่ายต่อหนึ่งโครงการ/ผู้ขาย: วันที่ เลขเอกสาร dueDate VAT mode/rate ยอดและ posting status |
| ActualCostItem | รายการย่อย จำนวน ราคาต่อหน่วย หมวดต้นทุน; อ้าง BOQ item ได้โดยไม่บังคับ |
| Payment | การจ่ายต่อ ActualCost: วันที่ จำนวน ช่องทาง reference และผู้บันทึก; รองรับหลายครั้ง |
| FileAsset | storage key, mime, size, checksum, organization, ผู้สร้าง; private เป็นค่าเริ่มต้น |
| CostAttachment | เชื่อม ActualCost กับ FileAsset; ตรวจองค์กรและสิทธิ์ค่าใช้จ่าย |
| AuditLog | ผู้ทำ เวลา action entity และรายละเอียดการเปลี่ยนแปลงที่จำเป็น |
| ImportBatch | ระบุข้อมูลนำเข้า แหล่งเดิม mapping และผลตรวจ เพื่อกันนำเข้าซ้ำ/ย้อนรอย |
| ReceiptExtraction | ระยะ AI: file/job status, provider, confidence, draft result และการยืนยันของผู้ใช้ |

ทุกความสัมพันธ์ข้ามข้อมูลต้องอยู่ในองค์กรเดียวกัน ตรวจทั้ง service และข้อบังคับฐานข้อมูลที่ทำได้ เช่น composite unique/foreign key ไม่เชื่อ `organizationId` หรือ `projectId` ที่ Client ส่งมาโดยไม่ตรวจ

สร้าง index ตามการค้นหาจริง เช่น organization+project+date, status, category และ supplier ไม่ใช้ userId ผู้สร้างเป็นขอบเขตสิทธิ์หลัก

Project code unique ภายในองค์กร เลขเอกสารผู้ขายใช้ตรวจซ้ำร่วมกับผู้ขาย/วันที่/ยอดก่อน ไม่บังคับ unique ทั่วระบบเพราะเอกสารต่างผู้ขายอาจเลขตรงกัน

รุ่นแรกกำหนดเอกสารค่าใช้จ่ายหนึ่งใบต่อหนึ่งโครงการ และ VAT mode/rate เดียวต่อเอกสาร หากหนึ่งใบกระจายหลายโครงการหรือมี VAT หลายแบบ ต้องแยก allocation/tax group และประเมินเพิ่มก่อนลง schema

## 7. สิทธิ์และ Session

### Role เริ่มต้น

| หน้าที่ | ขอบเขตและสิทธิ์เริ่มต้น |
|---|---|
| เจ้าของ/ผู้ดูแลองค์กร | ทุกโครงการในองค์กร จัดการสมาชิก ตั้งค่า ดูการเงินทั้งหมด และอนุมัติ BOQ |
| บัญชี | ทุกโครงการในองค์กร จัดการผู้ขาย ลงรายการค่าใช้จ่าย/ชำระเงิน ดูและ Export รายงานการเงิน |
| ผู้จัดการโครงการ | โครงการที่ได้รับมอบหมาย แก้ข้อมูล/BOQ draft บันทึกและลงรายการค่าใช้จ่าย ดูงบและกำไรโครงการ; ไม่บันทึกการจ่ายเงิน |
| ผู้บันทึกหน้างาน | โครงการที่ได้รับมอบหมาย สร้าง/แก้ draft ของตนและแนบใบเสร็จ; ไม่ดูมูลค่าสัญญา กำไร หรือรายงานการเงินรวม |
| ผู้ดูข้อมูล | อ่านภาพรวมสถานะงานของโครงการที่ได้รับมอบหมาย; สิทธิ์อ่านต้นทุนเพิ่มเป็น permission แยก |

Role เป็นชุด permission เริ่มต้น เช่น `project.read`, `boq.write`, `boq.approve`, `cost.post`, `payment.write`, `financial.read`, `report.export` ไม่เทียบลำดับสูงต่ำแบบ USER < HR อย่างเดียว

สิทธิ์ระบบ SUPERADMIN ไม่ได้แปลว่าอ่านข้อมูลทุกองค์กรโดยอัตโนมัติ หากต้องมีการเข้าช่วยเหลือข้ามองค์กร ให้เป็นกลไกชัดเจนและบันทึก audit แยกในระยะที่ต้องใช้

### กติกาบังคับ

- ตรวจบัญชี active, สมาชิกองค์กร active, permission และ project scope ที่ Backend ทุกเส้นทางที่เกี่ยวข้อง
- ตรวจ list/detail/create/update/post/void/payment/report/export/file download อย่างเท่าเทียม
- ป้องกันการเดา ID ข้ามโครงการและข้ามองค์กร รวมถึง supplier links และ BOQ links
- API ส่งเฉพาะฟิลด์ที่ผู้ใช้มีสิทธิ์อ่าน ไม่ส่งกำไรหรือราคาสัญญาไปแล้วค่อยซ่อนใน UI
- เมื่อปิดบัญชีหรือถอนสมาชิก คำขอธุรกิจถัดไปถูกปฏิเสธตามสถานะล่าสุด; การ Logout ต้องกำหนดนโยบาย access-token revocation และทดสอบให้ตรงคำสัญญาของระบบ
- เพิ่ม bootstrap ผู้ดูแลคนแรกแบบควบคุมได้ แล้วให้ผู้ดูแลเพิ่มอีเมล/สมาชิกผ่านหน้าจอ ไม่มี local guest bypass
- ใช้ refresh rotation แบบ transaction เดิมเป็นฐาน ปรับการเก็บ refresh token เป็น HttpOnly/Secure cookie พร้อม SameSite และ CSRF ตามรูปแบบ domain ที่เลือก; access token ระยะสั้นเก็บใน memory
- OAuth callback ไม่ส่ง refresh token ใน URL fragment; ตรวจ state ที่ผูกกับเบราว์เซอร์ผู้เริ่ม flow และใช้ครั้งเดียว
- ทดสอบ refresh พร้อมกัน รวมหลายแท็บ และแยก 429/5xx/network error ออกจากกรณี credential ใช้ไม่ได้

อ้างอิงแนวทาง: [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) และ [OWASP HTML5 Storage](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)

## 8. กระบวนการธุรกิจ

### 8.1 โครงการและ BOQ

1. สร้าง Project draft ใส่ลูกค้า สถานที่ สมาชิก และข้อมูลสัญญาเบื้องต้น
2. สร้าง BOQ draft จัดหมวด/ลำดับรายการ คำนวณต้นทุนและราคาขายแนะนำ
3. สถานะโครงการ quotation หมายถึงอยู่ระหว่างเสนอราคา ไม่ได้หมายความว่าระบบสร้างเอกสารใบเสนอราคาแล้ว
4. ผู้มีสิทธิ์อนุมัติ BOQ เก็บ snapshot เป็น baseline สำหรับเปรียบเทียบ; แยกสถานะ BOQ จากสถานะสัญญาโครงการ
5. โครงการ approved → in_progress → completed; cancelled มีเหตุผลและเก็บประวัติ
6. แก้ BOQ ที่อนุมัติแล้วโดยสร้าง revision ใหม่ ไม่เขียนทับ baseline เดิม เลือก baseline ที่ใช้ดูรายงานได้
7. การเปลี่ยนสถานะเป็น explicit action ที่ Server ตรวจ transition; การเปิดโครงการ completed กลับมาแก้ต้องมีสิทธิ์และเหตุผล

### 8.2 ค่าใช้จ่ายและการจ่ายเงิน

1. เลือกโครงการ ผู้ขาย วันที่ เลขเอกสาร รายการย่อย VAT และแนบใบเสร็จ
2. บันทึก draft เพื่อแก้ไขและตรวจความครบถ้วน
3. ผู้มีสิทธิ์ post ยืนยันเอกสาร; Server คำนวณยอด ตรวจสิทธิ์และข้อมูลอ้างอิงใน transaction
4. Dashboard/Cost Control/Reports นับเฉพาะ posted และไม่ void; draft แสดงแยกชัดเจน
5. บัญชีบันทึก Payment ได้หลายครั้ง ยอดค้างคำนวณจากยอดเอกสารและ payment ที่มีผล
6. แก้ posted cost ด้วย void และสร้างฉบับแทนที่พร้อมเหตุผล ไม่แก้ยอดเก่าเงียบ ๆ; ถ้ามี payment ต้อง reverse payment ตามลำดับก่อน void
7. Payment ที่บันทึกแล้วใช้การ reverse พร้อมเหตุผล; ไม่ลบประวัติทิ้ง และป้องกัน reverse ซ้ำ
8. มี duplicate warning, idempotency สำหรับการ post/จ่ายเงิน และ version check กันเขียนทับจากสองคน

แยก payment status (unpaid/partially_paid/paid) ออกจาก overdue flag ซึ่งเกิดเมื่อยอดค้าง > 0 และเกิน dueDate ถ้าไม่มี dueDate ไม่ตัดสิน overdue เอง รุ่นแรกไม่รองรับจ่ายเกินยอด มัดจำ หรือ refund workflow เต็มรูปแบบ

### 8.3 ไฟล์และ AI

- ไฟล์ private; ตรวจชนิดจริง ขนาด และสิทธิ์ทั้งอัปโหลด/ดาวน์โหลด; ใช้ storage key แทน URL สาธารณะถาวร
- การ upload กับการบันทึก DB อาจสำเร็จไม่พร้อมกัน จึงมี pending asset และงานล้าง orphan ที่ตรวจว่าไม่ถูกอ้างอิง
- จำกัดข้อมูลอ่อนไหวใน log; audit ไม่บันทึก token หรือไฟล์ทั้งก้อน
- ระยะ AI: upload → backend job → ผลอ่านเป็น draft → ผู้ใช้ตรวจและแก้ → ยืนยันเป็น ActualCost
- กำหนด timeout/retry/status และงบการเรียกบริการ AI; mock ใช้เฉพาะ dev/test ไม่แสดงว่าอ่านสำเร็จจริง

## 9. มาตรฐานตัวเลขและรายงาน

### คำจำกัดความ

- BOQ ในรุ่นแรกคือประมาณต้นทุน; ราคาขายแนะนำเป็นค่าช่วยตัดสินใจแยกจากมูลค่าสัญญาที่ตกลงจริง
- มูลค่าสัญญาเก็บ net/VAT/gross ชัดเจน การเปลี่ยนค่ามี audit
- ต้นทุนจริงคือยอด net ของ posted cost ตามนโยบายการคุมต้นทุนที่กำหนด ไม่ใช่ยอดเงินที่จ่ายแล้ว
- ค่า non-VAT ทั้งจำนวนเป็นต้นทุน; VAT แยกในรายงาน สำหรับกรณี VAT ต้องนับเป็นต้นทุนเพิ่มเติมให้ตกลงก่อนพัฒนาสูตร
- งบคงเหลือ = ต้นทุน BOQ baseline − ต้นทุนจริง
- ส่วนต่างสัญญากับต้นทุนปัจจุบัน = มูลค่าสัญญา net − ต้นทุนจริง; ระหว่างงานไม่เรียกว่าเงินสดคงเหลือหรือกำไรสุดท้าย
- กำไรประมาณการตาม BOQ = มูลค่าสัญญา net − ต้นทุน BOQ
- Markup และ margin แสดงแยก: ราคาขายแบบ markup = ต้นทุน × (1 + อัตรา); แบบ margin = ต้นทุน ÷ (1 − อัตรา) โดย margin ต้อง < 100%
- ถ้าไม่มี baseline แสดงว่าไม่มีงบอ้างอิง ไม่ใช้ 0 เป็นงบจนแจ้งเกินงบผิด; ส่วนหารเป็น 0 แสดงไม่มีข้อมูลที่คำนวณได้

### การเก็บและคำนวณ

- จำนวนเงินที่สรุปใช้ Decimal(18,2); quantity และ unit price ใช้ scale สูงกว่าตามข้อมูลตัวอย่าง เช่น Decimal(18,4)
- คำนวณด้วย decimal arithmetic ฝั่ง Server และส่งจำนวนเงินผ่าน API เป็น decimal string; ห้ามเอาตัวเลขที่จัดรูปแบบแล้วมาคำนวณต่อ
- กำหนดปัดเศษ half-up 2 ตำแหน่งที่ยอดรายการก่อนรวม; VAT คำนวณที่ระดับเอกสาร แล้วกระจายเศษตามกติกาคงที่เมื่อทำรายงานหมวด
- vat_excluded: net = ยอดรายการรวม, VAT = round(net × rate), gross = net + VAT
- vat_included: gross = ยอดรายการรวม, net = round(gross ÷ (1 + rate)), VAT = gross − net
- non_vat: net = gross, VAT = 0
- เก็บ vatRate ต่อเอกสาร การเปลี่ยนค่า default ไม่เปลี่ยนเอกสารเก่า อัตราเป็นข้อมูลที่ตั้งค่าได้ ไม่ hardcode เป็นข้อสรุปทางกฎหมาย
- ใช้ date-only สำหรับวันที่เอกสาร/ครบกำหนด และ UTC timestamp สำหรับเหตุการณ์; ตัดรอบรายงานตาม Asia/Bangkok
- ตรวจค่าติดลบ จำนวนศูนย์ ยอดเกินขอบเขต และความเท่ากันของยอดรวมที่ Backend

### รายงานที่ต้องรักษา

1. ประมาณการเทียบจริง: ตามโครงการ หมวด และ baseline
2. ต้นทุนรายเดือน: ใช้วันที่เอกสารของ posted cost
3. กำไร: แยกประมาณการตาม BOQ กับส่วนต่างสัญญา/ต้นทุนถึงปัจจุบัน
4. ต้นทุนต่อโครงการ
5. ยอดซื้อต่อผู้ขาย: สรุปเฉพาะโครงการที่ผู้ขอมีสิทธิ์ ไม่รวมยอดจากโครงการที่มองไม่เห็น
6. VAT: net/VAT/gross แยกโหมดและตัวกรอง

ทุกหน้าและ Export ใช้ query/calculation definition ร่วมกัน ระบุช่วงวันที่ baseline และเวลาสร้างรายงาน; ไม่รวมยอดเฉพาะหน้าปัจจุบันของตารางที่แบ่งหน้า และป้องกันค่าข้อความใน Excel ถูกตีความเป็นสูตร

## 10. หน้าจอและการใช้งาน

- เมนูหลัก: ภาพรวม, โครงการ, ค่าใช้จ่าย, ผู้ขาย, ควบคุมต้นทุน, รายงาน, จัดการระบบ ตามสิทธิ์
- Project Detail: ภาพรวม / BOQ / ค่าใช้จ่าย / การจ่ายเงิน / รายงาน / สมาชิกและประวัติ ตามสิทธิ์
- BOQ เป็นงานภายในโครงการ; หากมีหน้ารวม BOQ ต้องบังคับเลือกโครงการให้ชัดเจน
- หน้าใช้งานมือถือเน้นเลือกโครงการ เพิ่มค่าใช้จ่าย แนบรูป และดูสถานะ; ตาราง BOQ มีการเลื่อน/แสดงคอลัมน์ที่เหมาะสม
- ใช้ UI kit, PageContainer, header, loading/empty/error pattern ตามฐาน; navigation มีแหล่งประกาศเดียว
- รูปแบบวันที่ไทยเพื่อแสดงผลแยกจากค่าที่ส่ง API; ข้อความไทยเก็บเป็นระเบียบ ไม่ทำหลายภาษารุ่นแรก
- แยก draft form จาก query data เพื่อไม่ให้ refetch เขียนทับสิ่งที่กำลังกรอก
- มีเตือนเมื่อออกจากฟอร์มที่ยังไม่บันทึก และกำหนด PWA update ให้ไม่ทำฟอร์มสูญหาย
- เปิดแอปแบบ PWA ได้ตามฐาน แต่ offline แสดงสถานะชัดเจน ไม่แจ้งว่าบันทึกสำเร็จถ้ายังไม่ถึง Server

## 11. การย้ายข้อมูล

1. สำรวจเบราว์เซอร์/เครื่องที่เคยใช้ระบบเดิม และขอไฟล์ export จากแหล่งนั้น ไม่สรุปว่าไม่มีข้อมูลจริงเพราะไม่มี production DB
2. สำรอง JSON เดิมและไฟล์แนบก่อนแปลง เก็บต้นฉบับอ่านอย่างเดียว
3. กำหนดองค์กรปลายทาง เจ้าของการนำเข้า และ mapping ID ของ Project/Supplier/BOQ/ActualCost
4. ตรวจ orphan relations หมวด สถานะ วันเวลา VAT ยอดรวม และรายการซ้ำ
5. เปลี่ยน data URL เป็น FileAsset และเชื่อมรายการค่าใช้จ่าย
6. ข้อมูลเดิมที่มีเพียงสถานะ partially_paid แต่ไม่มียอดชำระจริงต้องเข้าคิวตรวจ ไม่สร้าง Payment สมมติ
7. Dry run รายงานจำนวนแถว ยอดเงิน ไฟล์ และรายการที่ไม่ผ่านก่อน import จริง
8. ทดสอบ import ซ้ำไม่สร้างซ้ำ เก็บ ImportBatch และรายงาน reconciliation ต่อโครงการ
9. ช่วงย้ายจริงกำหนดเวลาหยุดแก้ข้อมูลเก่า แล้วตรวจยอดหลังย้าย; เก็บสำรองเดิมสำหรับย้อนกลับ

Excel/Word/PDF ที่ทำมือใช้เป็นตัวอย่าง requirements ก่อน การอ่านและนำเข้าทุกไฟล์ไม่ถือว่ารวมอัตโนมัติในงานย้ายครั้งเดียว

## 12. การทดสอบและการนำขึ้นใช้งาน

### ชุดตรวจที่จำเป็น

- Clean install, typecheck โค้ด TS ใหม่, lint, client build, server build/start และ Prisma validate
- Auth integration: login, refresh/rotation, logout, inactive user, state validation, concurrent/multi-tab refresh
- Authorization integration: ข้ามองค์กร/โครงการ เปลี่ยน ID, ถอนสมาชิก, ซ่อนฟิลด์การเงิน และ file/report/export scope
- Calculation unit tests: VAT ทั้ง 3 แบบ เศษทศนิยม margin/markup, ไม่มี baseline, จ่ายบางส่วน/ครบ/เกินกำหนด และวันตัดรอบ
- Transaction integration กับ MySQL ทดสอบจริง: post ซ้ำ, concurrent payment, rollback, reverse และแก้ version เก่า
- E2E เส้นทางสร้างโครงการ → BOQ baseline → ค่าใช้จ่าย → จ่ายเงิน → ดูรายงาน/Export
- ไฟล์: upload ไม่สำเร็จ download ไม่มีสิทธิ์ และ orphan cleanup
- Reconciliation: ตัวอย่างงานจริงอย่างน้อย 2–3 โครงการ ตรวจทุกหน้ากับชุดคำนวณอ้างอิงที่ไม่ใช้ implementation เดียวกัน
- เป้าหมาย performance ชั่วคราว: ข้อมูลทดสอบ 100 โครงการ/10,000 รายการค่าใช้จ่าย; API รายการและ summary ที่ใช้บ่อย p95 ไม่เกิน 2 วินาทีใน staging โดยไม่รวม AI/upload และระบุเครื่องทดสอบ

### Deployment

- Dev / Staging / Production แยก DB, credentials และ file bucket
- โครง deployment: frontend static + Express service + MySQL + private object storage; ยังไม่เลือกผู้ให้บริการ
- เริ่มออกแบบให้เว็บกับ `/api` อยู่ origin เดียวผ่าน reverse proxy เพื่อลดความซับซ้อน cookie/CORS
- CI ทำ build/typecheck/lint/tests และตรวจ migration; ใช้ migration deploy ที่ production ไม่ใช้ schema reset/db push แทน migration
- มี health/readiness, request ID และ error logging ที่ไม่เปิด secrets
- สำรองทั้ง DB และไฟล์; ตั้งเป้าชั่วคราว RPO 24 ชั่วโมง/RTO 4 ชั่วโมง และทดสอบ restore ในสภาพแวดล้อมแยกก่อนเปิดจริง
- การ rollback แอปต้องตรวจความเข้ากันได้ของ schema; migration ใช้แนวขยายก่อนแล้วค่อยเลิกใช้ ไม่สมมติว่า downgrade DB ได้อัตโนมัติ
- ตรวจการตั้งค่า process lifecycle, reverse proxy, HTTPS และการปกป้องข้อมูลก่อน production

## 13. ลำดับการพัฒนาและเกณฑ์ผ่าน

| ระยะ | งานและผลส่งมอบ | เกณฑ์ผ่าน | วันทำงาน/นักพัฒนา 1 คน |
|---|---|---|---:|
| 0 — ยืนยันแบบจำลอง | ตัวอย่างงานจริง, ERD, permission matrix, API contract, สูตรและขอบเขตข้อมูล | ตัวอย่างยอดและ workflow อธิบายได้ครบ ไม่มีข้อขัดแย้งที่ขวาง schema | 4–6 |
| 1 — ปรับฐาน | นำ BaseReactAuth เข้ามา, TS สำหรับโค้ดใหม่, branding, auth hardening, CI และ environments | clean install/build/login/session ผ่าน รวมกรณีปิดบัญชี | 6–10 |
| 2 — ข้อมูลและสิทธิ์ | Organization/Member, Users, Projects, Suppliers, project access และ audit | สร้าง/มอบหมายโครงการได้ และ integration test ข้ามขอบเขตผ่าน | 6–9 |
| 3 — BOQ | editor, categories, calculation, margin/markup, approve/revision/baseline | baseline ไม่ถูกเขียนทับ และสูตรตัวอย่างผ่าน | 5–8 |
| 4 — ต้นทุนจริง | cost/items, VAT, attachments, post/void, payment/reversal, concurrent protection | บันทึกถึงชำระครบได้ ยอดตรวจย้อนกลับได้ ไม่มีรายการซ้ำจาก retry | 8–12 |
| 5 — สรุปและรายงาน | Dashboard, Cost Control, รายงาน 6 แบบและ Excel export | ตัวกรอง สิทธิ์ และยอดทุกหน้าตรงกับข้อมูลอ้างอิง | 6–9 |
| 6 — ทดลองใช้และเปิดจริง | import สำรวจแล้วถ้ามี, mobile QA, E2E, performance, restore drill, staging/UAT และ production setup | เกณฑ์หัวข้อ 14 ผ่านและข้อมูลทดลองใช้กระทบยอดได้ | 5–8 |
| รวมรุ่นหลัก | สร้างโมดูลธุรกิจใหม่บน BaseReactAuth | ไม่รวมระยะต่อยอด | 40–62 |

เป็น effort โดยประมาณ 8–13 สัปดาห์ทำงานของนักพัฒนาเต็มเวลา 1 คน ไม่ใช่กำหนดส่งยืนยัน และไม่รวมเวลารอข้อมูล/UAT/บัญชีบริการ สมมติว่างาน import ไม่ซับซ้อนและไม่มีการเปลี่ยน scope สำคัญ หากยังไม่เห็นตัวอย่างข้อมูล ให้เผื่อความไม่แน่นอนเพิ่ม 20–30% ในการวางกำลังคน

กรอบนี้มากกว่าประเมินก่อนหน้า 30–48 วัน เพราะกำหนดสร้างโมดูลใหม่ พร้อม BOQ revision, cost posting, payment history, project permissions, auth hardening และเกณฑ์ทดสอบที่ชัดขึ้น

จุดทดลองใช้แรกคือหลังระยะ 4: หนึ่งโครงการทำได้ตั้งแต่สร้างงบจนบันทึกค่าใช้จ่าย/ชำระเงิน และแสดงยอดเปรียบเทียบพื้นฐานบนหน้าโครงการ แล้วจึงขยาย dashboard/รายงานรวมในระยะ 5

ระยะต่อยอด AI ประเมินแยกประมาณ 5–10 วันหลังเลือก provider และมีชุดใบเสร็จทดสอบ ส่วนเอกสารใบเสนอราคา/สัญญาและ offline ต้องเห็น workflow/รูปแบบจริงก่อนกำหนด effort

## 14. เกณฑ์รับระบบรุ่นหลัก

1. ผู้ใช้หลายคนทำงานโครงการเดียวกันได้ตามหน้าที่ และเข้าถึงข้อมูลนอกสิทธิ์ไม่ได้จากทั้ง UI และ API
2. ปิดบัญชี/ถอนสิทธิ์แล้วคำขอธุรกิจถัดไปถูกปฏิเสธตามนโยบาย
3. สร้างโครงการ BOQ baseline ค่าใช้จ่าย ไฟล์แนบ และการจ่ายเงินได้ครบ
4. ยอด net/VAT/gross, ยอดชำระ/ค้าง และ baseline ตรงกันระหว่างหน้าจอ รายงาน และ Export
5. ระหว่างงานแสดงความหมายตัวเลขกำไร/ส่วนต่างชัดเจน ไม่ปะปนต้นทุนกับเงินสดจ่าย
6. แก้ posted record มีประวัติ; retry/concurrent request ไม่ทำให้จ่ายซ้ำหรือเขียนทับโดยไม่เตือน
7. ข้อมูลอยู่ Server/DB/Storage จริง เปลี่ยนเครื่องยังเปิดข้อมูลตามสิทธิ์ได้
8. ไม่แสดงข้อมูล mock เป็นข้อมูลจริง และไม่ bypass auth เมื่อ config ไม่ครบ
9. ใช้ฟังก์ชันหลักบนมือถือได้โดยไม่สูญเสียฟอร์มจาก navigation/update
10. Typecheck/build/tests ที่กำหนดผ่าน; backup restore ผ่านจริงในระบบแยก
11. มีคู่มือเริ่มใช้งาน จัดการผู้ใช้ deploy สำรอง/กู้คืน และข้อจำกัดที่ยังไม่ทำ

## 15. ประเด็นที่ต้องยืนยันในระยะ 0

| ประเด็น | ค่าเริ่มต้นของแผน | ถ้าต่างจากนี้ |
|---|---|---|
| ผู้ใช้งาน/กิจการ | หนึ่งองค์กร หลายคน สิทธิ์ตามโครงการ | หลายองค์กรจริงต้องเพิ่ม UX เลือกองค์กรและทดสอบ isolation เพิ่ม |
| Login | Google แบบเพิ่มรายชื่อโดยผู้ดูแล | Email/password เพิ่ม flow และการดูแลรหัสผ่าน |
| TypeScript | โค้ดใหม่ทั้งหมด; core เดิมอยู่ร่วมได้ | หากต้อง TS ทั้ง repo ต้องเพิ่มงานแปลงและ regression |
| BOQ | ประมาณต้นทุนแยกจากราคาขาย | ถ้า BOQ เดิมเป็นราคาขาย ต้อง mapping และแยก model/field ก่อน |
| ภาษี/เงิน | THB, VAT rate ต่อเอกสาร, ไม่รวม WHT/มัดจำ/retention | เพิ่ม model และสูตรตาม workflow จริง |
| เอกสารค่าใช้จ่าย | หนึ่งโครงการและ VAT กลุ่มเดียวต่อเอกสาร | หลายโครงการ/ภาษีหลายกลุ่มต้องเพิ่ม allocation |
| ยอดจ่ายเดิม | มีข้อมูลจำนวนเงินตรวจสอบได้ | สถานะอย่างเดียวต้องตรวจ/เติมยอด ไม่เดาขึ้นเอง |
| อินเทอร์เน็ตหน้างาน | Online; ไม่รับ offline writes | Offline เป็นอีกส่วนงาน ต้องออกแบบ sync/conflict |
| ข้อมูลเดิม | ต้องสำรวจก่อน | ปริมาณ/คุณภาพ/จำนวนไฟล์กระทบ effort migration |
| รายงาน/กำไร | เพื่อบริหารต้นทุนตามนิยามในแผน | บัญชีเต็มรูปแบบ/รับชำระลูกค้าขยายขอบเขต |
| Hosting และ backup | ยังไม่เลือก provider; เป้าหมาย RPO/RTO ชั่วคราว | ตรวจงบ โครงสร้างบริการ และขนาดข้อมูลก่อนจัดซื้อ |

## 16. งานถัดไปเมื่อเริ่มดำเนินการ

เริ่มระยะ 0 ด้วย ERD, permission matrix ราย action, API contract และชุดตัวอย่างคำนวณจากงานจริง จากนั้นนำ BaseReactAuth เข้าสู่โปรเจกต์ Construction และทำระบบหนึ่งโครงการให้ครบเส้นทางก่อนขยายรายงานและ AI

ความคืบหน้า: ย้ายโค้ดพื้นฐานแล้วและจัดทำข้อกำหนดระยะ 0 แล้ว การสร้างโมดูลธุรกิจ ฐานข้อมูลใช้งานจริง และ deployment ยังต้องดำเนินการตามสถานะที่บันทึกใน `docs/foundation-status.md`
