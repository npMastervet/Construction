/** สอดคล้องกับ backend: HR=2, ADMIN=3, SUPERADMIN=4 */
export const ROLE_LEVELS = {
  USER: 1,
  HR: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
};

export const ALL_ROLES = ["USER", "HR", "ADMIN", "SUPERADMIN"];

/** role ที่ผู้สร้าง/แก้ไขสามารถกำหนดให้ผู้อื่นได้ */
export function getAssignableRoles(actorRole) {
  const key = String(actorRole || "").trim().toUpperCase();
  const actorLevel = ROLE_LEVELS[key] || 0;
  if (!actorLevel) return [];

  return ALL_ROLES.filter((r) => {
    if (r === "SUPERADMIN" && key !== "SUPERADMIN") return false;
    return (ROLE_LEVELS[r] || 0) <= actorLevel;
  });
}

export function isMinHr(role) {
  const r = String(role || "").trim().toUpperCase();
  return r === "HR" || r === "ADMIN" || r === "SUPERADMIN";
}

/** ADMIN ขึ้นไป — สอดคล้องกับ backend requireMinRole("ADMIN") */
export function isMinAdmin(role) {
  const r = String(role || "").trim().toUpperCase();
  const level = ROLE_LEVELS[r] || 0;
  return level >= ROLE_LEVELS.ADMIN;
}
