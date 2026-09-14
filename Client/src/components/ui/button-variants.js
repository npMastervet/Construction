import { cva } from "class-variance-authority";
import { DESTRUCTIVE_SOLID_BUTTON_CLASS } from "@/shared/lib/destructiveButtonStyles";

// แยกออกจาก button.jsx เพื่อให้ไฟล์ component export เฉพาะ component (React Fast Refresh)
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 max-md:[&_svg]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        destructiveSolid: DESTRUCTIVE_SOLID_BUTTON_CLASS,
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 max-md:h-11 max-md:px-5 max-md:text-base",
        sm: "h-8 rounded-md px-3 text-xs max-md:h-10 max-md:px-4 max-md:text-sm",
        lg: "h-10 rounded-md px-8 max-md:h-12",
        icon: "h-9 w-9 max-md:h-11 max-md:w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
