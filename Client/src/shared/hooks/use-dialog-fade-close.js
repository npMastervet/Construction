import { useCallback, useEffect, useMemo, useState } from "react";

import { DIALOG_FADE_MS, dialogFadeClassNames, sleep } from "@/shared/lib/dialogFade";

/**
 * Keeps a dialog mounted while closing animation runs, then calls onClose.
 * Pair with DialogContent `motion="fade"` + returned class names from dialogFadeClassNames.
 *
 * Backdrop / outside tap: use `dismissProps` — prevents Radix instant dismiss and runs the
 * same beginClose animation as the X button (important on mobile slide-down).
 *
 * @param {() => boolean | void} [onDismissRequest] Return `false` to veto close (e.g. unsaved prompt).
 */
export function useDialogFadeClose({
  open,
  onClose,
  blockClose = false,
  onDismissRequest,
}) {
  const [mounted, setMounted] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  // Mount + clear closing state only on the `open` edge. Keeping `isClosing` out of this
  // effect's deps is critical: a user-initiated close (Cancel/X/backdrop) sets isClosing=true
  // while `open` is still true, and if this effect re-ran on that change it would immediately
  // reset isClosing=false — cancelling the fade and flashing the content back to full opacity.
  useEffect(() => {
    if (open) {
      setMounted(true);
      setIsClosing(false);
    }
  }, [open]);

  // Parent-driven close (open=false) while not animating → unmount immediately.
  // When completeClose() drives the close it keeps isClosing=true, so this is a no-op there.
  useEffect(() => {
    if (!open && !isClosing) {
      setMounted(false);
    }
  }, [open, isClosing]);

  const runCloseAnimation = useCallback(async () => {
    if (isClosing || !mounted) return;
    setIsClosing(true);
    await sleep(DIALOG_FADE_MS);
  }, [isClosing, mounted]);

  const completeClose = useCallback(() => {
    onClose();
    // Keep isClosing true — resetting it here removes opacity-0 / slide-off classes
    // one frame before Radix unmounts, which flashes the dialog content a second time.
    setMounted(false);
  }, [onClose]);

  const beginClose = useCallback(async () => {
    if (isClosing || !mounted) return;
    await runCloseAnimation();
    completeClose();
  }, [isClosing, mounted, runCloseAnimation, completeClose]);

  const requestDismiss = useCallback(() => {
    if (blockClose || isClosing || !mounted) return;
    if (onDismissRequest?.() === false) return;
    beginClose();
  }, [blockClose, isClosing, mounted, onDismissRequest, beginClose]);

  const handleOpenChange = useCallback((nextOpen) => {
    if (!nextOpen) requestDismiss();
  }, [requestDismiss]);

  const dismiss = useCallback((event) => {
    if (blockClose || isClosing) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    requestDismiss();
  }, [blockClose, isClosing, requestDismiss]);

  const dismissProps = useMemo(() => ({
    onPointerDownOutside: dismiss,
    onInteractOutside: dismiss,
    onEscapeKeyDown: dismiss,
  }), [dismiss]);

  const { overlayClassName, contentClassName } = dialogFadeClassNames(isClosing);

  return {
    dialogOpen: mounted,
    isClosing,
    beginClose,
    runCloseAnimation,
    completeClose,
    handleOpenChange,
    dismissProps,
    overlayClassName,
    contentClassName,
  };
}
