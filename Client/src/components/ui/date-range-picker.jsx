import * as React from "react"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/shared/lib/utils"

// ─── Date helpers ─────────────────────────────────────────────────────────────

function isoToDate(str) {
  if (!str) return null
  const [y, m, d] = str.split("-").map(Number)
  return new Date(y, m - 1, d)
}
function dateToIso(date) {
  if (!date) return ""
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}
function normalizeHolidayIso(value) {
  if (typeof value !== "string" || !value) return ""
  const isoDatePart = value.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDatePart)) return isoDatePart
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return dateToIso(parsed)
}
function sameDay(a, b) {
  return a && b && a.toDateString() === b.toDateString()
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1)
}
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

// วันที่ "ไม่นับวันลา" ตาม workMode + holidays
function isNonWorking(date, holidaySet, workMode) {
  const dow = date.getDay()
  if (dow === 0) return true                               // อาทิตย์ เสมอ
  if (dow === 6 && workMode === "MON_FRI") return true     // เสาร์ + MON_FRI
  if (holidaySet.has(dateToIso(date))) return true         // วันหยุดนักขัตฤกษ์
  return false
}

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]
const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

function formatDisplay(from, to) {
  if (!from) return "เลือกช่วงวันที่"
  const opts = { day: "numeric", month: "short", year: "numeric" }
  const f = isoToDate(from)?.toLocaleDateString("th-TH", opts) ?? from
  if (!to || from === to) return f
  const t = isoToDate(to)?.toLocaleDateString("th-TH", opts) ?? to
  return `${f} – ${t}`
}

// ─── Single month grid ────────────────────────────────────────────────────────

