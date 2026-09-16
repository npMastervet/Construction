# API contract — องค์กร สมาชิก โครงการ ผู้ขาย

เวอร์ชันข้อกำหนด 1; prefix `/api`; ยังไม่ได้ implement endpoints ใหม่ในเอกสารนี้

## ข้อกำหนดร่วม

- Auth ใช้ identity จาก middleware; ส่งผ่าน Bearer ตามฐานปัจจุบัน ส่วน refresh cookie เป็นงาน hardening ที่แยกไว้
- ทุก route ที่มี `:orgId` ต้องตรวจองค์กร+membership ปัจจุบัน; orgId ใน path ไม่ใช่หลักฐานสิทธิ์
- ทุก ID ใน body ต้อง validate ว่าอยู่ org/project เดียวกับ path; body ไม่รับ organizationId, createdBy, status หรือยอดที่ server คำนวณเองนอกที่ระบุ
- คำขอ JSON เกิน schema/มี unknown keys ตอบ 400 VALIDATION; validation ซ้ำที่ server แม้ Client ผ่านแล้ว
- mutation รับ `version` ของ resource ที่แก้; create ไม่ส่ง version; successful update version+1
- envelope สำเร็จ `{success:true,data:...,meta?:...}`; response error `{success:false,message,code,details?}`
- ห้ามใช้ global role เดิมเป็น authorization ของ endpoint ใหม่

## Endpoint inventory

| Method / path | Permission / scope | Request | Success |
|---|---|---|---|
| GET /me/organizations | identity ACTIVE | ไม่มี | 200 OrganizationSummary[] เฉพาะ memberships active |
| GET /organizations/:orgId/context | org member | ไม่มี | 200 organization + membership + organizationPermissions |
| PATCH /organizations/:orgId | organization.write | OrganizationPatch | 200 OrganizationSummary |
| GET /organizations/:orgId/members | member.manage | search,status,role,page,pageSize | 200 Member[] + meta |
| POST /organizations/:orgId/members | member.manage | MemberCreate | 201 Member |
| PATCH /organizations/:orgId/members/:memberId | member.manage | MemberPatch | 200 Member |
| GET /organizations/:orgId/projects | project.read | ProjectListQuery | 200 ProjectBasic[] หรือ ProjectFinancial[] ตามสิทธิ์ของแต่ละรายการ |
| POST /organizations/:orgId/projects | project.create | ProjectCreate | 201 ProjectFinancial |
| GET /organizations/:orgId/projects/:projectId | project.read | ไม่มี | 200 Project DTO ตามสิทธิ์ |
| PATCH /organizations/:orgId/projects/:projectId | project.write | ProjectPatch | 200 Project DTO |
| PUT /organizations/:orgId/projects/:projectId/contract | project.contract.write | ContractWrite | 200 ProjectFinancial |
| POST /organizations/:orgId/projects/:projectId/transitions | project.transition | ProjectTransition | 200 Project DTO |
| GET /organizations/:orgId/projects/:projectId/members | project.member.manage หรือ MANAGER ของ project | ไม่มี | 200 ProjectMember[] |
| PUT /organizations/:orgId/projects/:projectId/members/:memberId | project.member.manage | ProjectMemberWrite | 200 ProjectMember |
| GET /organizations/:orgId/suppliers | supplier.read | search,status,page,pageSize | 200 SupplierBasic[] หรือ SupplierFull[] |
| POST /organizations/:orgId/suppliers | supplier.write | SupplierCreate | 201 SupplierFull |
| GET /organizations/:orgId/suppliers/:supplierId | supplier.read | ไม่มี | 200 Supplier DTO |
| PATCH /organizations/:orgId/suppliers/:supplierId | supplier.write | SupplierPatch | 200 SupplierFull |
| GET /organizations/:orgId/audit-events | audit.read | projectId,entityType,entityId,from,to,page,pageSize | 200 AuditEvent[] + meta ตามขอบเขต/field ที่อ่านได้ |

ไม่มี public POST organization หรือ global user list; องค์กร/OWNER คนแรกมาจาก bootstrap CLI โดย explicit email/name ใช้ transaction และรันซ้ำได้โดยไม่ reset DB

Member POST ใช้เพิ่ม email allow-list ภายในองค์กร ไม่มีการส่งอีเมล หาก User มีอยู่แล้วให้เชื่อม membership โดยไม่เปลี่ยน global User.status/profile; หาก User SUSPENDED/INACTIVE อยู่ให้ปฏิเสธ 409 USER_UNAVAILABLE โดยไม่เปิดข้อมูลขององค์กรอื่น

## Request schemas

