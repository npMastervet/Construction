import { motion } from "framer-motion";

/**
 * แถวตาราง (`<tr>`) ที่มี transition เข้า-ออกแบบสมูท สำหรับใช้คู่กับ
 * useExpandableRows + ShowMoreButton — ห่อ .map(...) ด้วย <AnimatePresence initial={false}>
 * แล้วแถวที่ถูกเผย/ซ่อนตอนกด "ดูทั้งหมด / ย่อ" จะ fade + เลื่อนแนวตั้งแบบสมูท
 *
 * หมายเหตุ: ไม่ animate ความสูงของ <tr> ตรง ๆ (ไม่เสถียรข้ามเบราว์เซอร์)
 * ใช้ opacity + y + stagger ตาม index แทน ซึ่งให้ความรู้สึก "ยืด-หด" ที่เสถียร
 *
 * @param {number}   [index=0]  ลำดับแถว ใช้คำนวณ stagger delay
 * @param {ReactNode} children  <TableCell> ต่าง ๆ
 * รับ prop อื่น (className, onClick, ...) ส่งต่อไปยัง <motion.tr>
 */
// alias เพื่อให้ eslint jsx-uses-vars มองเห็น (เหมือน DataFade.jsx)
const MotionTr = motion.tr;

export function AnimatedTableRow({ index = 0, children, ...rest }) {
  return (
    <MotionTr
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: "easeOut", delay: Math.min(index, 8) * 0.03 }}
      {...rest}
    >
      {children}
    </MotionTr>
  );
}
