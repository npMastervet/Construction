# สรุปโครงสร้างและการทำงานของระบบปัจจุบัน — Construction Cost Manager

> เอกสารนี้สรุปสถานะโค้ดจริงในโฟลเดอร์ `construction-cost-manager/` (ตรวจสอบจากโค้ดวันที่ 2026-09-12) เพื่อใช้ประกอบการประเมินย้ายไป tech stack ใหม่

## 1. ภาพรวม

ระบบคือเว็บแอป **SPA (Single Page Application)** สำหรับบริหารต้นทุนงานรับเหมาก่อสร้าง/รีโนเวท ใช้ภาษาไทยทั้งระบบ (ไม่มี i18n หลายภาษา) ครอบคลุม: จัดการโปรเจกต์ก่อสร้าง, BOQ (Bill of Quantities/ใบประมาณราคา), บันทึกค่าใช้จ่ายจริง, ผู้ขาย/ซัพพลายเออร์, คุมงบประมาณ, และรายงาน

โปรเจกต์นี้เป็นโค้ดที่สร้างด้วย AI (มีคอมเมนต์อธิบายเจตนาการออกแบบไว้ชัดเจนในหลายไฟล์ เช่น "Phase 1-9") มี **commit เดียว** ใน git ("Initial commit") — ยังไม่มีประวัติการพัฒนาต่อเนื่อง ยังไม่มีการตั้งค่า test หรือ CI/CD ใดๆ

## 2. Tech Stack ปัจจุบัน

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | React 18.3 + TypeScript 5.5 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | react-router-dom v6 (client-side only, `BrowserRouter`) |
| State management | React Context API (ไม่มี Redux/Zustand/Query library) |
| Charts | Recharts |
| Icons | lucide-react |
| Excel import/export | `xlsx` (SheetJS) |
| Backend/DB (ตั้งใจไว้) | Supabase (Postgres + Auth + RLS) |
| Backend/DB (ที่ใช้งานจริงตอนนี้) | **localStorage ของเบราว์เซอร์** (ค่า default) |
| Deployment | Vercel (มี `.vercel/project.json` ผูกโปรเจกต์ไว้แล้ว, SPA rewrite ใน `vercel.json`) |
| Test framework | **ไม่มี** — ไม่พบไฟล์ `*.test.*` / `*.spec.*` |
| CI/CD | **ไม่มี** — ไม่พบ `.github/workflows` |

## 3. โครงสร้างโฟลเดอร์หลัก

```
งานช่วยพ่อรับเหมา/                      ← root (ไม่ใช่ git repo)
├── construction-cost-manager/         ← แอปหลัก (git repo แยกต่างหาก, มี 1 commit)
│   ├── src/
│   │   ├── pages/          # 12 หน้า: Dashboard, Projects, ProjectDetail, BOQ,
│   │   │                   #   ActualCost, Suppliers, CostControl, Reports,
│   │   │                   #   Settings, Login, Register, ForgotPassword
│   │   ├── components/     # แบ่งตามโดเมน: actualcost/, auth/, boq/, common/,
│   │   │                   #   costcontrol/, dashboard/(+charts/), projects/,
│   │   │                   #   receipt/, reports/, suppliers/
│   │   ├── layouts/        # MainLayout, Sidebar, Header, BottomNav, navigation.ts
│   │   ├── services/       # ชั้นเข้าถึงข้อมูล (ดูหัวข้อ 4)
│   │   │   └── supabase/   # mapper + client + repository เฉพาะ Supabase
│   │   ├── store/          # AuthContext, AppDataContext (React Context)
│   │   ├── hooks/          # custom hooks สำหรับ filter/pagination/summary
│   │   ├── utils/          # calculation, form mapping, export, format ฯลฯ
│   │   ├── types/          # TypeScript domain model
│   │   ├── data/mockData.ts
│   │   └── i18n/th.ts      # ข้อความภาษาไทยทั้งหมด (hardcoded, ไม่มีสลับภาษา)
│   ├── supabase/migrations/0001_init.sql   # schema เดียว ยังไม่ deploy จริง
│   ├── .env.example        # ตัวแปร VITE_SUPABASE_URL/ANON_KEY/DATA_PROVIDER
│   └── vercel.json
├── mysql-server/            # docker-compose แยกต่างหาก (MySQL 8.4 + Adminer)
│                             #   ระบุว่า "for local development of upcoming
│                             #   API projects" — ยังไม่เชื่อมกับแอปหลัก
├── .claude/launch.json      # config รัน dev server (npm run dev, port 5173)
└── (ไฟล์เอกสารธุรกิจจริง)   # ใบเสนอราคา/สัญญา/BOQ ของงานจริง (ดูหัวข้อ 9)
```

