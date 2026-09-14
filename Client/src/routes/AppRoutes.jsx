import { Routes, Route, Navigate } from "react-router-dom";
import LayoutExternal from "@/layouts/LayoutExternal";
import Layout from "@/layouts/Layout";
import { ROUTES } from "./constants/routePaths";

import LoginPage from "@/core/auth/pages/LoginPage";
import MainPage from "@/workspace/pages/MainPage";
import RequireAuth from "@/core/auth/routes/RequireAuth";

/**
 * โครงเส้นทางทั้งแอป
 *
 * เพิ่มหน้าใหม่: ใส่ไว้ใต้ <Route element={<Layout />}> และโหลดแบบ lazy
 * เพื่อไม่ให้ติดไปกับ initial bundle — Suspense boundary อยู่ใน Layout แล้ว
 *
 *   const MyPage = lazy(() => import("@/modules/my-module/pages/MyPage"));
 *   <Route path={ROUTES.MY_MODULE.LIST} element={<MyPage />} />
 *
 * ถ้าหน้านั้นต้องจำกัดสิทธิ์ ให้ห่อด้วย guard เช่น
 *
 *   <Route element={<RequireMinAdmin />}>
 *     <Route path="..." element={<AdminOnlyPage />} />
 *   </Route>
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* ไม่ต้อง login */}
      <Route element={<LayoutExternal />}>
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
      </Route>

      {/* ต้อง login — RequireAuth ตรวจ JWT และเก็บ token จาก OAuth callback hash */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path={ROUTES.MAIN} element={<MainPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.MAIN} replace />} />
    </Routes>
  );
}
