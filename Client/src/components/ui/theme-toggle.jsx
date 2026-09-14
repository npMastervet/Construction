import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/shared/hooks/use-theme"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

export function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggleTheme = (event) => {
    const buttonRect = event.currentTarget.getBoundingClientRect()
    const centerX = buttonRect.left + buttonRect.width / 2
    const centerY = buttonRect.top + buttonRect.height / 2
    const radius = Math.max(
      Math.hypot(centerX, centerY),
      Math.hypot(window.innerWidth - centerX, centerY),
      Math.hypot(centerX, window.innerHeight - centerY),
      Math.hypot(window.innerWidth - centerX, window.innerHeight - centerY),
    )

    setTheme(theme === "dark" ? "light" : "dark", {
      x: centerX,
      y: centerY,
      radius,
    })
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      onClick={handleToggleTheme}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: -20, opacity: 0, rotate: -180 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 180 }}
          transition={{ 
            duration: 0.2,
            ease: "easeInOut",
            opacity: { duration: 0.15 }
          }}
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </motion.div>
      </AnimatePresence>
    </Button>
  )
}