ทุก field ที่ไม่ได้ระบุ optional ต้องมี; PATCH ต้องมีอย่างน้อยหนึ่ง field ธุรกิจพร้อม version ค่า null ใช้ล้างได้เฉพาะ field nullable

| Schema | Fields และ validation |
|---|---|
| OrganizationPatch | version integer>=1; name? trimmed 1–200; defaultVatRate? decimal string 0..1 scale<=6; ห้ามแก้ currency/timezone/status รุ่นแรก |
| MemberCreate | email valid lowercase max254; displayName trimmed1–200 (ใช้เมื่อสร้าง User ใหม่); role OWNER/ACCOUNTANT/MEMBER |
| MemberPatch | version; role? enum; status? ACTIVE/SUSPENDED; ห้ามเหลือ active OWNER=0 |
| ProjectCreate | code `[A-Z0-9][A-Z0-9_-]{0,39}` normalize uppercase; name/clientName trimmed1–200; clientContact? max500; location? max1000; startDate?/endDate? valid date-only; end>=start เมื่อมีทั้งคู่ |
| ProjectPatch | version; name?/clientName?/clientContact?/location?/startDate?/endDate? ตาม create; code เปลี่ยนไม่ได้รุ่นแรก; ไม่รับ contract/status |
| ContractWrite | version; netAmount decimal string>=0 scale<=2 within Decimal(18,2); vatRate decimal string0..1 scale<=6; server คำนวณ VAT/gross; project ยังไม่ปิด |
| ProjectTransition | version; to DRAFT/QUOTATION/APPROVED/IN_PROGRESS/COMPLETED/CANCELLED; reason? max2000 บังคับเมื่อ cancel/reopen; ตรวจ transition table |
| ProjectMemberWrite | role MANAGER/RECORDER/VIEWER; canReadCosts boolean default false; status ACTIVE/SUSPENDED; version null เมื่อสร้าง assignment ใหม่ หรือ integer>=1 เมื่อแก้; memberId เป็น OrganizationMember ID |
| SupplierCreate | name trimmed1–200; taxId? digits13 string (ปล่อยว่างได้สำหรับบุคคล/รายจ่ายทั่วไป); contactName? max200; telephone? max50; email? valid max254; address? max2000 |
| SupplierPatch | version; fields ตาม create และ status? ACTIVE/ARCHIVED; archived supplier ยังอ่านจากเอกสารเก่าได้ |

การตรวจ taxId เป็นรูปแบบข้อมูลเท่านั้น ไม่รับรองสถานะทางภาษีของผู้ขาย; ห้ามใช้ number เพราะเลขศูนย์นำหน้า

การ PUT assignment ใหม่ต้อง version=null และ return409 เมื่อมี assignment แล้ว หากมี assignment SUSPENDED ให้แก้ด้วย version ปัจจุบัน ไม่สร้างซ้ำ

## Query / pagination

- `page` default1 >=1; `pageSize` default20 range1..100
- `search` trimmed max200; ค้นแบบ literal substring ไม่เปิด SQL wildcard โดยปริยาย
- Project filter: `status` หนึ่งค่าตาม enum; `sort` ใน `updatedAt:desc`, `updatedAt:asc`, `code:asc`, `name:asc`; default updatedAt:desc พร้อม id เป็น tie-breaker
- Member filter: status/role ตาม enum; supplier filter ACTIVE/ARCHIVED default ACTIVE
- `from/to` ของ audit เป็น ISO timestamp; จำกัดช่วงไม่เกิน90วัน default30วัน; ช่วง `[from,to)`
- หากไม่มีสิทธิ์ดู project ที่ส่งมาใน filter ตอบ404 ไม่ลด scope เป็นทั้งองค์กร
- รายการว่างตอบ200 data=[]; page เกินจำนวนตอบ200 []; `total` เป็นจำนวนหลังกรองและตรวจสิทธิ์แล้ว

```json
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 }
}
```

## DTOs

| DTO | Fields |
|---|---|
| OrganizationSummary | id,code,name,status,currency,timezone,defaultVatRate,version |
| Member | id,user:{id,email,displayName},role,status,version; ไม่มี global role/refreshTokens/googleId |
| ProjectBasic | id,code,name,clientName,location,startDate,endDate,status,version,createdAt,updatedAt,permissions:string[] |
| ProjectFinancial | ProjectBasic + clientContact,contract:{netAmount,vatRate,vatAmount,grossAmount} หรือ null; ตัวเลขทั้งหมด string |
| ProjectMember | id,organizationMemberId,displayName,role,canReadCosts,status,version; ไม่มี email สำหรับ MANAGER |
| SupplierBasic | id,name,status,contactName,telephone,version |
| SupplierFull | SupplierBasic + taxId,email,address,createdAt,updatedAt |
| AuditEvent | id,occurredAt,actorDisplayName,action,entityType,entityId,projectId?,changes ที่ allow-list ตาม role |

