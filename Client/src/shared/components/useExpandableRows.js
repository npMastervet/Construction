import { useMemo, useState } from "react";

/**
 * useExpandableRows — จำกัดจำนวนแถวที่แสดงในตาราง/ลิสต์ พร้อม toggle ขยาย/ย่อ (inline)
 *
 * **มาตรฐานของโปรเจกต์** สำหรับ pattern "ดูทั้งหมด / ย่อ" — ใช้ slice แทน Collapsible
 * เพื่อให้ใช้กับ <tbody> ได้โดยไม่ทำลายโครงสร้างตาราง คู่มาตรฐานคือ `<ShowMoreButton from={...} />`
 *
 * ```jsx
 * const recent = useExpandableRows(items);          // default limit = 5
 * // …
 * <TableBody>
 *   {recent.visible.map((row) => <TableRow ...>...</TableRow>)}
 * </TableBody>
 * </Table>
 * <ShowMoreButton from={recent} />
 * ```
 *
 * @param {Array}  items - ข้อมูลทั้งหมด
 * @param {number} [limit=5] - จำนวนแถวที่แสดงเริ่มต้น
 * @returns {{ visible: Array, expanded: boolean, toggle: () => void, hiddenCount: number, canExpand: boolean }}
 */
export function useExpandableRows(items = [], limit = 5) {
  const [expanded, setExpanded] = useState(false);

  const list = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const visible = useMemo(
    () => (expanded ? list : list.slice(0, limit)),
    [list, expanded, limit]
  );

  const hiddenCount = Math.max(0, list.length - limit);

  return {
    visible,
    expanded,
    toggle: () => setExpanded((v) => !v),
    hiddenCount,
    canExpand: hiddenCount > 0,
  };
}
