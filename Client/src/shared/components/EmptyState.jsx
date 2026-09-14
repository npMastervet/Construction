import { cn } from "@/shared/lib/utils";

/**
 * Shared empty-state block for lists/tables/sections — replaces the ad-hoc
 * "no results" markup that varied per page. Place it inside a <DataFade> on
 * list pages so it crossfades with the data.
 *
 * @param {React.ComponentType} [icon]  lucide icon component
 * @param {ReactNode} title             main line (e.g. "ไม่มีข้อมูล")
 * @param {ReactNode} [description]     optional secondary line
 * @param {ReactNode} [action]          optional button/link
 * @param {string} [className]
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground",
        className
      )}
    >
      {Icon && <Icon className="h-8 w-8 opacity-20" aria-hidden />}
      {title && <p className="text-sm font-medium">{title}</p>}
      {description && <p className="text-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