Phase 2 ยังไม่ส่งยอด BOQ/cost/payment ที่ยังไม่มีโมดูล ไม่ส่งเลขศูนย์สมมติเป็นรายงานจริง

Context example:

```json
{
  "success": true,
  "data": {
    "organization": { "id": "org_demo", "code": "CONSTRUCTION", "name": "กิจการตัวอย่าง", "status": "ACTIVE", "currency": "THB", "timezone": "Asia/Bangkok", "defaultVatRate": "0.000000", "version": 1 },
    "membership": { "id": "member_owner", "role": "OWNER", "status": "ACTIVE", "version": 1 },
    "organizationPermissions": ["organization.read", "organization.write", "member.manage", "project.create", "supplier.read", "supplier.write"]
  }
}
```

รายการ permissions ในตัวอย่างแสดงเฉพาะระดับองค์กร; permissions ของ resource project ส่งเมื่ออ่าน Project DTO และ Backend ต้องคำนวณใหม่ทุก request

ProjectCreate example:

```json
{
  "code": "CT-2026-001",
  "name": "ปรับปรุงอาคารตัวอย่าง A",
  "clientName": "ลูกค้าทดสอบ A",
  "location": "สถานที่สมมติ",
  "startDate": "2026-09-01",
  "endDate": "2026-10-31"
}
```

ผล 201:

```json
{
  "success": true,
  "data": {
    "id": "project_demo_a", "code": "CT-2026-001", "name": "ปรับปรุงอาคารตัวอย่าง A",
    "clientName": "ลูกค้าทดสอบ A", "clientContact": null, "location": "สถานที่สมมติ",
    "startDate": "2026-09-01", "endDate": "2026-10-31", "status": "DRAFT",
    "contract": null, "version": 1, "createdAt": "2026-09-14T03:00:00Z", "updatedAt": "2026-09-14T03:00:00Z",
    "permissions": ["project.read", "project.write", "project.contract.write", "project.transition", "project.member.manage", "financial.read"]
  }
}
```

หลัง PUT contract `{ "version":1,"netAmount":"100000.00","vatRate":"0.070000" }` OWNER ได้ version2 และ contract net100000.00/VAT7000.00/gross107000.00; VIEWER ได้ ProjectBasic ไม่มี key `contract`/`clientContact`

## Errors

| HTTP / code | กรณี |
|---|---|
| 400 VALIDATION | format, unknown field, วันที่/enum/page/decimal ไม่ถูกต้อง |
| 401 UNAUTHENTICATED | credentials ใช้ไม่ได้ หรือ global User ไม่ ACTIVE |
| 403 FORBIDDEN | เห็น resource แต่ไม่มี action หรือเขียน protected field |
| 404 NOT_FOUND | ไม่พบหรืออยู่นอก organization/project scope |
| 409 VERSION_CONFLICT | version เก่า; details.currentVersion |
| 409 DUPLICATE_CODE / MEMBER_EXISTS | business unique constraint |
| 409 LAST_OWNER | เปลี่ยนสมาชิกแล้วไม่มี active OWNER |
| 409 USER_UNAVAILABLE | บัญชีที่ระบุไม่พร้อมเพิ่มเป็นสมาชิก |
| 409 INVALID_TRANSITION / PRECONDITION_FAILED | สถานะข้ามขั้น หรือยังไม่มี baseline/สัญญา/ยอดค้างยังไม่หมด |
| 409 IDEMPOTENCY_CONFLICT | ใช้ key เดิมกับ payload ต่างกันใน endpoint ที่รองรับ |
| 429 RATE_LIMITED | เกิน rate limit พร้อม Retry-After |
| 500 INTERNAL_ERROR | ข้อผิดพลาดภายใน; ไม่ส่ง SQL/stack/token กลับ Client |

```json
{
  "success": false,
  "message": "ข้อมูลถูกแก้ไขแล้ว กรุณาโหลดข้อมูลล่าสุด",
  "code": "VERSION_CONFLICT",
  "details": { "currentVersion": 3 }
}
```

Phase 2 อนุญาต DRAFT↔QUOTATION และ cancel ตามเงื่อนไข; APPROVED ต้องรอ BOQ module และ baseline จริง จึงตอบ PRECONDITION_FAILED เมื่อยังไม่มี ไม่สร้าง approved baseline จำลอง
