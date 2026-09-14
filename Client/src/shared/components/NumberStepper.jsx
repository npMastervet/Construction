import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/shared/lib/utils"

/**
 * NumberStepper — ช่องกรอกตัวเลข พร้อมปุ่มลูกศรขึ้น/ลงแบบกำหนดเอง (สไตล์ shadcn)
 *
 * ดีฟอลต์รับเฉพาะ "จำนวนเต็ม" (ห้ามทศนิยม); ตั้ง `decimals` > 0 เพื่อรับทศนิยมตามจำนวนตำแหน่ง
 * และ clamp ให้อยู่ในช่วง [min, max]
 * - ปิดปุ่มลูกศร native ของเบราว์เซอร์ แล้วแทนด้วยปุ่ม ChevronUp/ChevronDown
 * - clamp เพดานสูงสุดตอนพิมพ์ (กันค่าเกิน max) แต่ clamp ขั้นต่ำตอน blur
 *   เพื่อให้พิมพ์ค่าที่มีหลายหลัก/ค่าขั้นต่ำสูง (เช่น ปี ค.ศ. 1960) ได้ลื่น
 * - โหมดทศนิยม: onChange อาจส่งค่า "ระหว่างพิมพ์" เป็น string (เช่น "42.") — parse ตอนใช้งานเอง
 *
 * Props:
 *   value: number | string | ""   ค่าปัจจุบัน ("" = ว่าง)
 *   onChange: (next: number | string | "") => void
 *   min?: number                  ค่าต่ำสุด (default 0)
 *   max?: number                  ค่าสูงสุด (optional)
 *   step?: number                 ระยะก้าวของปุ่มลูกศร (default 1)
 *   decimals?: number             จำนวนตำแหน่งทศนิยมที่รับ (default 0 = จำนวนเต็มเท่านั้น)
 *   disabled?: boolean
 *   readOnly?: boolean
 *   placeholder?: string
 *   className?: string            class ของกรอบครอบ (เช่น override ความกว้าง)
 *   inputClassName?: string       class เพิ่มเติมของ <input>
 *   id?: string
 *   ...rest                       props อื่น ๆ ที่จะส่งต่อให้ <input>
 */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  decimals = 0,
  disabled = false,
  readOnly = false,
  placeholder,
  className,
  inputClassName,
  id,
  onKeyDown: onKeyDownProp,
  onBlur: onBlurProp,
  ...rest
}) {
  const hasMax = typeof max === "number"
  const allowsDecimals = Number.isInteger(decimals) && decimals > 0
  const parsed = value === "" || value == null ? NaN : Number(value)
  const current = Number.isFinite(parsed) ? parsed : null

  const interactive = !disabled && !readOnly
  const canInc = interactive && (current == null || !hasMax || current < max)
  const canDec = interactive && (current == null || current > min)

  const roundToDecimals = (n) => (allowsDecimals ? Number(n.toFixed(decimals)) : n)

  const stepBy = (dir) => {
    if (!interactive) return
    let next = current == null ? min : roundToDecimals(current + dir * step)
    if (next < min) next = min
    if (hasMax && next > max) next = max
    onChange(next)
  }

  const handleChange = (e) => {
    const raw = e.target.value
    if (raw === "") {
      onChange("")
      return
    }
    if (allowsDecimals) {
      // รับตัวเลข + จุดทศนิยมเดียว จำกัดจำนวนตำแหน่ง — ส่งเป็น string ระหว่างพิมพ์ (เช่น "42.")
      const sanitized = raw.replace(/[^\d.]/g, "")
      const match = sanitized.match(new RegExp(`^(\\d*)(\\.(\\d{0,${decimals}})?)?`))
      const text = match ? `${match[1]}${match[2] ?? ""}` : ""
      if (text === "" || text === ".") {
        onChange("")
        return
      }
      const n = Number(text)
      if (hasMax && Number.isFinite(n) && n > max) {
        onChange(max)
        return
      }
      onChange(text)
      return
    }
    // ตัดอักขระที่ไม่ใช่ตัวเลขทิ้ง (กันการ paste ทศนิยม/ตัวอักษร)
    const digits = raw.replace(/\D/g, "")
    if (digits === "") {
      onChange("")
      return
    }
    let n = parseInt(digits, 10)
    // clamp เฉพาะเพดานสูงสุดตอนพิมพ์ (ไม่ clamp ขั้นต่ำ เพื่อให้พิมพ์หลายหลักได้)
    if (hasMax && n > max) n = max
    onChange(n)
  }

  const handleKeyDown = (e) => {
    // ห้ามเลขยกกำลัง / เครื่องหมาย; จุดทศนิยมห้ามเฉพาะโหมดจำนวนเต็ม
    const blocked = allowsDecimals ? [",", "e", "E", "+", "-"] : [".", ",", "e", "E", "+", "-"]
    if (blocked.includes(e.key)) {
      e.preventDefault()
    }
    onKeyDownProp?.(e)
  }

  const handleBlur = (e) => {
    if (current != null && current < min) {
      onChange(min)
    } else if (allowsDecimals && current != null) {
      // จบการพิมพ์: normalize ค่า string ค้าง (เช่น "42.") ให้เป็นตัวเลขสวย
      onChange(roundToDecimals(current))
    }
    onBlurProp?.(e)
  }

  return (
    <div
      className={cn(
        "flex h-9 max-md:h-11 w-full items-center overflow-hidden rounded-md border border-input",
        "bg-transparent shadow-sm transition-colors",
        "focus-within:outline-none focus-within:ring-1 focus-within:ring-ring",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input
        id={id}
        type={allowsDecimals ? "text" : "number"}
        inputMode={allowsDecimals ? "decimal" : "numeric"}
        min={min}
        max={hasMax ? max : undefined}
        step={step}
        value={value ?? ""}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        {...rest}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          "h-full w-full min-w-0 bg-transparent px-3 py-1 text-base md:text-sm",
          "tabular-nums placeholder:text-muted-foreground",
          "focus-visible:outline-none disabled:cursor-not-allowed",
          // ซ่อนปุ่มลูกศรเริ่มต้นของเบราว์เซอร์
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          inputClassName
        )}
      />
      <div className="flex h-full flex-col border-l border-input">
        <button
          type="button"
          tabIndex={-1}
          aria-label="เพิ่มค่า"
          disabled={!canInc}
          onClick={() => stepBy(1)}
          className={cn(
            "flex flex-1 items-center justify-center px-1.5 text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "disabled:pointer-events-none disabled:opacity-40"
          )}
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="ลดค่า"
          disabled={!canDec}
          onClick={() => stepBy(-1)}
          className={cn(
            "flex flex-1 items-center justify-center border-t border-input px-1.5 text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "disabled:pointer-events-none disabled:opacity-40"
          )}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
