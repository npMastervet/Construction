export const ACTION_LOADING_PHASES = Object.freeze({
  LOADING: "loading",
  PROCESSING: "processing",
  SAVING: "saving",
  SENDING: "sending",
  RESENDING: "resending",
  SUBMITTING: "submitting",
  UPLOADING: "uploading",
  SUCCESS: "success",
  FAIL: "fail",
});

export const ACTION_LOADING_SUCCESS_PHASE = ACTION_LOADING_PHASES.SUCCESS;
export const ACTION_LOADING_FAIL_PHASE = ACTION_LOADING_PHASES.FAIL;
export const ACTION_RESULT_ANIMATION_MS = 2000;
/** Minimum time to show action-loading.svg before switching to the action SVG. */
export const ACTION_LOADING_INITIAL_MS = 650;
/** Minimum time to keep the action phase visible so it doesn't flash on fast networks. */
export const ACTION_MIN_LOADING_MS = 1500;

export function isActionLoadingSuccessPhase(phase) {
  return phase === ACTION_LOADING_SUCCESS_PHASE;
}

export function isActionLoadingFailPhase(phase) {
  return phase === ACTION_LOADING_FAIL_PHASE;
}

export function isActionLoadingResultPhase(phase) {
  return isActionLoadingSuccessPhase(phase) || isActionLoadingFailPhase(phase);
}

export function isActionLoadingInitialPhase(phase) {
  return phase === ACTION_LOADING_PHASES.LOADING;
}

/** Map dialog phase → action SVG variant (loading | create | send | …). */
export function getActionAnimationVariant(phase) {
  switch (phase) {
    case ACTION_LOADING_PHASES.SUCCESS:
      return "success";
    case ACTION_LOADING_PHASES.FAIL:
      return "fail";
    case ACTION_LOADING_PHASES.SAVING:
    case ACTION_LOADING_PHASES.UPLOADING:
      return "create";
    case ACTION_LOADING_PHASES.SENDING:
    case ACTION_LOADING_PHASES.SUBMITTING:
      return "send";
    case ACTION_LOADING_PHASES.RESENDING:
      return "resend";
    case ACTION_LOADING_PHASES.LOADING:
    case ACTION_LOADING_PHASES.PROCESSING:
    default:
      return "loading";
  }
}

export function waitForActionLoadingIntro(ms = ACTION_LOADING_INITIAL_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Resolve after at least `minMs` has elapsed since `startedAt` (keeps loaders from flashing). */
export function waitForMinimum(startedAt, minMs = ACTION_MIN_LOADING_MS) {
  const elapsed = Date.now() - startedAt;
  return sleep(Math.max(0, minMs - elapsed));
}
