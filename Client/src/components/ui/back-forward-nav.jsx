import { cn } from "@/shared/lib/utils";
import { BackButton } from "@/components/ui/back-button";
import { ForwardButton } from "@/components/ui/forward-button";

const LAYOUT_BREAKPOINTS = {
  md: {
    row: "md:flex-row md:items-start md:justify-between md:gap-4",
    startRow: "md:flex-1 md:justify-start",
    trailingWrap: "justify-center md:w-auto md:shrink-0 md:justify-end",
    forwardInline: "md:hidden",
    forwardTrailing: "hidden md:flex",
    actionsOuter: "md:items-end md:w-auto",
    secondaryRow: "md:w-auto",
  },
  lg: {
    row: "lg:flex-row lg:items-start lg:justify-between lg:gap-4",
    startRow: "lg:flex-1 lg:justify-start",
    trailingWrap: "justify-end lg:w-auto lg:shrink-0",
    forwardInline: "lg:hidden",
    forwardTrailing: "hidden lg:flex",
    actionsOuter: "lg:items-end lg:w-auto",
    secondaryRow: "lg:w-auto",
  },
};

/**
 * แถวนำทาง: ปุ่มย้อนกลับ + เนื้อหาซ้าย (ถ้ามี) | ปุ่มเสริม (ถ้ามี) + ไปข้างหน้า (ชิดขวาเสมอในกลุ่มขวา)
 * รับ props เดียวกับ BackButton: fallback, onClick, title
 * @param {{ fallback?: string, onClick?: () => void, title?: string, forwardTitle?: string, start?: import('react').ReactNode, actions?: import('react').ReactNode, secondaryActions?: import('react').ReactNode, trailing?: import('react').ReactNode, layoutBreakpoint?: 'md' | 'lg', className?: string }} props
 *
 * ส่วน controls ทางขวาเลือกได้ 2 ทาง:
 * - `actions` / `secondaryActions` (แนะนำ) — component ห่อด้วย wrapper มาตรฐานให้เอง (filter+ปุ่มชิดขวา, wrap ได้,
 *   toggle อยู่แถวรอง) เป็นมาตรฐานเดียวกับหน้า Dashboard หน้าแค่ส่ง controls เข้ามา ไม่ต้องเขียน class เอง
 * - `trailing` (escape hatch) — ส่ง JSX ดิบเข้ามาเอง สำหรับเคสพิเศษที่ไม่เข้ากับโครงมาตรฐาน
 */
export function BackForwardNav({
  fallback,
  onClick,
  title = "กลับ",
  forwardTitle = "ไปข้างหน้า",
  start = null,
  actions = null,
  secondaryActions = null,
  trailing = null,
  layoutBreakpoint = "md",
  className,
}) {
  const layout = LAYOUT_BREAKPOINTS[layoutBreakpoint] ?? LAYOUT_BREAKPOINTS.md;

  const hasStandardActions = actions != null || secondaryActions != null;
  const trailingContent = hasStandardActions ? (
    <div className={cn("flex w-full min-w-0 flex-col items-stretch gap-2", layout.actionsOuter)}>
      {actions != null && (
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      )}
      {secondaryActions != null && (
        <div className={cn("flex w-full min-w-0 items-center justify-end gap-2", layout.secondaryRow)}>
          {secondaryActions}
        </div>
      )}
    </div>
  ) : (
    trailing
  );

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-3",
        layout.row,
        className,
      )}
    >
      <div className={cn("flex w-full min-w-0 items-start justify-between gap-3", layout.startRow)}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <BackButton fallback={fallback} onClick={onClick} title={title} />
          {start}
        </div>
        <ForwardButton title={forwardTitle} className={cn("shrink-0", layout.forwardInline)} />
      </div>
      <div className={cn("flex w-full min-w-0 items-center gap-2", layout.trailingWrap)}>
        {trailingContent}
        <ForwardButton title={forwardTitle} className={cn("hidden shrink-0", layout.forwardTrailing)} />
      </div>
    </div>
  );
}
