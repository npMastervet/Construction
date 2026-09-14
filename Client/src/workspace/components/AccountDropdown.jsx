import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isStoredAccessTokenValid, logoutFromServer } from "@/core/auth/lib/authSession";
import { ROUTES } from "@/routes/constants/routePaths";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/core/auth/store/useAuthStore";

function avatarInitials(user) {
  if (user?.displayName) {
    return user.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }
  return user?.email?.charAt(0)?.toUpperCase() ?? "?";
}

const AccountDropdown = () => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const { user, status, clearProfile } = useAuthStore();
  const profileReady = status === "ready";

  const hasValidToken = isStoredAccessTokenValid();

  const onLogout = async () => {
    setBusy(true);
    try {
      await logoutFromServer();
      clearProfile();
      navigate(ROUTES.AUTH.LOGIN, { replace: true });
    } finally {
      setBusy(false);
    }
  };

  if (!hasValidToken) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full border p-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
          title="Account menu"
        >
          {!profileReady ? (
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarUrl || undefined} alt="Profile" />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {avatarInitials(user)}
              </AvatarFallback>
            </Avatar>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 border-border bg-popover shadow-lg">
        {/* Mini profile header */}
        <DropdownMenuLabel className="py-2">
          {!profileReady ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="h-3 w-full" />
            </div>
          ) : (
            <div className="flex flex-col leading-tight">
              <span className="font-medium truncate">
                {user?.displayName || "ผู้ใช้งาน"}
              </span>
              {user?.email && (
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              )}
            </div>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* เพิ่มเมนูบัญชีผู้ใช้ (แก้ไขโปรไฟล์ ฯลฯ) ได้ที่นี่เมื่อสร้างหน้านั้นแล้ว */}

        <DropdownMenuItem onClick={onLogout} disabled={busy}>
          <LogOut className="mr-2 h-4 w-4" />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountDropdown;
