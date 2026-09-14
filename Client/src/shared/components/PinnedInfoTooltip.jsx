import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { AnimatedPing } from "@/shared/components/AnimatedPing";

export function PinnedInfoTooltip({
  children,
  ariaLabel = "ข้อมูลเพิ่มเติม",
  side = "top",
  delayDuration = 250,
  buttonClassName,
  contentClassName,
  iconClassName,
  showPing = true,
}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);
  const pinnedRef = useRef(false);

  useEffect(() => {
    pinnedRef.current = pinned;
  }, [pinned]);

  useEffect(() => {
    if (!open || !pinned) return undefined;

    function handlePointerDown(event) {
      const target = event.target;
      if (triggerRef.current?.contains(target) || contentRef.current?.contains(target)) return;
      setPinned(false);
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open, pinned]);

  function handleOpenChange(nextOpen) {
    if (!nextOpen && pinnedRef.current) return;
    setOpen(nextOpen);
    if (!nextOpen) setPinned(false);
  }

  function handleMouseEnter() {
    setOpen(true);
  }

  function handleMouseLeave() {
    if (!pinnedRef.current) setOpen(false);
  }

  function handleClick() {
    setPinned((current) => {
      const next = !current;
      setOpen(next);
      return next;
    });
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip open={open} onOpenChange={handleOpenChange}>
        <TooltipTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            className={cn(
              "relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              buttonClassName
            )}
            aria-label={ariaLabel}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          >
            {showPing && <AnimatedPing className="absolute inset-0 rounded-full bg-primary/30" />}
            <Info className={cn("relative h-3.5 w-3.5", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          ref={contentRef}
          side={side}
          className={cn(
            "max-w-[300px] border bg-popover p-3 text-left font-normal normal-case leading-snug tracking-normal text-popover-foreground shadow-md whitespace-normal [&_svg]:pointer-events-none",
            contentClassName
          )}
        >
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
