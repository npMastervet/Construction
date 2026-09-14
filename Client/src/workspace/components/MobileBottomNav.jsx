import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Bell,
  MoreHorizontal,
  CalendarDays,
  FileText,
  ClipboardList,
  Banknote,
} from "lucide-react";
import { useAuthStore } from "@/core/auth/store/useAuthStore";
import { notificationsApi } from "@/core/notifications/lib/notificationsApi";
import { ROUTES } from "@/routes/constants/routePaths";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";

const POLL_INTERVAL_MS = 60_000;

// The "module" tab targets the user's primary accessible module. Order =
// priority when a user has access to several modules; "More" reaches the rest.
const MODULE_TABS = [
  { key: "LEAVE_CONTROL",      label: "วันลา",      icon: CalendarDays,  to: ROUTES.LEAVE.LIST,                    match: "/leave-control" },
  { key: "ACTIVITY",           label: "กิจกรรม",    icon: FileText,       to: ROUTES.ACTIVITY.REPORT_LIST,          match: "/activity" },
  { key: "EXPENSE_CONTROL",    label: "ใบเบิก",     icon: ClipboardList,  to: ROUTES.EXPENSE_CONTROL.DASHBOARD,     match: "/expense-control" },
  { key: "COLLECTION_CONTROL", label: "Collection", icon: Banknote,       to: ROUTES.COLLECTION_CONTROL.LIST,       match: "/collection-control" },
];

function TabButton({ active, label, icon: Icon, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="relative">
        {Icon && <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />}
        {badge > 0 && (
          <span className="pointer-events-none absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span className="max-w-full truncate text-[11px] font-medium leading-none">{label}</span>
    </button>
  );
}

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const modules = useAuthStore((s) => s.user?.modules);
  const canCollectionControlReview = useAuthStore((s) => s.user?.canCollectionControlReview === true);
  const [unreadCount, setUnreadCount] = useState(0);

  const moduleTab = useMemo(() => {
    const tab = MODULE_TABS.find((t) => modules?.includes(t.key)) ?? null;
    if (!tab) return null;
    // Reviewer ไป Coverage แทนรายการส่ง Collection ของฉัน
    if (tab.key === "COLLECTION_CONTROL" && canCollectionControlReview) {
      return { ...tab, to: ROUTES.COLLECTION_CONTROL.COVERAGE };
    }
    return tab;
  }, [modules, canCollectionControlReview]);

  // Poll the unread badge on mobile only (the header NotificationBell handles desktop).
  useEffect(() => {
    if (!isMobile) return undefined;
    let active = true;
    const fetchCount = async () => {
      try {
        const res = await notificationsApi.list({ isRead: false, page: 1, limit: 1 });
        if (active) setUnreadCount(res.meta?.unreadCount ?? 0);
      } catch {
        /* silent */
      }
    };
    fetchCount();
    const id = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [isMobile]);

  const go = useCallback((to) => navigate(to), [navigate]);

  const isHome = pathname === ROUTES.MAIN;
  const isModuleActive = moduleTab ? pathname.startsWith(moduleTab.match) : false;
  const isNotif = pathname.startsWith(ROUTES.NOTIFICATIONS.LIST);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 pb-safe md:hidden"
      aria-label="เมนูหลัก"
    >
      <div className="flex h-16 items-stretch">
        <TabButton active={isHome} label="หน้าหลัก" icon={Home} onClick={() => go(ROUTES.MAIN)} />
        {moduleTab && (
          <TabButton
            active={isModuleActive}
            label={moduleTab.label}
            icon={moduleTab.icon}
            onClick={() => go(moduleTab.to)}
          />
        )}
        <TabButton
          active={isNotif}
          label="แจ้งเตือน"
          icon={Bell}
          badge={unreadCount}
          onClick={() => go(ROUTES.NOTIFICATIONS.LIST)}
        />
        <TabButton label="เพิ่มเติม" icon={MoreHorizontal} onClick={() => setOpenMobile(true)} />
      </div>
    </nav>
  );
}
