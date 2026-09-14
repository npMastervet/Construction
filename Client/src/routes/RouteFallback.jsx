import { Loader2 } from "lucide-react";

/**
 * Content-area fallback for lazy route chunks.
 * Intentionally small: it renders inside the authenticated Layout's <main>,
 * so the sidebar/top bar stay mounted while a route chunk loads.
 */
export default function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
