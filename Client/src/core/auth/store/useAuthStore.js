import { create } from "zustand";
import {
  getStoredAccessToken,
  getStoredAccessTokenPayload,
  isStoredAccessTokenValid,
  hasSession,
  silentRefresh,
} from "@/core/auth/lib/authSession";

import { APP_CONFIG } from "@/shared/lib/appConfig";

const API_BASE = APP_CONFIG.apiUrl;

/**
 * Zustand store สำหรับ current user profile
 *
 * เพิ่มฟิลด์จากโมดูล: ขยาย object ที่ set() ทั้งสองจุด (JWT preload + API response)
 * ให้ตรงกับสิ่งที่ GET /auth/current-user คืนมา
 *
 * status:
 *   'idle'    — ยังไม่เคย fetch
 *   'loading' — กำลัง fetch จาก API
 *   'ready'   — fetch เสร็จแล้ว (user อาจเป็น null ถ้า token ไม่ valid)
 */
export const useAuthStore = create((set, get) => ({
  /** @type {{ id:string, displayName:string, nickName:string, email:string, role:string, company:string, position:string, telephone:string, avatarUrl:string } | null} */
  user: null,
  status: "idle",

  /**
   * เรียกครั้งเดียวเมื่อ app โหลด
   * - preload ทันทีจาก JWT payload (ไม่รอ network)
   * - ตามด้วย fetch จาก API เพื่อข้อมูลสด
   */
  fetchProfile: async () => {
    if (get().status === "loading") return;

    // re-validate เบื้องหลัง (สลับ tab / interval 15 นาที) — มี profile พร้อมอยู่แล้ว
    // ห้าม flip status เป็น "loading" เพราะ RequireAuth จะ unmount หน้าทั้งหมด
    // ชั่วครู่ (อาการเหมือนหน้าถูก refresh). โหลดครั้งแรกเท่านั้นที่ควรโชว์ loader
    const isBackgroundRefresh = get().status === "ready" && Boolean(get().user);

    if (!isStoredAccessTokenValid()) {
      if (!hasSession()) { set({ status: "ready", user: null }); return; }
      const refreshed = await silentRefresh();
      if (!refreshed) {
        // silentRefresh ล้าง session ไปแล้วถ้า token หมดอายุ (4xx)
        // hasSession() ยังมีอยู่ = เกิดจาก network error ชั่วคราว → ไม่ควรล้าง session
        if (hasSession()) { set({ status: "ready" }); return; }
        set({ status: "ready", user: null });
        return;
      }
    }

    // --- Preload จาก JWT payload (ทันที ไม่รอ API) ---
    // ข้ามตอน background refresh — payload มีข้อมูลไม่ครบเท่า API response
    // การ overwrite user ที่ครบอยู่แล้วจะทำให้ guard บางตัวกระพริบ
    const payload = isBackgroundRefresh ? null : getStoredAccessTokenPayload();
    if (payload) {
      set((s) => ({
        user: {
          id: payload.sub || payload.id || s.user?.id || "",
          displayName: payload.displayName || s.user?.displayName || "ผู้ใช้งาน",
          email: payload.email || s.user?.email || "",
          role: payload.role || s.user?.role || "",
          company: payload.company || s.user?.company || "",
          position: payload.position || s.user?.position || "",
          avatarUrl: s.user?.avatarUrl || "",
        },
      }));
    }

    if (!isBackgroundRefresh) set({ status: "loading" });
    const token = getStoredAccessToken();

    try {
      const res = await fetch(`${API_BASE}/auth/current-user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        set({ status: "ready" });
        return;
      }
      const json = await res.json().catch(() => ({}));
      const u = json?.data;
      if (u) {
        set({
          user: {
            id: u.id || "",
            displayName: u.displayName || "ผู้ใช้งาน",
            nickName: u.nickName || "",
            email: u.email || "",
            role: u.role || "",
            company: u.company || "",
            position: u.position || "",
            telephone: u.telephone || "",
            avatarUrl: u.avatarUrl || "",
          },
          status: "ready",
        });
      } else {
        set({ status: "ready" });
      }
    } catch {
      // JWT preload ที่ set ไว้ก่อนหน้ายังใช้ได้
      set({ status: "ready" });
    }
  },

  /**
   * อัปเดตข้อมูล user ใน store หลัง profile edit สำเร็จ
   * (ไม่ต้อง refetch ทั้งหมด)
   */
  patchUser: (fields) => set((s) => ({
    user: s.user ? { ...s.user, ...fields } : s.user,
  })),

  /** เรียกตอน logout — ล้าง user ออกจาก store */
  clearProfile: () => set({ user: null, status: "idle" }),
}));
