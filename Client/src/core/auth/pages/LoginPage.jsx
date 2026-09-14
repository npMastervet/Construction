import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes/constants/routePaths";
import { HardHat, Loader2 } from "lucide-react";
import { InAppBrowserWarning } from "@/core/auth/components/InAppBrowserWarning";
import { isStoredAccessTokenValid } from "@/core/auth/lib/authSession";
import { LoginPageSkeleton } from "@/shared/components/skeletons/AuthLayoutSkeletons";
import { detectInAppBrowser } from "@/shared/lib/inAppBrowser";
import { cn, APP_NAME, APP_LOGO_URL } from "@/shared/lib/utils";

import { APP_CONFIG } from "@/shared/lib/appConfig";

const AUTH_GOOGLE_URL = `${APP_CONFIG.apiUrl}/auth/google`;

const AUTH_ERROR_MESSAGES = {
  account_inactive:
    "อีเมลบัญชี Google นี้ถูกระงับหรือยังไม่ได้เปิดสิทธิ์เข้าใช้งาน กรุณาลองบัญชีอื่น หรือติดต่อผู้ดูแลระบบ",
  email_not_found:
    "อีเมลบัญชี Google นี้ยังไม่มีในระบบ กรุณาใช้บัญชีที่ได้รับอนุญาต หรือติดต่อผู้ดูแลระบบ",
  unauthorized_user: "ไม่สามารถยืนยันตัวตนได้ กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง",
  server_error: "ระบบขัดข้องชั่วคราว กรุณารอสักครู่แล้วลองใหม่",
};

function normalizeReturnTo(rawReturnTo) {
  if (typeof rawReturnTo !== "string") return null;
  const value = rawReturnTo.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith(ROUTES.AUTH.LOGIN)) return null;
  return value;
}

const LoginPage = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [logoReady, setLogoReady] = useState(false);
  const imgRef = useRef(null);
  const error = new URLSearchParams(window.location.search).get("error");
  const errorDetail =
    error && (AUTH_ERROR_MESSAGES[error] ?? error);
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = normalizeReturnTo(
    new URLSearchParams(location.search).get("returnTo")
  );
  const inAppBrowser = useMemo(() => detectInAppBrowser(), []);
  const googleLoginDisabled = isRedirecting || Boolean(inAppBrowser);

  useEffect(() => {
    if (isStoredAccessTokenValid()) {
      navigate(returnTo || ROUTES.MAIN, { replace: true });
    }
  }, [navigate, returnTo]);

  // ถ้า browser cache รูปไว้แล้ว onLoad จะไม่ fire — ตรวจสอบ img.complete หลัง mount
  useEffect(() => {
    if (!APP_LOGO_URL) {
      setLogoReady(true);
      return;
    }
    const id = requestAnimationFrame(() => {
      if (imgRef.current?.complete) {
        setLogoReady(true);
      }
    });
    return () => cancelAnimationFrame(id);
    // APP_LOGO_URL เป็น module-level constant ไม่ใช่ reactive dependency
  }, []);

  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    const loginUrl = new URL(AUTH_GOOGLE_URL, window.location.origin);
    if (returnTo) {
      loginUrl.searchParams.set("returnTo", returnTo);
    }
    window.location.href = loginUrl.toString();
  };

  const handleGoogleLoginSelectAccount = () => {
    setIsRedirecting(true);
    const loginUrl = new URL(AUTH_GOOGLE_URL, window.location.origin);
    if (returnTo) loginUrl.searchParams.set("returnTo", returnTo);
    loginUrl.searchParams.set("prompt", "select_account");
    window.location.href = loginUrl.toString();
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md min-h-[420px]">
        {!logoReady && (
          <div className="absolute inset-0 z-10">
            <LoginPageSkeleton />
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl border bg-card text-card-foreground shadow-xl p-8 space-y-8 animate-in fade-in duration-500",
            !logoReady && "invisible pointer-events-none"
          )}
          aria-busy={!logoReady}
        >
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {APP_LOGO_URL ? (
                <img
                  ref={imgRef}
                  src={APP_LOGO_URL}
                  alt={APP_NAME}
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  onLoad={() => setLogoReady(true)}
                  onError={() => setLogoReady(true)}
                />
              ) : (
                <div
                  className="flex w-16 h-16 md:w-20 md:h-20 items-center justify-center rounded-lg border border-primary/20 bg-primary/5"
                  aria-hidden
                >
                  <HardHat className="h-10 w-10 md:h-12 md:w-12 text-primary" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                {APP_NAME}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {APP_CONFIG.description}
              </p>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="space-y-4">
            {error && (
              <div
                className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3.5 text-center shadow-sm dark:border-red-900/40 dark:bg-red-950/30"
                role="alert"
              >
                <p className="text-sm font-semibold text-red-500 tracking-tight">
                  ไม่สามารถเข้าสู่ระบบได้
                </p>
                <p className="mt-2 text-sm leading-relaxed text-red-500">
                  {errorDetail}
                </p>
              </div>
            )}
            {inAppBrowser && <InAppBrowserWarning label={inAppBrowser} />}
            <Button
              type="button"
              size="lg"
              className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-800 border border-input shadow-sm"
              onClick={handleGoogleLogin}
              disabled={googleLoginDisabled}
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  กำลังนำคุณไปยัง Google...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-2.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  เข้าสู่ระบบด้วย Google
                </>
              )}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleGoogleLoginSelectAccount}
                disabled={googleLoginDisabled}
                className={cn(
                  "text-sm underline-offset-4 transition-colors hover:text-primary hover:underline disabled:pointer-events-none disabled:opacity-50",
                  error ? "font-medium text-primary" : "text-muted-foreground"
                )}
              >
                เข้าสู่ระบบด้วยบัญชีอื่น
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
