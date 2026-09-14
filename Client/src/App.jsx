import { useEffect, useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "@/core/auth/store/useAuthStore";
import { hasSession } from "@/core/auth/lib/authSession";
import { NavigationHistoryProvider } from "@/shared/navigation/NavigationHistoryProvider";

// นโยบาย refetch (อย่าเปลี่ยน): refetchOnWindowFocus:false โดยเจตนา — กัน draft ฟอร์มถูกทับเมื่อสลับแท็บ
// อัปเดต near real-time ของหน้าคิวมาจาก RealtimeProvider (SSE) + poll fallback เฉพาะหน้า ไม่ใช่ focus refetch
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function AuthBootstrap() {
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const lastVisibleFetchRef = useRef(0);

  // โหลด profile เมื่อ app เริ่ม — hasSession คืน true แม้ access token หมดอายุ
  // fetchProfile จะ silentRefresh อัตโนมัติถ้า access token expired
  useEffect(() => {
    if (hasSession()) {
      lastVisibleFetchRef.current = Date.now();
      fetchProfile();
    }
  }, [fetchProfile]);

  // refresh เมื่อ user กลับมาที่ tab (กรณีเปิดทิ้งไว้ข้ามคืน)
  // throttle 60 วินาที เพื่อไม่ให้ trigger re-render ทุกครั้งที่สลับ tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && hasSession()) {
        const now = Date.now();
        if (now - lastVisibleFetchRef.current > 60_000) {
          lastVisibleFetchRef.current = now;
          fetchProfile();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchProfile]);

  // refresh ทุก 15 นาที เพื่อ sync role/status จาก server
  // — ป้องกัน route guard ใช้ข้อมูลเก่าเมื่อ admin เปลี่ยน role ขณะ user เปิด tab ค้างไว้
  useEffect(() => {
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const id = setInterval(() => {
      if (hasSession()) fetchProfile();
    }, FIFTEEN_MINUTES);
    return () => clearInterval(id);
  }, [fetchProfile]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <NavigationHistoryProvider>
            <AuthBootstrap />
            <AppRoutes />
            <Toaster />
          </NavigationHistoryProvider>
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  );
}

export default App;
