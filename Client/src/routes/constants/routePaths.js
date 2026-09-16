/**
 * เส้นทางทั้งหมดของแอปรวมศูนย์ไว้ที่นี่ — ห้ามเขียน path เป็น string ตรง ๆ ในคอมโพเนนต์
 *
 * เพิ่มโมดูลใหม่: ประกาศ root ของโมดูลไว้ด้านบน แล้วเพิ่ม key ใน ROUTES เช่น
 *
 *   export const MY_MODULE_ROOT = "/my-module";
 *   MY_MODULE: {
 *     LIST: `${MY_MODULE_ROOT}/items`,
 *     DETAIL: (id) => `${MY_MODULE_ROOT}/items/${id}`,
 *     DETAIL_PARAM: `${MY_MODULE_ROOT}/items/:id`,
 *   }
 *
 * คู่ DETAIL (ฟังก์ชันสร้าง URL) + DETAIL_PARAM (pattern ให้ <Route path>) คือแพตเทิร์นที่ใช้ทั้งแอป
 */
export const ROUTES = {
  MAIN: "/",
  CONSTRUCTION: {
    ORGANIZATION: (orgId) => `/organizations/${encodeURIComponent(orgId)}`,
    ORGANIZATION_PARAM: "/organizations/:orgId",
    PROJECT: (orgId, projectId) => `/organizations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}`,
    PROJECT_PARAM: "/organizations/:orgId/projects/:projectId",
  },
  AUTH: {
    LOGIN: "/login",
  },
};
