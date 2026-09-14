import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import actionCreateUrl from "@/assets/actions/action-create.svg";
import actionFailUrl from "@/assets/actions/action-fail.svg";
import actionLoadingUrl from "@/assets/actions/action-loading.svg";
import actionResendUrl from "@/assets/actions/action-resend.svg";
import actionSendUrl from "@/assets/actions/action-send.svg";
import actionSuccessUrl from "@/assets/actions/action-success.svg";
import {
  ACTION_ANIMATION_SLOT_CLASS,
  actionPhaseFadeMotion,
} from "@/shared/lib/actionLoadingMotion";
import { cn } from "@/shared/lib/utils";

const ACTION_ANIMATION_URLS = {
  create: actionCreateUrl,
  fail: actionFailUrl,
  loading: actionLoadingUrl,
  resend: actionResendUrl,
  send: actionSendUrl,
  success: actionSuccessUrl,
};

export default function ActionStatusAnimation({
  variant = "loading",
  label,
  fallbackIcon: FallbackIcon = Loader2,
  className,
}) {
  const src = ACTION_ANIMATION_URLS[variant];

  return (
    <div
      className={cn(
        "relative shrink-0",
        ACTION_ANIMATION_SLOT_CLASS,
        className
      )}
      aria-hidden={false}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={variant}
          className="absolute inset-0 flex items-center justify-center"
          {...actionPhaseFadeMotion}
        >
          {src ? (
            <img
              src={src}
              alt={label ?? variant}
              className="h-full w-full select-none object-contain"
              draggable="false"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FallbackIcon className="h-7 w-7 animate-spin" />
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
