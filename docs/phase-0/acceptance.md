# เกณฑ์ตรวจรับและตัวอย่างทดสอบ

## สถานะการตรวจ

- Reference JSON เป็นข้อมูลสมมติสำหรับข้อกำหนด ไม่ใช่ข้อมูล production หรือ seed ที่นำเข้าอัตโนมัติ
- verify-reference.ts ตรวจ expected totals โดย BigInt integer arithmetic ไม่ import calculation service ของแอป เพื่อใช้เป็น reference แยกต่างหากเมื่อพัฒนา
- ตาราง API/security/concurrency ด้านล่างเป็น acceptance specification ที่ต้อง implement tests ในระยะที่เกี่ยวข้อง ยังไม่ใช่ผลทดสอบว่าระบบปัจจุบันทำได้แล้ว

## ชุดผู้ใช้/องค์กรสำหรับ integration tests

สร้าง org-A และ org-B, project-A1/A2/B1; owner-A, accountant-A, manager-A1, recorder-A1, viewer-A1, viewer-cost-A1 และ owner-B; User หนึ่งคนเป็น MEMBER ใน A และ OWNER ใน B เพื่อพิสูจน์ว่าสิทธิ์ไม่รั่วข้ามองค์กร

| ID | Action | ผลที่ต้องได้ |
|---|---|---|
| AUTH-01 | ไม่มี token อ่าน project | 401 |
| AUTH-02 | owner-A อ่าน/แก้ B1 โดยเปลี่ยน URL | 404 และไม่มีชื่อ/ยอด project |
| AUTH-03 | manager-A1 เรียก A2 list/detail/count/audit | ไม่เห็นใน list/count; detail/audit แบบระบุ project ได้404 |
| AUTH-04 | ถอน ProjectMember ของ manager-A1 แล้วใช้ access token เดิม | request ถัดไป404 โดยไม่รอ token expire |
| AUTH-05 | suspend OrganizationMember A ของผู้ใช้ที่อยู่ B ด้วย | A ถูกปฏิเสธ; B ใช้ได้ตาม role ใน B |
| AUTH-06 | viewer-A1 อ่าน project | ไม่มี keys contract/clientContact/กำไร/ยอดต้นทุน; permissions ไม่มี write |
| AUTH-07 | viewer-cost-A1 อ่าน costs | เห็นยอดเอกสารใน A1; ไม่เห็น contract/payment/export |
| AUTH-08 | recorder-A1 เปิด cost draft/posted ของคนอื่น | 404; เอกสารของตนอ่านได้แต่ post/payment ไม่ได้ |
| AUTH-09 | สร้าง cost โดย supplierId หรือ boqItemId ของ org-B | ปฏิเสธก่อน mutation ไม่มี audit success |
| AUTH-10 | owner สองคนถอด owner อีกคนพร้อมกัน | อย่างน้อยหนึ่งคนถูก409 LAST_OWNER; เหลือ active owner>=1 |
| AUTH-11 | PATCH contract ผ่าน endpoint project.write ด้วย MANAGER | 403 ทั้งคำขอ; field อื่นไม่ถูกแก้ด้วย |
| AUTH-12 | global SUPERADMIN ที่ไม่มี membership | ไม่ได้สิทธิ์ธุรกิจจาก role เดิม |
| API-01 | code ซ้ำใน org-A | 409 DUPLICATE_CODE; org-B ใช้ code เดียวกันได้ |
| API-02 | invalid date/end<start/decimal exponent/unknown field | 400 พร้อม field errors |
| API-03 | PATCH version เก่า | 409 VERSION_CONFLICT; ไม่มี write/audit success |
| API-04 | list pageSize>100 หรือ sort ไม่อยู่ใน allow-list | 400; count ไม่รวม project ที่ไม่มีสิทธิ์ |
| API-05 | add membership อีเมล User ที่อยู่แล้ว | ไม่เปลี่ยน User.profile/status หรือสิทธิ์ org อื่น |
| API-06 | archive supplier ที่เคยใช้ | เอกสารเดิมอ่าน snapshot ได้ แต่ post เอกสารใหม่ด้วย supplier นี้ไม่ได้ |
| FLOW-01 | APPROVED project โดยไม่มี BOQ baseline/contract | 409 PRECONDITION_FAILED |
| FLOW-02 | approve BOQ revision ใหม่ | baseline เปลี่ยน atomic, เก่า SUPERSEDED และ immutable |
| FLOW-03 | แก้ posted cost ตรง ๆ | ปฏิเสธ; ต้อง void/replacement ตาม workflow |
| FLOW-04 | void cost ที่มี POSTED Payment | ปฏิเสธจน reverse ครบ |
| FLOW-05 | complete project ที่มี draft/ยอดค้าง | ปฏิเสธ; หลังเคลียร์แล้ว OWNER ทำได้ |
| CON-01 | ส่ง payment key เดิมซ้ำ | record เดียวและผลเดิม |
| CON-02 | key เดิมแต่เปลี่ยนจำนวนเงิน | 409 IDEMPOTENCY_CONFLICT |
| CON-03 | จ่าย600+600พร้อมกันกับยอดค้าง1000 | ได้รายการเดียว อีกคำขอถูกปฏิเสธ; ไม่เหลือยอดค้างติดลบ |
| CON-04 | reverse payment แข่งกับ void/post payment | serializable result ตาม lock cost; ไม่มี invariant เสีย |
| CON-05 | audit insert ล้มเหลวระหว่างเปลี่ยนสิทธิ์/เงิน | transaction rollback |
| FILE-01 | เดา file ID ของ project อื่น | 404 ไม่คืน URL/storage key |
| FILE-02 | อัปโหลดสำเร็จแต่ cost save ล้มเหลว | pending asset ไม่เป็นข้อมูลใช้จริง; cleanup ไม่ลบไฟล์ที่ถูกอ้างแล้ว |

