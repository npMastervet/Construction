import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/shared/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DIALOG_CONTENT_LAYOUT = [
  "fixed z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg",
  // Desktop — centered modal (scoped to md+ so mobile bottom-sheet never inherits left-[50%])
  "md:left-[50%] md:top-[50%] md:translate-x-[-50%] md:translate-y-[-50%]",
  // Mobile — bottom sheet anchored to viewport bottom
  "max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:w-auto max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-t-2xl max-md:rounded-b-none max-md:px-5 max-md:pt-3 max-md:pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
].join(" ");

const DIALOG_CONTENT_MOTION_DEFAULT = [
  "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 md:rounded-lg",
  "md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95 md:data-[state=closed]:slide-out-to-left-1/2 md:data-[state=closed]:slide-out-to-top-[48%] md:data-[state=open]:slide-in-from-left-1/2 md:data-[state=open]:slide-in-from-top-[48%]",
  "max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom",
].join(" ");

const DIALOG_CONTENT_MOTION_FADE = [
  // Desktop fade-in via .dialog-motion-fade in index.css; mobile slide via Tailwind below
  "dialog-motion-fade md:rounded-lg",
  // useDialogFadeClose runs a programmatic fade/slide first — suppress Radix exit motion
  // so content does not snap back to full opacity and animate closed a second time
  "md:data-[state=closed]:!animate-none md:data-[state=closed]:pointer-events-none md:data-[state=closed]:opacity-0",
  "max-md:duration-300 max-md:ease-out max-md:data-[state=open]:animate-in",
  "max-md:data-[state=open]:fade-in-0 max-md:data-[state=open]:slide-in-from-bottom",
  "max-md:data-[state=closed]:!animate-none max-md:data-[state=closed]:pointer-events-none",
  "max-md:data-[state=closed]:translate-y-full max-md:data-[state=closed]:opacity-0",
].join(" ");

const DialogOverlay = React.forwardRef(({ className, motion, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=open]:fade-in-0",
      motion === "fade"
        ? "data-[state=closed]:!animate-none data-[state=closed]:opacity-0"
        : "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className
    )}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, overlayClassName, motion = "default", children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay motion={motion} className={overlayClassName} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        DIALOG_CONTENT_LAYOUT,
        motion === "fade" ? DIALOG_CONTENT_MOTION_FADE : DIALOG_CONTENT_MOTION_DEFAULT,
        className
      )}
      {...props}>
      {/* Grabber handle — mobile bottom-sheet affordance */}
      <div className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-muted md:hidden" aria-hidden />
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
