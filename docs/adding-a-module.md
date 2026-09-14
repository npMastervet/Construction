# เพิ่มโมดูล Construction

เริ่มจากแบบแผน SYSTEM_REBUILD_BLUEPRINT.md และพัฒนาโค้ดใหม่ด้วย TypeScript

## Server

1. สร้าง src/modules/construction/<area> แบ่ง routes/controllers/services/validation ตามความจำเป็น
2. Export Express router แล้วเพิ่มใน moduleRouters ที่ src/modules/index.ts
3. บังคับ auth, permission, organization/project scope ที่ Backend ทุก endpoint รวมรายงานและไฟล์
4. Validate ด้วย Zod; service ใช้ transaction และ API response ตามมาตรฐานฐานเดิม
5. เพิ่ม Prisma model/migration และ generate client ไม่ทำ schema reset

## Client

1. สร้าง src/modules/construction/<area> ด้วย pages/components/api/hooks ตามการใช้งาน
2. เพิ่มเส้นทางที่ routes/constants/routePaths.js และ lazy route ที่ routes/AppRoutes.jsx
3. เพิ่ม NAV_ITEMS ที่ layouts/Layout.jsx เฉพาะหน้าที่ใช้งานได้แล้ว
4. ใช้ authFetch ผ่าน core/auth/lib/apiClient และ TanStack Query; ไม่สร้าง auth header เองในโมดูล
5. buildQuery คืน query string ที่ยังไม่มี ? จึงต้องเติม ? เมื่อมีค่าค้นหา
6. ใช้ shared/lib/appConfig.ts สำหรับ public configuration; ห้ามใส่ secrets ใน VITE_*
7. ใช้ PageContainer/BackForwardNav และรูปแบบ empty/loading/error เดียวกับระบบ

Core ห้าม import business modules. Legacy requireMinRole เป็นสิทธิ์ชั่วคราว ไม่เพียงพอสำหรับสิทธิ์โครงการตามแผน

ตรวจ npm run check ก่อนส่งงาน พร้อม tests ของกฎธุรกิจที่เปลี่ยน
