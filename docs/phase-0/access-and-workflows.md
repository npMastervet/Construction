# สิทธิ์และสถานะเอกสาร

## การคำนวณสิทธิ์

ต้องผ่าน User ACTIVE + Organization ACTIVE + OrganizationMember ACTIVE ก่อนเสมอ

- OWNER/ACCOUNTANT มีขอบเขตทุกโครงการในองค์กรนั้น
- MEMBER ต้องมี ProjectMember ACTIVE ของโครงการ; role ในแต่ละโครงการต่างกันได้
- OWNER และ ACCOUNTANT ไม่ต้องสร้าง ProjectMember ซ้ำเพื่อให้สิทธิ์ระดับองค์กรมีผล
- ไม่มีสิทธิ์จากชื่อ HR/ADMIN/SUPERADMIN เดิม; global admin ไม่ได้อ่านข้อมูลกิจการโดยปริยาย
- OWNER จัดสมาชิกได้ แต่ต้องไม่ถอด/ระงับ OWNER คนสุดท้าย รวมคำขอพร้อมกัน
- ระงับสมาชิกองค์กรหนึ่งไม่ระงับ User ทั้งระบบ เพราะอาจเป็นสมาชิกองค์กรอื่น

## Matrix

O = ทุกโครงการในองค์กร; P = โครงการที่ได้รับมอบหมาย; own = draft ที่ตนสร้าง; — = ไม่อนุญาต

| Permission | OWNER | ACCOUNTANT | MANAGER | RECORDER | VIEWER |
|---|---|---|---|---|---|
| organization.read | O | O | O | O | O |
| organization.write | O | — | — | — | — |
| member.manage | O | — | — | — | — |
| project.create | O | — | — | — | — |
| project.read | O | O | P | P | P |
| project.write | O | — | P | — | — |
| project.contract.write | O | — | — | — | — |
| project.transition | O | — | P (เฉพาะ approved→in_progress) | — | — |
| project.member.manage | O | — | — | — | — |
| supplier.read | O | O | O | O (ข้อมูลพื้นฐาน) | — |
| supplier.write | O | O | — | — | — |
| boq.read | O | O | P | — | — |
| boq.write | O | — | P | — | — |
| boq.approve | O | — | — | — | — |
| cost.read | O | O | P | own (draft/posted/void ที่สร้างเอง) | P เมื่อ canReadCosts=true |
| cost.write | O | O | P | own draft | — |
| cost.post / cost.void | O | O | P | — | — |
| payment.read / payment.write / payment.reverse | O | O | — | — | — |
| financial.read (สัญญา/กำไร/ภาพรวมการเงิน) | O | O | P | — | — |
| report.export | O | O | P | — | — |
| audit.read | O | O (การเงิน) | P (โครงการ/BOQ/cost; ไม่รวม payment) | — | — |

`file.upload` ต้องมี cost.write ของเอกสารนั้น; `file.download` ต้องมี cost.read และไฟล์ผูกกับเอกสารที่อ่านได้ ไฟล์ pending อ่านได้เฉพาะ uploader ที่ยัง active ใน org; ไม่มี endpoint download ด้วย storage key จาก client

VIEWER ที่อ่านต้นทุนได้ยังไม่เห็น contract/gain/payment หรือ Export; RECORDER เห็นยอดเอกสารที่ตนสร้างเพื่อบันทึกงานได้ แต่ไม่เห็นยอดรวมโครงการหรือการชำระเงิน

Supplier DTO พื้นฐาน: id/name/status/contactName/telephone; taxId/email/address ให้ OWNER/ACCOUNTANT/MANAGER เท่านั้น รายงานยอดผู้ขายรวมเฉพาะโครงการที่ผู้ขออ่านการเงินได้

## HTTP และ field-level checks

1. ไม่มี/หมดอายุ credentials: 401; ไม่มี org membership หรือทรัพยากรอยู่นอก scope: 404 เพื่อไม่เปิดเผยว่ามีอยู่
2. มองเห็น resource แต่ไม่มี action permission: 403; สมาชิกที่ถูกระงับขอ context องค์กรนั้นได้ 404
3. query ทุก list/detail/aggregate บังคับ org และ project scope รวม count; ไม่ดึงทั้งหมดแล้ว filter ที่ Client
4. DTO project แบบ basic ไม่ประกอบ contractNet/VAT/gross/baseline totals/gain; field ที่ไม่มีสิทธิ์ต้องหายไปจาก JSON ไม่ส่ง null เพื่อซ่อนค่า
5. DTO cost สำหรับ RECORDER/VIEWER ไม่มี payments/paid/outstanding; การเงินค่าใช้จ่ายของเอกสารเองยังอ่าน net/VAT/gross ได้
6. PATCH ส่ง property ที่ role ไม่มีสิทธิ์แก้ตอบ 403 ทั้งคำขอ ไม่ silently ignore; unknown field ตอบ 400
7. Query cache key รวม org/project และล้างเมื่อ logout/สลับองค์กร; UI guards ช่วยใช้งานเท่านั้น

