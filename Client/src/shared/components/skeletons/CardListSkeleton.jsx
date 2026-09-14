import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

/**
 * Shared loading skeleton for card-list pages (activity reports, expense
 * claims, etc.) where results are mapped cards rather than a table.
 *
 * @param {number} [count=5]
 * @param {string} [className]  forwarded to the wrapper (e.g. grid/space-y)
 */
export function CardListSkeleton({ count = 5, className = "" }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CardListSkeleton;
