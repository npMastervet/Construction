import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { APP_NAME, APP_LOGO_URL } from "@/shared/lib/utils";

export default function FullPageLoader() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {APP_LOGO_URL && (
        <img
          src={APP_LOGO_URL}
          alt={APP_NAME}
          className="h-12 w-12 object-contain dark:brightness-0 dark:invert mb-2"
        />
      )}
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">กำลังตรวจสอบสิทธิ์...</p>
    </motion.div>
  );
}
