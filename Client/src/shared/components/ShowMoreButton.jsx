import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

/**
 * ShowMoreButton — ปุ่ม footer มาตรฐานสำหรับ "ดูทั้งหมด / ย่อ" ตารางหรือลิสต์
 *
 * **มาตรฐานของโปรเจกต์:** ใช้คู่กับ `useExpandableRows` เสมอ (อย่า implement state เอง)
 *   ```jsx
 *   const recent = useExpandableRows(items, 5);
 *   // …
 *   <TableBody>
 *     {recent.visible.map(...)}
 *   </TableBody>
 *   </Table>
 *   <ShowMoreButton from={recent} />
 *   ```
 *
 * ปุ่มจะไม่ render ถ้า `hiddenCount === 0` (รายการสั้นกว่า limit) — ผู้เรียกไม่ต้องเช็คเอง
 *
 * @param {Object} props
 * @param {{ expanded: boolean, hiddenCount: number, toggle: () => void }} [props.from]
 *   ผลลัพธ์จาก useExpandableRows (canonical) — จะ derive expanded/hiddenCount/onToggle ให้
 * @param {boolean}    [props.expanded]    override (ถ้าไม่ส่ง from)
 * @param {number}     [props.hiddenCount] override (ถ้าไม่ส่ง from) — จำนวนแถวที่ถูกซ่อนตอนยุบ
 * @param {() => void} [props.onToggle]    override (ถ้าไม่ส่ง from)
 * @param {string}     [props.className]
 */
export function ShowMoreButton({
  from,
  expanded = from?.expanded,
  hiddenCount = from?.hiddenCount ?? 0,
  onToggle = from?.toggle,
  className,
}) {
  if (hiddenCount <= 0) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={cn("h-8 w-full text-xs text-muted-foreground", className)}
    >
      {expanded ? (
        <>
          ย่อ
          <ChevronUp className="ml-1 h-3.5 w-3.5" />
        </>
      ) : (
        <>
          ดูทั้งหมด (+{hiddenCount})
          <ChevronDown className="ml-1 h-3.5 w-3.5" />
        </>
      )}
    </Button>
  );
}
