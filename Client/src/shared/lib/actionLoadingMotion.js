/** Fixed visual slot for action SVGs — keeps dialog body layout stable across phase changes. */
export const ACTION_ANIMATION_SLOT_CLASS = "h-28 w-28";

/** Fixed height for title + description block so copy crossfades without shifting content below. */
export const ACTION_LOADING_COPY_HEIGHT_CLASS = "h-[4.75rem] overflow-hidden";

/**
 * Floor height for the whole dialog body so the modal stays a stable size across a session —
 * it never shrinks below this when a phase has less content (loading vs upload vs result).
 */
export const ACTION_LOADING_BODY_MIN_HEIGHT_CLASS = "min-h-[19rem]";

/** Ceiling so the fixed body never overflows short / landscape mobile viewports (scrolls instead). */
export const ACTION_LOADING_BODY_MAX_HEIGHT_CLASS = "max-h-[calc(100dvh-2rem)] overflow-y-auto";

/** Reserved height for the upload-progress area so it fades in/out without reflowing the body. */
export const ACTION_LOADING_PROGRESS_SLOT_CLASS = "h-11";

export const actionPhaseFadeTransition = {
  duration: 0.32,
  ease: "easeInOut",
};

export const actionPhaseFadeMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: actionPhaseFadeTransition,
};
