import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/routes/constants/routePaths";
import { isStoredAccessTokenValid } from "@/core/auth/lib/authSession";
import { isMinHr } from "@/core/lib/rolePolicy";
import { useAuthStore } from "@/core/auth/store/useAuthStore";

/**
 * อนุญาตเฉพาะ HR / ADMIN / SUPERADMIN
 * ใช้ useAuthStore แทนการ fetch /auth/current-user เอง
 */
const RequireMinHr = () => {
  const { user, status, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (status === "idle") fetchProfile();
  }, [status, fetchProfile]);

  if (!isStoredAccessTokenValid()) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  if (status === "idle" || status === "loading") {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        กำลังตรวจสิทธิ์...
      </div>
    );
  }

  if (!user || !isMinHr(user.role)) {
    return <Navigate to={ROUTES.MAIN} replace />;
  }

  return <Outlet />;
};

export default RequireMinHr;
