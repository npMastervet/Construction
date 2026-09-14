import { motion, AnimatePresence } from "framer-motion";

/**
 * Crossfades a region of content whenever `fadeKey` changes — the canonical
 * "results changed" transition used across list/table pages. Build the key from
 * whatever should trigger a fade (filters + page + a loading flag), e.g.
 *
 *   <DataFade fadeKey={`${year}|${status}|${page}|${loading}`}>
 *     {loading ? <TableSkeleton .../> : rows.length ? <Table .../> : <EmptyState .../>}
 *   </DataFade>
 *
 * Opacity-only, 0.2s easeInOut (matches TourDataFade). `initial={false}` so the
 * first mount doesn't double-animate with PageContainer's entry stagger.
 * Respects prefers-reduced-motion via <MotionConfig reducedMotion="user"> in App.jsx.
 *
 * @param {string|number} fadeKey  signature that changes when content should refade
 * @param {ReactNode} children
 * @param {string} [className]     forwarded to the inner motion.div
 * @param {number} [duration=0.2]
 */
// alias so eslint sees `motion` referenced (its jsx-uses-vars misses `<motion.div>`)
const MotionDiv = motion.div;

export function DataFade({ fadeKey, children, className = "", duration = 0.2 }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <MotionDiv
        key={String(fadeKey)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration, ease: "easeInOut" }}
        className={className}
      >
        {children}
      </MotionDiv>
    </AnimatePresence>
  );
}