function MonthGrid({
  year, month,
  startDate, endDate, hoverDate,
  onDayClick, onDayHover,
  holidaySet, holidayMap, workMode,
  disabledSet, disabledMap, disableSundays,
}) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = getDaysInMonth(year, month)

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const rangeEnd = endDate ?? hoverDate

  const headerCols = WEEKDAYS.map((w, i) => {
    const isSunday = i === 0
    const isNonWorkCol = isSunday || (i === 6 && workMode === "MON_FRI")
    return (
      <div
        key={w}
        className={cn(
          "text-center text-[0.75rem] font-normal py-1 select-none",
          isSunday && disableSundays
            ? "text-red-400/70"
            : isNonWorkCol
              ? "text-muted-foreground/50"
              : "text-muted-foreground"
        )}
      >
        {w}
      </div>
    )
  })

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 mb-1">{headerCols}</div>

      <div className="grid grid-cols-7">
        {cells.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} />

          const iso         = dateToIso(date)
          const isStart     = sameDay(date, startDate)
          const isEnd       = sameDay(date, endDate)
          const isToday     = sameDay(date, new Date())
          const isHovered   = !endDate && sameDay(date, hoverDate)
          const nonWorking  = isNonWorking(date, holidaySet, workMode)
          const holidayName = holidayMap.get(iso) ?? null
          const isDisabled  = disabledSet.has(iso) || (disableSundays && date.getDay() === 0)
          const disabledName = disabledMap.get(iso) ?? null

          let inRange = false, isRangeStart = false, isRangeEnd = false
          if (startDate && rangeEnd) {
            const lo = startDate <= rangeEnd ? startDate : rangeEnd
            const hi = startDate <= rangeEnd ? rangeEnd : startDate
            inRange      = date > lo && date < hi
            isRangeStart = sameDay(date, lo)
            isRangeEnd   = sameDay(date, hi)
          }

          const cellBg = cn(
            !isDisabled && inRange      && "bg-accent",
            !isDisabled && isRangeStart && !sameDay(startDate, rangeEnd) && "bg-accent rounded-l-full",
            !isDisabled && isRangeEnd   && !sameDay(startDate, rangeEnd) && "bg-accent rounded-r-full",
          )

          const btnStyle = cn(
            "h-9 w-9 mx-auto flex items-center justify-center rounded-full text-sm transition-colors select-none relative",
            isDisabled ? "cursor-not-allowed" : "cursor-pointer",
            // disabled — grayed out, can't select
            isDisabled && !isStart && !isEnd && "text-muted-foreground/40",
            // non-working (not disabled): grayed out
            !isDisabled && nonWorking && !isStart && !isEnd && "text-muted-foreground/50",
            // start / end — primary
            (isStart || isEnd) && !isDisabled && "bg-primary text-primary-foreground font-semibold hover:bg-primary/90",
            // hover preview
            !isDisabled && isHovered && !isStart && "bg-accent text-accent-foreground",
            // plain day hover
            !isDisabled && !isStart && !isEnd && !inRange && !isHovered && "hover:bg-accent hover:text-accent-foreground",
            // in-range
            !isDisabled && inRange && !isStart && !isEnd && "bg-transparent text-foreground hover:bg-accent/70",
            // today
            isToday && !isStart && !isEnd && "font-bold underline",
          )

          const titleText = isDisabled
            ? (disabledName
                ? `${disabledName} (ไม่สามารถเลือกได้)`
                : disableSundays && date.getDay() === 0
                  ? "วันอาทิตย์ — ไม่สามารถเพิ่มวันหยุดได้"
                  : "ไม่สามารถเลือกได้")
            : (holidayName ?? undefined)

          return (
            <div key={iso} className={cn("p-0", cellBg)}>
              <div
                className={btnStyle}
                onClick={() => !isDisabled && onDayClick(date)}
                onMouseEnter={() => !isDisabled && onDayHover(date)}
                onMouseLeave={() => onDayHover(null)}
                title={titleText}
              >
                {date.getDate()}
                {/* วันหยุดที่มีอยู่แล้ว (disabledDates): จุดแดง */}
                {isDisabled && disabledSet.has(iso) && !isStart && !isEnd && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
                )}
                {/* วันหยุดนักขัตฤกษ์ (holidays): จุดเหลือง */}
                {!isDisabled && holidayName && !isStart && !isEnd && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main DateRangePicker ─────────────────────────────────────────────────────

/**
 * Props:
 *   value:         { from: string, to: string }  — ISO "YYYY-MM-DD"
 *   onChange:      ({ from: string, to: string }) => void
 *   holidays?:     (string | { date: string, name?: string })[]  — yellow dot, visually non-working
 *   disabledDates?: (string | { date: string, name?: string })[]  — red dot, cannot be selected
 *   disableSundays?: boolean  — Sundays cannot be selected (column header turns red)
 *   workMode?:     "MON_FRI" | "MON_SAT" | "MON_SAT_HALF" | null
 *   disabled?:     boolean
 *   className?:    string
 *   error?:        boolean
 *   single?:       boolean  — เลือกวันเดียวแล้วปิดทันที
 *   portalContainer?: HTMLElement | null
 *   yearFrom?:      number  — ปีเริ่มใน dropdown (default: ปีปัจจุบัน − 30)
 *   yearTo?:        number  — ปีสิ้นสุดใน dropdown (default: ปีปัจจุบัน + 1)
 */
export function DateRangePicker({
  value, onChange,
  holidays, workMode,
  disabledDates, disableSundays = false,
  disabled, className, error, single = false, portalContainer = null,
  yearFrom, yearTo,
}) {
  const [open, setOpen]           = React.useState(false)
  const [viewMonth, setViewMonth] = React.useState(() => startOfMonth(new Date()))
  const [step, setStep]           = React.useState("start")
  const [startDate, setStart]     = React.useState(null)
  const [hoverDate, setHover]     = React.useState(null)

  // Build Set + Map from holidays prop — O(1) lookup
  const { holidaySet, holidayMap } = React.useMemo(() => {
    const set = new Set()
    const map = new Map()
    ;(holidays ?? []).forEach((h) => {
      if (typeof h === "string") {
        const iso = normalizeHolidayIso(h)
        if (iso) set.add(iso)
      } else if (h?.date) {
        const iso = normalizeHolidayIso(h.date)
        if (!iso) return
        set.add(iso)
        if (h.name) map.set(iso, h.name)
      }
    })
    return { holidaySet: set, holidayMap: map }
  }, [holidays])

  // Build Set + Map from disabledDates prop — dates that cannot be selected
  const { disabledSet, disabledMap } = React.useMemo(() => {
    const set = new Set()
    const map = new Map()
    ;(disabledDates ?? []).forEach((h) => {
      if (typeof h === "string") {
        const iso = normalizeHolidayIso(h)
        if (iso) set.add(iso)
      } else if (h?.date) {
        const iso = normalizeHolidayIso(h.date)
        if (!iso) return
        set.add(iso)
        if (h.name) map.set(iso, h.name)
      }
    })
    return { disabledSet: set, disabledMap: map }
  }, [disabledDates])

  function isDateDisabled(date) {
    return disabledSet.has(dateToIso(date)) || (disableSundays && date.getDay() === 0)
  }

  function handleOpen(isOpen) {
    if (isOpen) {
      setStep("start")
      setStart(null)
      setHover(null)
      const seed = value?.from ? isoToDate(value.from) : null
      if (seed) setViewMonth(startOfMonth(seed))
      else setViewMonth(startOfMonth(new Date()))
    }
    setOpen(isOpen)
  }

  function handleDayClick(date) {
    if (isDateDisabled(date)) return
    if (single) {
      const iso = dateToIso(date)
      onChange({ from: iso, to: iso })
      setOpen(false)
      return
    }
    if (step === "start") {
      setStart(date)
      setStep("end")
    } else {
      if (!startDate || sameDay(date, startDate)) {
        const iso = dateToIso(date)
        onChange({ from: iso, to: iso })
        setOpen(false)
        return
      }
      const from = startDate <= date ? startDate : date
      const to   = startDate <= date ? date : startDate
      onChange({ from: dateToIso(from), to: dateToIso(to) })
      setOpen(false)
    }
  }

  function handleDayHover(date) {
    if (step === "end") setHover(date)
  }

  const yearOptions = React.useMemo(() => {
    const cur = new Date().getFullYear()
    const to = yearTo ?? cur + 1
    const from = yearFrom ?? to - 31
    const span = Math.max(1, to - from + 1)
    return Array.from({ length: span }, (_, i) => from + i)
  }, [yearFrom, yearTo])

  const viewMonth2 = addMonths(viewMonth, 1)
  const gridProps  = {
    holidaySet, holidayMap, workMode: workMode ?? null,
    disabledSet, disabledMap, disableSundays,
  }

  const showDisabledLegend = disabledSet.size > 0 || disableSundays

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value?.from && "text-muted-foreground",
            error && "border-red-500",
            className
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
          {value?.from ? formatDisplay(value?.from, value?.to) : (single ? "เลือกวันที่" : "เลือกช่วงวันที่")}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        container={portalContainer}
        className="w-auto p-4 select-none"
        align="start"
        onMouseLeave={() => setHover(null)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="text-xs text-muted-foreground mb-3 text-center">
          {single ? "เลือกวันที่" : (step === "start" ? "เลือกวันเริ่มต้น" : "เลือกวันสิ้นสุด")}
        </p>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 px-1 text-[0.7rem] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            วันหยุด
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-2 rounded inline-block bg-muted-foreground/20" />
            ไม่นับวันลา
          </span>
          {showDisabledLegend && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              ไม่สามารถเลือกได้
            </span>
          )}
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          {/* Month 1 */}
          <div className="w-[224px]">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="outline" size="icon"
                className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 select-none">
                <span className="text-sm font-medium">
                  {MONTHS_TH[viewMonth.getMonth()]}
                </span>
                <Select
                  value={String(viewMonth.getFullYear())}
                  onValueChange={(val) =>
                    setViewMonth(new Date(Number(val), viewMonth.getMonth(), 1))
                  }
                >
                  <SelectTrigger className="h-7 w-[5.5rem] text-sm font-medium px-2 py-0 border-none shadow-none focus:ring-0 hover:bg-accent rounded">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y + 543}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {single ? (
                <Button
                  variant="outline" size="icon"
                  className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                  onClick={() => setViewMonth((m) => addMonths(m, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <div className="h-7 w-7" />
              )}
            </div>
            <MonthGrid
              year={viewMonth.getFullYear()} month={viewMonth.getMonth()}
              startDate={startDate} endDate={null}
              hoverDate={hoverDate}
              onDayClick={handleDayClick} onDayHover={handleDayHover}
              {...gridProps}
            />
          </div>

          {/* Month 2 — ซ่อนเมื่อ single mode */}
          {!single && <div className="w-[224px]">
            <div className="flex items-center justify-between mb-2">
              <div className="h-7 w-7" />
              <span className="text-sm font-medium select-none">
                {MONTHS_TH[viewMonth2.getMonth()]} {viewMonth2.getFullYear() + 543}
              </span>
              <Button
                variant="outline" size="icon"
                className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <MonthGrid
              year={viewMonth2.getFullYear()} month={viewMonth2.getMonth()}
              startDate={startDate} endDate={null}
              hoverDate={hoverDate}
              onDayClick={handleDayClick} onDayHover={handleDayHover}
              {...gridProps}
            />
          </div>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
