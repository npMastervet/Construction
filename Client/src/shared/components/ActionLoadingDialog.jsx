import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, CheckCircle2, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ActionStatusAnimation from "@/shared/components/ActionStatusAnimation";
import { cn, APP_LOGO_URL, APP_NAME } from "@/shared/lib/utils";
import {
  ACTION_LOADING_PHASES,
  getActionAnimationVariant,
  isActionLoadingFailPhase,
  isActionLoadingInitialPhase,
  isActionLoadingResultPhase,
  isActionLoadingSuccessPhase,
} from "@/shared/lib/actionLoadingPhases";
import {
  ACTION_LOADING_BODY_MAX_HEIGHT_CLASS,
  ACTION_LOADING_BODY_MIN_HEIGHT_CLASS,
  ACTION_LOADING_COPY_HEIGHT_CLASS,
  ACTION_LOADING_PROGRESS_SLOT_CLASS,
  actionPhaseFadeMotion,
  actionPhaseFadeTransition,
} from "@/shared/lib/actionLoadingMotion";
import { DEFAULT_ACTION_LOADING_COPY } from "@/shared/lib/actionLoadingPresets";

function StepIndicator({ phase, steps = [], failedPhase = null }) {
  if (steps.length === 0) return null;

  const isFail = isActionLoadingFailPhase(phase);
  // On fail, mark the step that was in progress (fallback: the last step) as errored,
  // so completed steps stay done and later steps stay pending — never all-green ✓.
  const failedIndex = (() => {
    if (!isFail) return -1;
    const idx = failedPhase ? steps.findIndex((step) => step.key === failedPhase) : -1;
    return idx >= 0 ? idx : steps.length - 1;
  })();

  const resultIndex = steps.length;
  const phaseIndex = steps.findIndex((step) => step.key === phase);
  const activeIndex = isFail
    ? failedIndex
    : isActionLoadingSuccessPhase(phase)
      ? resultIndex
      : isActionLoadingInitialPhase(phase)
        ? -1
        : Math.max(phaseIndex, 0);

  return (
    <div className="flex w-full items-center justify-center gap-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isError = isFail && index === failedIndex;
        const isDone = index < activeIndex;
        const isActive = index === activeIndex && !isError;

        return (
          <motion.div
            key={step.key}
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, ...actionPhaseFadeTransition }}
          >
            {index > 0 && (
              <motion.div
                className={cn(
                  "h-px w-8 sm:w-12",
                  isError
                    ? "bg-red-400"
                    : isDone || isActive
                      ? "bg-primary"
                      : "bg-muted"
                )}
                initial={{ scaleX: 0, opacity: 0.5 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              />
            )}
            <motion.div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-300",
                isError && "bg-red-500/10 text-red-600 ring-1 ring-red-500/20 dark:text-red-400",
                isActive && "bg-primary/10 text-primary ring-1 ring-primary/20",
                isDone && "bg-primary/5 text-primary",
                !isActive && !isDone && !isError && "bg-muted/50 text-muted-foreground"
              )}
              animate={isActive ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={
                isActive
                  ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.25, ease: "easeInOut" }
              }
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                  isError && "bg-red-500 text-white",
                  isActive && "bg-primary text-primary-foreground",
                  isDone && "bg-primary/80 text-primary-foreground",
                  !isActive && !isDone && !isError && "bg-muted text-muted-foreground"
                )}
              >
                {isError ? (
                  <X className="h-3 w-3" />
                ) : isDone ? (
                  <Check className="h-3 w-3" />
                ) : isActive ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : Icon ? (
                  <Icon className="h-3 w-3" />
                ) : null}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function ActionLoadingDialog({
  open,
  phase = "loading",
  animationVariant: animationVariantOverride,
  copy,
  phaseIcons = {},
  defaultIcon: DefaultIcon = Loader2,
  successIcon: SuccessIcon = CheckCircle2,
  failIcon: FailIcon = AlertTriangle,
  steps = [],
  summary,
  progress,
  footerNote,
  bodyMinHeightClass = ACTION_LOADING_BODY_MIN_HEIGHT_CLASS,
}) {
  const isSuccess = isActionLoadingSuccessPhase(phase);
  const isFail = isActionLoadingFailPhase(phase);
  const isResult = isActionLoadingResultPhase(phase);
  const isInitial = isActionLoadingInitialPhase(phase);

  // Remember the last in-progress (action) phase so a FAIL result can point the
  // StepIndicator at the step that was actually running when it failed.
  const lastActionPhaseRef = useRef(null);
  useEffect(() => {
    if (!open) {
      lastActionPhaseRef.current = null;
    } else if (!isInitial && !isResult) {
      lastActionPhaseRef.current = phase;
    }
  }, [open, phase, isInitial, isResult]);
  const Icon = isInitial
    ? Loader2
    : phaseIcons[phase] ?? (isFail ? FailIcon : isSuccess ? SuccessIcon : DefaultIcon);
  const animationVariant = animationVariantOverride ?? getActionAnimationVariant(phase);
  const contentFadeKey = `${phase}:${animationVariant}`;
  const activeCopy =
    copy?.[phase] ??
    DEFAULT_ACTION_LOADING_COPY[phase] ??
    copy?.loading ??
    copy?.submitting ??
    DEFAULT_ACTION_LOADING_COPY.loading;
  const defaultFooterNote = isFail
    ? "กรุณาตรวจสอบข้อมูลหรือลองใหม่อีกครั้ง"
    : isSuccess
      ? "โปรดรอสักครู่..."
      : "กรุณาอย่าปิดหน้าต่างนี้จนกว่าจะเสร็จสิ้น";

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <motion.div
            className={cn(
              "absolute inset-x-0 top-0 h-1 transition-colors duration-500 ease-in-out",
              isFail
                ? "bg-gradient-to-r from-red-400/60 via-red-500 to-red-400/60"
                : isSuccess
                  ? "bg-gradient-to-r from-emerald-400/60 via-emerald-500 to-emerald-400/60"
                  : "bg-gradient-to-r from-primary/40 via-primary to-primary/40"
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: isResult ? 0.45 : 0.65, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
          />

          <div
            className={cn(
              "relative flex flex-col items-center justify-center gap-5 px-6 pb-6 pt-8 text-center",
              bodyMinHeightClass,
              ACTION_LOADING_BODY_MAX_HEIGHT_CLASS
            )}
          >
            {APP_LOGO_URL && (
              <motion.img
                src={APP_LOGO_URL}
                alt={APP_NAME}
                className="h-10 w-10 shrink-0 object-contain dark:brightness-0 dark:invert"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05, ...actionPhaseFadeTransition }}
              />
            )}

            <ActionStatusAnimation
              variant={animationVariant}
              label={activeCopy.title}
              fallbackIcon={Icon}
            />

            <DialogHeader className="w-full items-center space-y-0 text-center sm:text-center">
              <div className={cn("relative w-full", ACTION_LOADING_COPY_HEIGHT_CLASS)}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={contentFadeKey}
                    className="absolute inset-x-0 top-0 space-y-2"
                    {...actionPhaseFadeMotion}
                  >
                    <DialogTitle
                      className={cn(
                        "text-xl font-semibold tracking-tight transition-colors duration-300",
                        isSuccess && "text-emerald-700 dark:text-emerald-400",
                        isFail && "text-red-700 dark:text-red-400"
                      )}
                    >
                      {activeCopy.title}
                    </DialogTitle>
                    <DialogDescription className="mx-auto max-w-xs text-sm leading-relaxed">
                      {activeCopy.description}
                    </DialogDescription>
                  </motion.div>
                </AnimatePresence>
              </div>
            </DialogHeader>

            {summary && (
              <motion.div
                className="w-full rounded-lg border bg-muted/30 px-4 py-3 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={actionPhaseFadeTransition}
              >
                {summary}
              </motion.div>
            )}

            <StepIndicator
              phase={phase}
              steps={steps}
              failedPhase={isFail ? lastActionPhaseRef.current : null}
            />

            {steps.some((step) => step.key === ACTION_LOADING_PHASES.UPLOADING) && (
              <div
                className={cn(
                  "flex w-full items-center",
                  ACTION_LOADING_PROGRESS_SLOT_CLASS
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {progress?.total > 0 && (
                    <motion.div key="progress" className="w-full space-y-2" {...actionPhaseFadeMotion}>
                      <motion.p
                        key={`${progress.current}-${progress.total}`}
                        className="text-xs tabular-nums text-muted-foreground"
                        {...actionPhaseFadeMotion}
                      >
                        {progress.label ?? "ไฟล์"} {progress.current}/{progress.total}
                      </motion.p>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={footerNote ?? defaultFooterNote}
                className="text-xs text-muted-foreground/80"
                {...actionPhaseFadeMotion}
              >
                {footerNote ?? defaultFooterNote}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
