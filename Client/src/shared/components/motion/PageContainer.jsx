import { Children, isValidElement } from "react";
import { motion } from "framer-motion";
import { pageContainerVariants, pageItemVariants } from "./pageMotion";

/**
 * Page wrapper that staggers its direct children into view on mount
 * (each rises + fades in). Replaces a page's outermost container div so
 * only one line changes per page; the same className (e.g. spacing,
 * max-width) is forwarded so layout is preserved.
 *
 * Each child is auto-wrapped in a motion item, so `space-y-*` still applies
 * (the wrappers become the new direct children). `false`/`null` children
 * (conditional renders) pass through untouched.
 *
 * Respects prefers-reduced-motion globally via <MotionConfig reducedMotion="user">.
 * Pass `stagger={false}` to opt a page out (e.g. if a transformed ancestor
 * would break a `position: sticky` descendant).
 *
 * @param {{ children?: import('react').ReactNode, className?: string, stagger?: boolean }} props
 */
export function PageContainer({ children, className = "", stagger = true }) {
  if (!stagger) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={pageContainerVariants}
      initial="hidden"
      animate="show"
    >
      {Children.map(children, (child) =>
        isValidElement(child) ? (
          <motion.div variants={pageItemVariants}>{child}</motion.div>
        ) : (
          child
        )
      )}
    </motion.div>
  );
}
