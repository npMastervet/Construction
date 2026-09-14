import { useEffect, useState } from "react";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  CornerDownLeft,
  LayoutList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/utils";

export function ListPaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
  disabled = false,
  className,
}) {
  const safeTotalPages = Math.max(1, totalPages);
  const [jumpDraft, setJumpDraft] = useState(String(page));

  useEffect(() => {
    setJumpDraft(String(page));
  }, [page]);

  const goTo = (target) => {
    if (disabled) return;
    const n = Math.min(Math.max(1, Math.floor(target)), safeTotalPages);
    onPageChange(n);
  };

  const applyJump = () => {
    if (disabled) return;
    const parsed = parseInt(String(jumpDraft).trim(), 10);
    if (!Number.isFinite(parsed)) {
      setJumpDraft(String(page));
      return;
    }
    const n = Math.min(Math.max(1, Math.floor(parsed)), safeTotalPages);
    onPageChange(n);
    setJumpDraft(String(n));
  };

  const summaryTitle = `หน้า ${page} จาก ${safeTotalPages} รวม ${total} รายการ`;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground",
        className
      )}
    >
      <div
        className="flex shrink-0 items-center gap-2 text-foreground"
        title={summaryTitle}
      >
        <LayoutList className="size-4 shrink-0 opacity-70" aria-hidden />
        <span className="tabular-nums font-medium">{page}</span>
        <span className="opacity-50" aria-hidden>
          /
        </span>
        <span className="tabular-nums opacity-90">{safeTotalPages}</span>
        <span className="mx-0.5 opacity-40 select-none" aria-hidden>
          ·
        </span>
        <span className="tabular-nums text-muted-foreground">{total}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          disabled={disabled || page <= 1}
          title="หน้าแรก"
          onClick={() => goTo(1)}
        >
          <ChevronsLeft className="size-4" />
          <span className="sr-only">หน้าแรก</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          disabled={disabled || page <= 1}
          title="ก่อนหน้า"
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeft className="size-4" />
          <span className="sr-only">ก่อนหน้า</span>
        </Button>
        <div className="flex items-center gap-1 px-0.5">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label="เลขหน้าที่ต้องการไป"
            title="กรอกเลขหน้าแล้วกดไอคอนยืนยันหรือ Enter"
            className="h-9 w-12 border bg-background text-center text-sm tabular-nums px-1"
            disabled={disabled}
            value={jumpDraft}
            onChange={(e) => setJumpDraft(e.target.value.replace(/\D/g, ""))}
            onBlur={() => {
              const parsed = parseInt(String(jumpDraft).trim(), 10);
              if (!Number.isFinite(parsed)) setJumpDraft(String(page));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyJump();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="shrink-0"
            disabled={disabled}
            title="ไปยังหน้าที่ระบุ"
            onClick={applyJump}
          >
            <CornerDownLeft className="size-4" />
            <span className="sr-only">ไปยังหน้าที่ระบุ</span>
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          disabled={disabled || page >= safeTotalPages}
          title="ถัดไป"
          onClick={() => goTo(page + 1)}
        >
          <ChevronRight className="size-4" />
          <span className="sr-only">ถัดไป</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          disabled={disabled || page >= safeTotalPages}
          title="หน้าสุดท้าย"
          onClick={() => goTo(safeTotalPages)}
        >
          <ChevronsRight className="size-4" />
          <span className="sr-only">หน้าสุดท้าย</span>
        </Button>
      </div>
    </div>
  );
}

/** แถบแบ่งหน้าเดียวกันทั้งด้านบนและด้านล่างของเนื้อหา (เช่น ตาราง) */
export function ListPaginationSurround({
  children,
  className,
  barClassName,
  ...barProps
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <ListPaginationBar {...barProps} className={barClassName} />
      {children}
      <ListPaginationBar {...barProps} className={barClassName} />
    </div>
  );
}
