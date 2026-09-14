import {
  getStoredAccessToken,
  silentRefresh,
  clearAuthSession,
} from "@/core/auth/lib/authSession";

import { APP_CONFIG } from "@/shared/lib/appConfig";
import { ROUTES } from "@/routes/constants/routePaths";

const API_BASE = APP_CONFIG.apiUrl;

function buildError(json, statusText, fallback, httpStatus) {
  const err = new Error(json.message || statusText || fallback);
  err.status = json.status ?? httpStatus;
  err.body = json;
  err.errors = json.errors || [];
  return err;
}

function redirectToLogin() {
  clearAuthSession();
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.replace(`${ROUTES.AUTH.LOGIN}?returnTo=${returnTo}`);
}

export async function authFetch(path, options = {}) {
  const token = getStoredAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    const refreshed = await silentRefresh();
    if (!refreshed) { redirectToLogin(); throw buildError({}, "Unauthorized", "Session expired", 401); }

    const newToken = getStoredAccessToken();
    const retryHeaders = {
      ...headers,
      ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
    };
    res = await fetch(`${API_BASE}${path}`, { ...options, headers: retryHeaders });
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw buildError(json, res.statusText, "Request failed", res.status);
  return json;
}

/**
 * authFetchForm — ส่ง multipart/form-data (ไม่ set Content-Type ให้ browser set boundary เอง)
 * ใช้สำหรับ upload ไฟล์
 */
export async function authFetchForm(path, formData, { method = "POST" } = {}) {
  const token = getStoredAccessToken();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body:   formData,
  });

  if (res.status === 401) {
    const refreshed = await silentRefresh();
    if (!refreshed) { redirectToLogin(); throw buildError({}, "Unauthorized", "Session expired", 401); }

    const newToken = getStoredAccessToken();
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}) },
      body:    formData,
    });
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw buildError(json, res.statusText, "Upload failed", res.status);
  return json;
}

/**
 * authFetchBlob — ดาวน์โหลดไฟล์ binary (ZIP, PDF ฯลฯ) พร้อม JWT auth + 401 retry
 * คืน { blob, filename } โดยอ่าน filename จาก Content-Disposition header
 */
export async function authFetchBlob(path, options = {}) {
  const token = getStoredAccessToken();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    const refreshed = await silentRefresh();
    if (!refreshed) { redirectToLogin(); throw buildError({}, "Unauthorized", "Session expired", 401); }
    const newToken = getStoredAccessToken();
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}) },
    });
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw buildError(json, res.statusText, "Download failed", res.status);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";\n]+)"?/);
  const filename = match?.[1]?.trim() || res.headers.get("X-Export-FileName") || "export.zip";
  return { blob, filename };
}

export function formatApiError(e, fallback = "เกิดข้อผิดพลาด") {
  if (!e) return fallback;
  const base = e.message || fallback;
  if (!e.errors?.length) return base;
  const details = e.errors.map((err) => err.message).filter(Boolean).join(", ");
  return details ? `${base}: ${details}` : base;
}

export function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      q.set(k, String(v));
    }
  });
  return q.toString();
}
