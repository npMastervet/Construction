import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shared loading skeleton for table-based list pages (promoted from the copy
 * pasted version in MyLeaveRequestsPage). Renders a header row from `columns`
 * and `rows` placeholder rows.
 *
 * @param {Array<ReactNode>} columns  header labels (one <TableHead> each)
 * @param {number} [rows=5]
 * @param {string} [className]        forwarded to the wrapper
 */
export function TableSkeleton({ columns = [], rows = 5, className = "" }) {
  return (
    <div
      className={`rounded-md border overflow-x-auto min-h-[220px] ${className}`}
      aria-busy="true"
    >
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((h, i) => (
              <TableHead key={i}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {columns.map((_, c) => (
                <TableCell key={c}>
                  <Skeleton className="h-4 w-full max-w-[100px]" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TableSkeleton;
