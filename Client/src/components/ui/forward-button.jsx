import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanGoForward } from "@/shared/navigation/NavigationHistoryProvider";
import { cn } from "@/shared/lib/utils";

export function ForwardButton({ title = "ไปข้างหน้า", className }) {
  const navigate = useNavigate();
  const { canGoForward } = useCanGoForward();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("rounded-md border border-border", className)}
      disabled={!canGoForward}
      onClick={() => {
        if (canGoForward) navigate(1);
      }}
      title={title}
    >
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}
