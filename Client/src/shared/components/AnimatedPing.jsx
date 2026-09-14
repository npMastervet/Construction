import { cn } from "@/shared/lib/utils";

export function AnimatedPing({ className }) {
  return <span aria-hidden="true" className={cn("animate-ping", className)} />;
}
