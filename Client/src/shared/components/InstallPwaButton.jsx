import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const notChrome = !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return iOS && webkit && notChrome;
}

/**
 * ปุ่ม/คำแนะนำติดตั้ง PWA สำหรับ demo — Android Chrome ใช้ beforeinstallprompt;
 * iOS Safari ไม่มี event นี้ จึงแสดงข้อความแนะนำแทน
 */
export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [ios] = useState(() => isIosSafari());

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => {});
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (installed) {
    return (
      <p className="text-xs text-muted-foreground whitespace-nowrap">ติดตั้งแอปแล้ว</p>
    );
  }

  if (ios) {
    return (
      <p className="text-xs text-muted-foreground max-w-[min(100%,18rem)] sm:max-w-md">
        ติดตั้งบน iPhone: แตะ <strong>แชร์</strong> แล้วเลือก &quot;เพิ่มไปยังหน้าจอโฮม&quot;
      </p>
    );
  }

  if (!deferredPrompt) {
    return (
      <p className="text-xs text-muted-foreground max-w-[14rem] sm:max-w-none hidden sm:block">
        PWA: ใช้ Chrome เมนู &quot;ติดตั้งแอป&quot; หรือรอแบนเนอร์ติดตั้ง
      </p>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick}>
      ติดตั้งแอป (PWA)
    </Button>
  );
}
