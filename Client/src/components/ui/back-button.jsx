import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({ fallback, onClick, title = "กลับ" }) {
  const navigate = useNavigate();
  const canGoBack = (window.history.state?.idx ?? 0) > 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (canGoBack) navigate(-1);
    else if (fallback) navigate(fallback);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-md border border-border"
      onClick={handleClick}
      disabled={!canGoBack && !onClick && !fallback}
      title={title}
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>
  );
}