## ตัวเลขอ้างอิง ณ 14 กันยายน 2026

| รายการ | โครงการ A | โครงการ B |
|---|---:|---:|
| มูลค่าสัญญาก่อน VAT | 100,000.00 | 150,000.00 |
| BOQ baseline | 60,000.00 | 90,000.00 |
| ต้นทุน posted ก่อน VAT | 16,000.00 | 23,500.01 |
| VAT ค่าใช้จ่าย | 770.00 | 1,470.00 |
| ยอดเอกสารรวม VAT | 16,770.00 | 24,970.01 |
| ยอดจ่ายที่มีผล | 10,350.00 | 22,470.01 |
| ยอดค้าง | 6,420.00 | 2,500.00 |
| งบประมาณเหลือ | 44,000.00 | 66,499.99 |
| ส่วนต่างสัญญากับต้นทุนปัจจุบัน | 84,000.00 | 126,499.99 |

ชุดนี้ครอบคลุม VAT ทั้ง3แบบ, การปัด 3×333.3350, จ่ายบางส่วน/หลายครั้ง, reverse payment, due วันนี้ไม่ overdue, due ผ่านแล้วแต่จ่ายครบไม่ overdue และการไม่นับ draft/void ในยอดโครงการ

ค่าค้างที่แสดงใน expected ของ draft/void เป็นการคำนวณเชิงตัวเลขเท่านั้น ไม่ใช่เจ้าหนี้ที่นำไปรายงานจริง; aggregate ต้องเลือกเฉพาะ POSTED cost ก่อนเสมอ

กรณีเพิ่มใน implementation: baseline/contract=null, ต้นทุน0 (เปอร์เซ็นต์แสดงไม่มีข้อมูล), overbudget (remainingติดลบได้), จำนวนเงินสูงสุด, invalid margin>=100%, วันที่ตัดรอบไทย, line allocation หลายหมวด และ changing defaultVatRate ไม่เปลี่ยนเอกสารเดิม

## เกณฑ์ปิดการออกแบบระยะ 0

มี data dictionary/ERD, permission matrix, transitions, API contract และ reference ที่ตรวจเลขแล้วครบ โดยใช้ค่าเริ่มต้นที่ผู้ใช้มอบหมายให้กำหนด สามารถเริ่มระยะข้อมูลและสิทธิ์ได้

ก่อน UAT ต้องเทียบกติกานี้กับเอกสารจริงอย่างน้อยสองโครงการ ถ้าพบ workflow นอก scope ให้บันทึกการเปลี่ยนข้อกำหนด ไม่แปลงข้อมูลจริงให้เข้ากับตัวอย่างสมมติแบบเงียบ ๆ

## ขอบเขต commit งานถัดไปที่แนะนำ

1. Schema+bootstrap+DB integration setup สำหรับองค์กร/สมาชิก/โครงการ/ผู้ขาย/audit
2. Authorization middleware/service + AUTH/API cases ของ entity ที่มีแล้ว
3. CRUD APIs+DTO projection+audit+version conflict
4. หน้าจอและ query integration (Client ใช้ TypeScript และ API client ของฐาน)
5. ทดสอบ end-to-end สร้างองค์กร/เพิ่มสมาชิก/สร้างโครงการ/มอบหมาย/ถอนสิทธิ์ แล้วอัปเดต foundation-status

งานไฟล์และ concurrency ทางการเงินเป็นเกณฑ์ของระยะค่าใช้จ่าย ไม่ขวางการส่งมอบระยะข้อมูลและสิทธิ์ที่ยังไม่มี endpoint เหล่านั้น
