import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";

const DIGIT_STRIP = Array.from({ length: 20 }, (_, index) => index % 10);
const DEFAULT_DURATION_MS = 560;
const ROLLING_DIGIT_EASING = "cubic-bezier(0.42,0.03,0.58,0.97)";

function defaultFormat(value) {
  const numeric = Number(value ?? 0);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  return safe.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function tokenizeFormatted(formatted) {
  const tokens = [];
  let digitIndexFromRight = 0;

  for (let index = formatted.length - 1; index >= 0; index -= 1) {
    const char = formatted[index];
    if (/\d/.test(char)) {
      tokens.unshift({
        char,
        key: `d-${digitIndexFromRight}`,
        isDigit: true,
      });
      digitIndexFromRight += 1;
    } else {
      tokens.unshift({
        char,
        key: `s-${index}`,
        isDigit: false,
      });
    }
  }

  return tokens;
}

function RollingDigit({
  value,
  durationMs,
  className,
}) {
  const digit = Number(value);
  const safeDigit = Number.isInteger(digit) && digit >= 0 && digit <= 9 ? digit : 0;
  const prevDigitRef = useRef(safeDigit);
  const firstRenderRef = useRef(true);
  const [offset, setOffset] = useState(safeDigit);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const prev = prevDigitRef.current;
    const next = safeDigit;

    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      prevDigitRef.current = next;
      setOffset(next);
      return;
    }

    if (prev === next) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      prevDigitRef.current = next;
      setAnimate(false);
      setOffset(next);
      return;
    }

    let target = next;
    if (next < prev) target = next + 10;

    setAnimate(true);
    setOffset(target);

    const timer = window.setTimeout(() => {
      setAnimate(false);
      setOffset(next);
      prevDigitRef.current = next;
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [durationMs, safeDigit]);

  return (
    <span
      className={cn(
        "relative inline-block h-[1em] w-[0.62em] overflow-hidden align-baseline leading-none tabular-nums",
        className
      )}
      aria-hidden
    >
      <span
        className={cn(
          "flex flex-col will-change-transform",
          animate && "transition-transform"
        )}
        style={{
          transform: `translateY(calc(-${offset} * 1em))`,
          transitionDuration: animate ? `${durationMs}ms` : undefined,
          transitionTimingFunction: animate ? ROLLING_DIGIT_EASING : undefined,
        }}
      >
        {DIGIT_STRIP.map((stripDigit, index) => (
          <span
            key={index}
            className="flex h-[1em] items-center justify-center leading-none"
          >
            {stripDigit}
          </span>
        ))}
      </span>
    </span>
  );
}

export function SlotMachineNumber({
  value,
  format = defaultFormat,
  className = "",
  durationMs = DEFAULT_DURATION_MS,
  debounceMs = 0,
}) {
  const numericValue = Number(value ?? 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const [displayValue, setDisplayValue] = useState(safeValue);

  useEffect(() => {
    if (!debounceMs || debounceMs <= 0) {
      setDisplayValue(safeValue);
      return undefined;
    }

    const timer = window.setTimeout(() => setDisplayValue(safeValue), debounceMs);
    return () => window.clearTimeout(timer);
  }, [debounceMs, safeValue]);

  const formatted = useMemo(() => format(displayValue), [displayValue, format]);
  const tokens = useMemo(() => tokenizeFormatted(formatted), [formatted]);

  return (
    <span className={cn("inline-flex items-baseline", className)} aria-label={formatted}>
      {tokens.map((token) => (
        token.isDigit ? (
          <RollingDigit
            key={token.key}
            value={Number(token.char)}
            durationMs={durationMs}
          />
        ) : (
          <span key={token.key} className="inline-block leading-none">
            {token.char}
          </span>
        )
      ))}
    </span>
  );
}
