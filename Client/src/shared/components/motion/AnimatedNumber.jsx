import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const MotionSpan = motion.span;

function defaultFormat(value) {
  return Math.round(Number(value || 0)).toLocaleString("th-TH");
}

export function AnimatedNumber({
  value,
  format = defaultFormat,
  className = "",
  spring = { stiffness: 130, damping: 24, mass: 0.6 },
}) {
  const numericValue = Number(value ?? 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const motionValue = useMotionValue(safeValue);
  const springValue = useSpring(motionValue, spring);
  const displayValue = useTransform(springValue, (latest) => format(latest));

  useEffect(() => {
    motionValue.set(safeValue);
  }, [motionValue, safeValue]);

  return <MotionSpan className={className}>{displayValue}</MotionSpan>;
}
