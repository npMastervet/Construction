import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, LogOut } from "lucide-react";

import RouteFallback from "@/routes/RouteFallback";
import { ROUTES } from "@/routes/constants/routePaths";
import { useAuthStore } from "@/core/auth/store/useAuthStore";
import { logoutFromServer } from "@/core/auth/lib/authSession";
import { APP_NAME, APP_LOGO_URL, APP_VERSION, APP_VERSION_CODE } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import AccountDropdown from "@/workspace/components/AccountDropdown";
import AutoBreadcrumbs from "@/workspace/components/AutoBreadcrumbs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

/**
 * รายการเมนูใน sidebar
 *
 * เพิ่มเมนูของโมดูลใหม่ที่นี่ ถ้าเมนูต้องจำกัดสิทธิ์ให้ใส่ `visible` เป็นฟังก์ชัน
 * ที่รับ { role } แล้วคืน boolean เช่น
 *
 *   { to: ROUTES.ADMIN.SETTINGS, icon: Settings, label: "ตั้งค่าระบบ",
 *     visible: ({ role }) => isMinAdmin(role) }
 *
 * (`isMinHr` / `isMinAdmin` อยู่ที่ @/core/lib/rolePolicy)
 */
const NAV_ITEMS = [
  { to: ROUTES.MAIN, icon: Home, label: "หน้าหลัก", exact: true },
];

function NavItem({ to, icon: Icon, label, exact }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={to}
          end={exact}
          className={({ isActive }) =>
            isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
          }
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearProfile } = useAuthStore();
  const role = user?.role || "";
  const [logoutBusy, setLogoutBusy] = React.useState(false);

  const onLogout = async () => {
    setLogoutBusy(true);
    try {
      await logoutFromServer();
      clearProfile();
      navigate(ROUTES.AUTH.LOGIN, { replace: true });
    } finally {
      setLogoutBusy(false);
    }
  };

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.visible || item.visible({ role })
  );

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            {APP_LOGO_URL ? (
              <img src={APP_LOGO_URL} alt="" className="h-7 w-7 shrink-0 rounded object-contain" />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
                {APP_NAME.charAt(0)}
              </div>
            )}
            <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
              {APP_NAME}
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleNavItems.map((item) => (
                  <NavItem key={item.to} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            disabled={logoutBusy}
            className="justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">ออกจากระบบ</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      {/* mobile: h-svh scroll container เพื่อให้ sticky header ทำงาน; desktop: scroll ที่ main */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col max-md:h-svh max-md:overflow-x-hidden max-md:overflow-y-auto md:overflow-hidden">
        <header className="sticky top-0 z-40 flex h-12 min-w-0 shrink-0 items-center gap-2 border-b bg-background px-4 pt-safe max-md:h-14 max-md:bg-background/85 max-md:backdrop-blur">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <div className="min-w-0 flex-1 overflow-hidden pr-2">
            <AutoBreadcrumbs />
          </div>
          <ThemeToggle />
          <AccountDropdown />
        </header>

        <main className="flex-1 max-md:overflow-visible md:overflow-auto">
          {/* key ที่ pathname (ไม่ใช่ location.key) — การเปลี่ยน query string
              จะได้ไม่ remount ทั้งหน้า มีแต่การเปลี่ยน route จริงที่ transition */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <React.Suspense fallback={<RouteFallback />}>
                <Outlet />
              </React.Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        <p className="pointer-events-none fixed bottom-2 right-3 z-30 select-none text-[10px] text-muted-foreground/50">
          v{APP_VERSION}
          {APP_VERSION_CODE ? ` - ${APP_VERSION_CODE}` : ""}
        </p>
      </div>
    </SidebarProvider>
  );
}