## Project transitions

| จาก → ไป | ผู้ทำ | เงื่อนไข |
|---|---|---|
| DRAFT → QUOTATION | OWNER | name/clientName ครบ |
| QUOTATION → DRAFT | OWNER | ยังไม่มีต้นทุน posted |
| QUOTATION → APPROVED | OWNER | contract amounts ครบและมี approved BOQ baseline |
| APPROVED → IN_PROGRESS | OWNER/MANAGER | สมาชิกยัง active |
| IN_PROGRESS → COMPLETED | OWNER | ไม่มี draft cost, ไม่มี BOQ draft ที่ค้าง, outstanding รวม = 0 |
| DRAFT/QUOTATION/APPROVED/IN_PROGRESS → CANCELLED | OWNER | ระบุเหตุผล; outstanding = 0, draft cost ยกเลิกก่อน; ประวัติ posted ยังอยู่ |
| COMPLETED → IN_PROGRESS | OWNER | เหตุผล reopen; audit |

CANCELLED ไม่มี reopen ในรุ่นแรก โครงการ COMPLETED/CANCELLED read-only ยกเว้น action reopen ที่กำหนด และไม่อนุญาตใช้ PATCH status ข้าม transition

## BOQ transitions

| Action | ผล | เงื่อนไข |
|---|---|---|
| create draft | DRAFT revision ใหม่ | boq.write; project ยังไม่ปิด; revision จัดสรรแบบ atomic |
| edit draft | DRAFT version+1 | boq.write และ version ตรง |
| approve | DRAFT → APPROVED | OWNER; มีรายการ; transaction เปลี่ยน baseline และ approved เก่าเป็น SUPERSEDED |
| revise | copy baseline → DRAFT | boq.write; เก่า immutable; มี draft ได้ไม่เกินหนึ่งฉบับต่อ project |
| discard draft | ลบ draft พร้อม audit | boq.write; ไม่มี cost item อ้าง; approved/superseded ห้ามลบ |

รายงานเลือก baseline เก่าได้ แต่หน้าโครงการใช้ currentBaselineId เสมอ; ค่าใช้จ่ายที่อ้าง item เก่าไม่ถูกย้ายไป revision ใหม่อัตโนมัติ

## ActualCost และ Payment

| Action | จาก → ไป | เงื่อนไข |
|---|---|---|
| save/edit cost | DRAFT → DRAFT | cost.write/own; project ยังไม่ปิด; version ตรง |
| post cost | DRAFT → POSTED | cost.post; มี item; server คำนวณยอด; Supplier ที่อ้าง ACTIVE; dueDate >= documentDate เมื่อมี |
| discard cost | DRAFT → VOID | cost.write/own; เหตุผล; ไม่ลงยอดต้นทุน |
| void cost | POSTED → VOID | cost.void; เหตุผล; active payment รวม = 0; project ยังไม่ปิด |
| replace cost | VOID → สร้าง DRAFT ใหม่ | cost.write; เก็บ replacesCostId; snapshot เดิมไม่ถูกเขียนทับ |
| record payment | สร้าง POSTED Payment | payment.write; cost POSTED; amount > 0 และไม่เกิน outstanding; วันที่ <= วันนี้ |
| reverse payment | POSTED → REVERSED | payment.reverse; เหตุผล; version ตรง; project ยังไม่ปิด |

REVERSED/VOID เป็นปลายทาง ไม่แก้กลับเป็น POSTED; สร้างเอกสารใหม่หากต้องการลงรายการใหม่

paid=0 → UNPAID; 0<paid<gross → PARTIALLY_PAID; paid=gross → PAID; overdue เป็น boolean แยก เมื่อ dueDate < asOfDate และ outstanding>0 ดังนั้น due วันนี้ยังไม่ overdue

## Concurrency และ audit

- mutable PATCH/transition ใช้ version; ไม่ตรง 409 VERSION_CONFLICT พร้อม currentVersion แต่ไม่เปิดเผย data นอกสิทธิ์
- post/payment/reverse ต้อง Idempotency-Key; scope=(org,actor,method,path,key), เก็บ hash payload/result อย่างน้อย 24 ชั่วโมง
- same key+same payload replay ผลเดิม; same key+ต่าง payload 409 IDEMPOTENCY_CONFLICT; ยังต้องตรวจ current auth ก่อน replay
- payment ล็อก cost ก่อน sum+insert; reverse/void ใช้ lock ตัวเดียวกันเพื่อไม่ให้ยอดติดลบ/จ่ายเกินจากสอง request
- Audit รวมกับธุรกรรมเงิน/เปลี่ยนสิทธิ์ หาก audit write ล้มเหลวธุรกรรมต้อง rollback
- LoginAttempt ยังบันทึกการเข้าระบบแยกจาก business audit