## 4. สถาปัตยกรรมชั้นข้อมูล (จุดที่สำคัญที่สุดสำหรับการย้าย stack)

ระบบออกแบบ **data layer แบบสลับ backend ได้** โดยไม่ต้องแก้โค้ดหน้าจอ:

```
Component → *Service (project/boq/actualCost/supplier) → Repository<T> interface
                                                              ├── localRepository  → localStorage (ใช้งานจริงตอนนี้)
                                                              └── supabaseRepository → Supabase Postgres (เขียนไว้แล้ว ยังไม่ได้ใช้)
```

- [dataProvider.ts](construction-cost-manager/src/services/dataProvider.ts) เป็น **switch จุดเดียว**: อ่าน env `VITE_DATA_PROVIDER` — ถ้าไม่ใช่ `"supabase"` (ค่า default) ระบบจะใช้ localStorage เสมอ
- [repository.ts](construction-cost-manager/src/services/repository.ts) กำหนด interface กลาง `Repository<T>` (`getAll/getById/create/update/remove`)
- **ข้อมูลจริงตอนนี้ทั้งหมดอยู่ใน localStorage ของเบราว์เซอร์เครื่องผู้ใช้เท่านั้น** — ไม่มี backend server จริง ไม่ sync ข้ามเครื่อง/ผู้ใช้ ถ้าล้าง browser data หรือเปลี่ยนเครื่อง ข้อมูลหาย
- Supabase schema ถูกออกแบบไว้ล่วงหน้าแล้ว (พร้อม mapper แปลง camelCase ↔ snake_case ต่อ entity) แต่ **ยังไม่ได้สร้างโปรเจกต์ Supabase จริง / ยังไม่ deploy migration**

## 5. โมเดลข้อมูล (Domain Model)

4 entity หลัก ความสัมพันธ์:

```
User (Supabase Auth)
 └── Project (โปรเจกต์งาน)
      ├── BOQItem[]        (รายการประมาณราคา ต่อโปรเจกต์)
      └── ActualCost[]     (ค่าใช้จ่ายจริง ต่อโปรเจกต์ อ้างอิง Supplier ได้)
 └── Supplier (ผู้ขาย/ผู้รับเหมาช่วง — ใช้ร่วมกันข้ามโปรเจกต์)
```

- **Project**: รหัส/ชื่อโปรเจกต์, ลูกค้า, สถานที่, วันเริ่ม-จบ, มูลค่าสัญญา, VAT rate, สถานะ (`draft/quotation/approved/in_progress/completed/cancelled`)
- **BOQItem**: ลำดับ, รายการ, หมวดหมู่ (`materials/labor/machinery/subcontractor/transportation/design/services/other`), หน่วย, จำนวน, ราคาต่อหน่วย, ราคารวม
- **ActualCost**: วันที่, เลขเอกสาร, หมวดหมู่, ซัพพลายเออร์, จำนวนเงิน, โหมด VAT (`vat_included/vat_excluded/non_vat`), สถานะจ่ายเงิน (`unpaid/partially_paid/paid/overdue`), รูปใบเสร็จ (เก็บเป็น data URL), ที่มา (`manual` หรือ `ai_receipt_scan`) พร้อม OCR confidence/raw data
- **Supplier**: ชื่อ, เลขผู้เสียภาษี, ผู้ติดต่อ, เบอร์/อีเมล/ที่อยู่

