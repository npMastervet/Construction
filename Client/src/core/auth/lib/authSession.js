import { APP_CONFIG } from "@/shared/lib/appConfig";

/** Namespaced while the inherited localStorage session is retained. */
export const AUTH_STORAGE_KEYS = {
  ACCESS: "construction.auth.accessToken",
  REFRESH: "construction.auth.refreshToken",
};

export function getStoredAccessToken() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS);
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

export function getStoredRefreshToken() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH);
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

function parseJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getStoredAccessTokenPayload() {
  const token = getStoredAccessToken();
  if (!token) return null;
  return parseJwtPayload(token);
}

/** Access token จาก backend เป็น JWT — ต้องยังไม่หมดอายุ (exp) */
export function isStoredAccessTokenValid() {
  const token = getStoredAccessToken();
  if (!token) return false;
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp * 1000 > Date.now();
}

/** ล้าง token ใน localStorage */
export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS);
  localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH);
}

/** มี session อยู่หรือไม่ (access token ยังไม่หมดอายุ หรือมี refresh token สำรอง) */
export function hasSession() {
  if (isStoredAccessTokenValid()) return true;
  return Boolean(getStoredRefreshToken());
}

const API_BASE = APP_CONFIG.apiUrl;

let _refreshPromise = null;

/**
 * ขอ access token ใหม่โดยใช้ refresh token ที่เก็บไว้
 * ป้องกัน concurrent call ด้วย in-flight dedup
 * @returns {Promise<boolean>} true = สำเร็จ, false = ล้มเหลว (session ถูกล้างแล้ว)
 */
export function silentRefresh() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) { clearAuthSession(); return false; }
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // 401/403 = token หมดอายุหรือถูก revoke → ล้าง session จริง
        // 4xx อื่น (400 payload ผิด) → ล้างเช่นกัน
        // 5xx / network fail (จับใน catch) → อย่าล้าง session (อาจเป็นแค่ server ชั่วคราว down)
        if (res.status < 500) clearAuthSession();
        return false;
      }

      const json = await res.json().catch(() => ({}));
      const { accessToken, refreshToken: newRefresh } = json?.data ?? {};
      if (!accessToken) { clearAuthSession(); return false; }
      localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS, accessToken);
      if (newRefresh) localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH, newRefresh);
      return true;
    } catch {
      // Network error (fetch ล้มเหลว, timeout, offline) — อย่าล้าง session
      // user อาจแค่ขาด internet ชั่วคราว ให้ลอง refresh อีกครั้งเมื่อกลับมา online
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

/**
 * เรียก POST /api/auth/logout แล้วล้าง local storage เสมอ (แม้ network ล้มเหลว)
 */
export async function logoutFromServer() {
  const access = getStoredAccessToken();
  const refresh = getStoredRefreshToken();
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      body: JSON.stringify(refresh ? { refreshToken: refresh } : {}),
    });
  } catch {
    /* ignore */
  } finally {
    clearAuthSession();
  }
}
