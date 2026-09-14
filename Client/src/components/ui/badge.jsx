import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { badgeVariants } from "./badge-variants"

function Badge({
  className,
  variant,
  ...props
}) {
  return (<span className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge }
