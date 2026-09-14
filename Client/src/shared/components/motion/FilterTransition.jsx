import { Loader2, Search } from "lucide-react";
import { DataFade } from "@/shared/components/motion/DataFade";

export function FilterSearchIcon({
  isSearching,
  className = "absolute left-3 top-1/2 -translate-y-1/2",
  duration = 0.15,
}) {
  return (
    <DataFade
      fadeKey={isSearching ? "searching" : "idle"}
      className={className}
      duration={duration}
    >
      {isSearching ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <Search className="h-4 w-4 text-muted-foreground" />
      )}
    </DataFade>
  );
}

export function FilterContentFade({ fadeKey, children, className = "", duration = 0.2 }) {
  return (
    <DataFade fadeKey={fadeKey} className={className} duration={duration}>
      {children}
    </DataFade>
  );
}
