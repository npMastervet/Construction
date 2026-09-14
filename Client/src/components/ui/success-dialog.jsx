import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CheckCircle2 } from "lucide-react"

export function SuccessDialog({ open, title, description }) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-sm text-center [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-full bg-emerald-500/15 p-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" strokeWidth={1.8} />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-emerald-700 dark:text-emerald-400">{title}</p>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