Schema ฝั่ง Postgres (`0001_init.sql`) ใช้ **Row Level Security (RLS)** ทุกตาราง โดยยึด `user_id = auth.uid()` — ออกแบบเป็น multi-tenant พร้อมสำหรับผู้ใช้หลายคน แม้ตอนนี้ยังใช้งานจริงแบบ single-user บน localStorage เท่านั้น

## 6. ฟีเจอร์/หน้าจอทั้งหมด

| หน้า | เนื้อหา |
|---|---|
| Dashboard | การ์ดสรุป, กราฟ (มูลค่าสัญญา, breakdown ต้นทุน, ต้นทุนรายเดือน, ประมาณ vs จริง), โปรเจกต์ล่าสุด, quick actions |
| Projects | ตารางโปรเจกต์ + filter/pagination, modal สร้าง/แก้ไข/ลบ |
| ProjectDetail | แท็บย่อย: Overview, BOQ, ActualCost, Reports ต่อโปรเจกต์เดียว |
| BOQ | ตารางรายการประมาณราคา, สรุปยอด, ตัวคำนวณราคาขายที่แนะนำ (profit panel) |
| ActualCost | บันทึกค่าใช้จ่ายจริง, quick-add, **สแกนใบเสร็จด้วย AI** (ดูหัวข้อ 7), ดูรูปใบเสร็จ, badge สถานะจ่ายเงิน |
| Suppliers | ตาราง CRUD ผู้ขาย + รายละเอียด/สถิติการซื้อ |
| CostControl | เทียบประมาณการ vs ค่าใช้จ่ายจริงรายหมวด, budget alert, กำไร, top cost items |
| Reports | 6 แท็บรายงาน: ประมาณ vs จริง, ต้นทุนรายเดือน, กำไร, ต้นทุนต่อโปรเจกต์, ยอดซื้อต่อซัพพลายเออร์, รายงาน VAT — export ได้ (ผ่าน `exportUtils` + `xlsx`) |
| Settings | มีหน้าเปล่า/placeholder เท่านั้น (`implemented: false` ใน navigation) |
| Login/Register/ForgotPassword | ผูกกับ Supabase Auth; ถ้ายังไม่ตั้งค่า Supabase ระบบจะ bypass auth อัตโนมัติด้วย "local guest user" |

## 7. ฟีเจอร์ AI สแกนใบเสร็จ (ยังเป็น Mock)

[receiptAIService.ts](construction-cost-manager/src/services/receiptAIService.ts) มีจุดสลับ provider เดียว ปัจจุบันใช้ `mockReceiptAIProvider` (จำลองผลลัพธ์ ไม่ได้เรียก AI จริง) โค้ดมีคอมเมนต์เตือนไว้ชัดเจนว่า:
- ห้ามเรียก AI API (Claude/OpenAI/Gemini/OCR) พร้อม secret key จากฝั่ง frontend โดยตรง
- ของจริงต้องทำผ่าน backend route หรือ Supabase Edge Function ที่เก็บ API key ฝั่งเซิร์ฟเวอร์

→ นี่คือฟีเจอร์ที่ **บังคับให้ต้องมี backend/server-side component** อย่างน้อย 1 จุด ต่อให้ frontend ทั้งหมดยังเป็น static SPA

## 8. Authentication

- ออกแบบให้ใช้ Supabase Auth (email/password) — มีทั้ง sign in/up/out, reset password
- ถ้ายังไม่ config `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` ระบบจะ**ไม่บังคับ login** และใช้ผู้ใช้ placeholder `local-guest` แทนโดยอัตโนมัติ (พฤติกรรมปัจจุบัน)
- `ProtectedRoute` ครอบทุกหน้ายกเว้น login/register/forgot-password

## 9. ไฟล์เอกสารธุรกิจจริงในโฟลเดอร์ root (ไม่ใช่ส่วนหนึ่งของโค้ด)

