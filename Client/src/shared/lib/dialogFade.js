import { cn } from "@/shared/lib/utils";

export const DIALOG_FADE_MS = 300;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Programmatic close styles — split by breakpoint:
 * - md+ (desktop): opacity fade-out on modal + overlay
 * - max-md (mobile): slide-down (translate-y-full) + overlay fade
 */
export function dialogFadeClassNames(isClosing) {
  if (!isClosing) {
    return { overlayClassName: undefined, contentClassName: undefined };
  }

  return {
    overlayClassName: cn(
      // Desktop — fade backdrop with modal
      "md:transition-opacity md:duration-300 md:ease-out md:opacity-0",
      // Mobile — keep backdrop slightly longer so slide-down is visible on backdrop tap
      "max-md:transition-opacity max-md:duration-200 max-md:ease-out max-md:opacity-0 max-md:delay-100",
    ),
    contentClassName: cn(
      // Desktop — fade-out only (suppress Radix exit motion while we control opacity)
      "md:transition-opacity md:duration-300 md:ease-out md:opacity-0 md:!animate-none",
      // Mobile — slide down off-screen (+ slight fade)
      "max-md:!translate-y-full max-md:transform max-md:transition-all max-md:duration-300 max-md:ease-out max-md:opacity-0",
    ),
  };
}
