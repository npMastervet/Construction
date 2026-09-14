import { CheckCircle2, RefreshCw, Send } from "lucide-react";
import ActionLoadingDialog from "@/shared/components/ActionLoadingDialog";
import { ACTION_LOADING_PHASES } from "@/shared/lib/actionLoadingPhases";
import {
  SEND_ACTION_LOADING_COPY,
  SEND_ACTION_LOADING_STEPS,
} from "@/shared/lib/actionLoadingPresets";

const SEND_PHASE_ICONS = {
  [ACTION_LOADING_PHASES.SENDING]: Send,
  [ACTION_LOADING_PHASES.RESENDING]: RefreshCw,
};

export default function SendActionLoadingDialog({
  open,
  phase = ACTION_LOADING_PHASES.SENDING,
  copy = SEND_ACTION_LOADING_COPY,
  summary,
  progress,
  footerNote,
  steps = SEND_ACTION_LOADING_STEPS,
}) {
  return (
    <ActionLoadingDialog
      open={open}
      phase={phase}
      copy={copy}
      phaseIcons={SEND_PHASE_ICONS}
      defaultIcon={Send}
      successIcon={CheckCircle2}
      steps={steps}
      summary={summary}
      progress={progress}
      footerNote={footerNote}
    />
  );
}

