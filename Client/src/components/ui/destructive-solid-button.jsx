import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

/**
 * ปุ่ม destructive แบบพื้นแดง / ตัวอักษรขาว — สไตล์คงที่ทั้ง light/dark
 * ปรับสีร่วมที่ `shared/lib/destructiveButtonStyles.js` (ผ่าน variant `destructiveSolid`)
 */
export const DestructiveSolidButton = React.forwardRef(
  ({ className, variant: _variant, ...props }, ref) => (
    <Button
      ref={ref}
      variant="destructiveSolid"
      className={cn(className)}
      {...props}
    />
  ),
);
DestructiveSolidButton.displayName = "DestructiveSolidButton";
