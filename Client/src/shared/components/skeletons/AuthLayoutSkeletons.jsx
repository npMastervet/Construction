import { Skeleton } from "@/components/ui/skeleton";

/** Matches Login card: logo + title block + button area */
export function LoginPageSkeleton() {
  return (
    <div
      className="rounded-2xl border bg-card shadow-xl p-8 space-y-8"
      aria-hidden
    >
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Skeleton className="h-16 w-16 md:h-20 md:w-20 rounded-2xl shrink-0" />
        </div>
        <div className="space-y-3 px-2">
          <Skeleton className="h-8 w-[85%] max-w-[280px] mx-auto" />
          <Skeleton className="h-4 w-full max-w-[220px] mx-auto" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-3 w-2/3 mx-auto" />
      </div>
    </div>
  );
}

/** Matches Main card: headline + copy + CTA */
export function MainPageSkeleton() {
  return (
    <div
      className="w-full max-w-lg rounded-2xl border bg-card shadow-xl p-8 text-center space-y-4"
      aria-hidden
    >
      <div className="flex justify-center">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
      <Skeleton className="h-9 w-48 mx-auto" />
      <div className="space-y-2 px-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[83%] mx-auto" />
      </div>
      <div className="pt-2 flex justify-center">
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
    </div>
  );
}
