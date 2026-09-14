import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "@/routes/constants/routePaths";
import {
  AUTH_STORAGE_KEYS,
  isStoredAccessTokenValid,
  hasSession,
} from "@/core/auth/lib/authSession";
import { useAuthStore } from "@/core/auth/store/useAuthStore";
import FullPageLoader from "@/shared/components/FullPageLoader";

function persistTokensFromHash(hash) {
  const cleanedHash = hash.replace(/^#/, "");
  if (!cleanedHash) return { hasToken: false, returnTo: null };

  const params = new URLSearchParams(cleanedHash);
  const accessToken = params.get("accessToken");
  if (!accessToken) return { hasToken: false, returnTo: null };

  localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS, accessToken);
  const refreshToken = params.get("refreshToken");
  if (refreshToken) localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH, refreshToken);
  return { hasToken: true, returnTo: params.get("returnTo") };
}

function normalizeReturnTo(rawReturnTo) {
  if (typeof rawReturnTo !== "string") return null;
  const value = rawReturnTo.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith(ROUTES.AUTH.LOGIN)) return null;
  return value;
}

const RequireAuth = () => {
  const location = useLocation();
  const currentPath = `${location.pathname}${location.search || ""}`;
  const status = useAuthStore((s) => s.status);

  const hashAuth = persistTokensFromHash(location.hash || "");
  if (hashAuth.hasToken && isStoredAccessTokenValid()) {
    const returnToFromQuery = new URLSearchParams(location.search || "").get("returnTo");
    const target =
      normalizeReturnTo(hashAuth.returnTo) ||
      normalizeReturnTo(returnToFromQuery) ||
      location.pathname;
    return <Navigate to={target} replace />;
  }

  // มี session แต่ยังโหลด profile ไม่เสร็จ — รอก่อนเพื่อป้องกัน flash หน้าเปล่า
  if (hasSession() && status !== "ready") {
    return <FullPageLoader />;
  }

  // อนุญาตให้ render ถ้ามี refresh token — apiClient และ fetchProfile จะ refresh ให้อัตโนมัติ
  if (!hasSession()) {
    const params = new URLSearchParams();
    params.set("returnTo", currentPath);
    return <Navigate to={`${ROUTES.AUTH.LOGIN}?${params.toString()}`} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