พบไฟล์ธุรกิจจริงปนอยู่ใน root ของ OneDrive folder (ใบเสนอราคา/สัญญา/BOQ ของงานจริง เช่น Beaute Clinic, บ้านคุณแจ็ค, หมู่บ้าน Centro, ร้านสะดวกซัก) — เป็น Excel/PDF/Word ที่ทำมือ **ยังไม่เชื่อมกับระบบซอฟต์แวร์เลย** สะท้อนว่าปัจจุบันงานจริงส่วนนี้ยังทำนอกระบบ (Excel/Word) ควบคู่ไปกับแอปที่กำลังพัฒนา — เป็นข้อมูลอ้างอิงที่มีประโยชน์เวลาออกแบบฟีเจอร์ใบเสนอราคา/สัญญาของระบบใหม่

## 10. mysql-server (แยกออกมา ยังไม่เชื่อมต่อ)

`mysql-server/docker-compose.yml` ตั้ง MySQL 8.4 + Adminer สำหรับ dev local โดย README ระบุว่าเตรียมไว้ "for local development of **upcoming** API projects" — คือยังไม่ได้ใช้งานกับ `construction-cost-manager` เลย (แอปปัจจุบันผูกกับ Supabase/Postgres ไม่ใช่ MySQL) น่าจะเป็นร่องรอยความคิดที่เคยพิจารณา backend เอง (custom API + MySQL) เป็นอีกทางเลือกคู่กับ Supabase

## 11. จุดสังเกตสำคัญสำหรับการประเมิน Tech Stack ใหม่

1. **ยังไม่มี backend ใช้งานจริง** — ข้อมูลอยู่ใน localStorage เท่านั้น ทุกอย่างเรื่อง backend (Supabase หรืออื่น) เป็นแค่ scaffold ที่เขียนไว้รอ ยังไม่ deploy/ทดสอบจริง → เปลี่ยน stack ตอนนี้ **ไม่มีข้อมูล production ที่ต้อง migrate**
2. **Repository pattern แยกชั้นข้อมูลออกจาก UI ไว้ค่อนข้างดี** — ถ้าจะคง frontend เดิมแล้วเปลี่ยนแค่ backend ทำได้โดยเขียน Repository implementation ใหม่ (เช่น ต่อ MySQL/REST API เอง) โดยไม่ต้องแตะ component/pages
3. **ไม่มี automated test เลย** — ย้าย stack ต้องพึ่งการทดสอบมือ 100% หรือควรเพิ่ม test ระหว่างทางย้าย
4. **ฟีเจอร์สแกนใบเสร็จ AI ยังเป็น mock** — ต้องตัดสินใจใหม่ว่าจะต่อ AI service ไหน (Claude/OpenAI/Gemini/Google Vision OCR) และต้องมี server-side layer เก็บ API key
5. **รูปใบเสร็จเก็บเป็น data URL ใน record เดียวกับข้อมูล** ไม่ใช่ object storage แยก — ถ้าข้อมูลเยอะขึ้นจะกิน storage/perf มาก ควรออกแบบใหม่ให้แยกเก็บไฟล์ (เช่น S3/Supabase Storage) ตั้งแต่ stack ใหม่
6. **Multi-tenant (RLS ต่อ user) ถูกออกแบบไว้ในระดับ schema แล้ว** แม้ยังไม่ได้ใช้งานจริง — ถ้า stack ใหม่จะมีผู้ใช้หลายคน/หลายบริษัท ควรคงแนวคิดนี้ไว้
7. **ธุรกิจจริงมีเอกสารใบเสนอราคา/สัญญาที่ยังทำนอกระบบ (Excel/Word/PDF)** — เป็นโอกาสเพิ่มฟีเจอร์ generate ใบเสนอราคา/สัญญาในระบบใหม่ ให้ตรงกับ workflow จริงที่ใช้อยู่
8. Deployment ปัจจุบันผูกกับ Vercel (เหมาะกับ static/SPA + serverless functions) — ถ้า stack ใหม่ต้องการ persistent server/DB เอง ต้องพิจารณาเปลี่ยน hosting ด้วย
