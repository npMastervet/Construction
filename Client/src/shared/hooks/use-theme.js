import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** กัน startViewTransition ซ้อนกัน — เบราว์เซอร์จะ throw / reject ถ้ามี VT ค้างอยู่ */
let viewTransitionInFlight = false

function toThemeValue(nextTheme, currentTheme) {
  return typeof nextTheme === 'function' ? nextTheme(currentTheme) : nextTheme
}

function computeFallbackRadius(x, y) {
  const width = window.innerWidth || 0
  const height = window.innerHeight || 0
  const distances = [
    Math.hypot(x, y),
    Math.hypot(width - x, y),
    Math.hypot(x, height - y),
    Math.hypot(width - x, height - y),
  ]
  return Math.max(...distances)
}

export function useTheme() {
  const location = useLocation()
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  })

  const themeRef = useRef(theme)
  const transitionOriginRef = useRef(null)
  // keep current pathname in a ref so it doesn't become an effect dependency
  // (otherwise the theme effect would re-run — and animate — on every navigation)
  const pathnameRef = useRef(location.pathname)
  // last theme actually applied; null until the first run (mount)
  const prevThemeRef = useRef(null)
  themeRef.current = theme
  pathnameRef.current = location.pathname

  const setTheme = (nextTheme, transitionOrigin = null) => {
    if (typeof window !== 'undefined') {
      transitionOriginRef.current = transitionOrigin
    }
    setThemeState((prevTheme) => toThemeValue(nextTheme, prevTheme))
  }

  useEffect(() => {
    const root = window.document.documentElement
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const applyTheme = () => {
      root.classList.remove('light', 'dark')
      root.classList.add(themeRef.current)
      localStorage.setItem('theme', themeRef.current)
    }

    const origin = transitionOriginRef.current
    const x = origin?.x ?? window.innerWidth / 2
    const y = origin?.y ?? window.innerHeight / 2
    const radius = origin?.radius ?? computeFallbackRadius(x, y)
    root.style.setProperty('--theme-switch-x', `${x}px`)
    root.style.setProperty('--theme-switch-y', `${y}px`)
    root.style.setProperty('--theme-switch-radius', `${radius}px`)
    transitionOriginRef.current = null

    // animate only on a real theme toggle, never on mount or on navigation
    const themeChanged =
      prevThemeRef.current !== null && prevThemeRef.current !== themeRef.current
    prevThemeRef.current = themeRef.current

    // หน้า login มัก redirect ทันที — View Transition ซ้อนนำทางจะถูก abort → InvalidStateError
    const skipViewTransition =
      !themeChanged ||
      reduceMotion ||
      !document.startViewTransition ||
      pathnameRef.current === '/login'

    if (skipViewTransition) {
      applyTheme()
      return
    }

    if (viewTransitionInFlight) {
      applyTheme()
      return
    }

    viewTransitionInFlight = true
    let transition
    try {
      transition = document.startViewTransition(applyTheme)
    } catch {
      viewTransitionInFlight = false
      applyTheme()
      return
    }

    transition.ready.catch(() => {})
    transition.finished.catch(() => {}).finally(() => {
      viewTransitionInFlight = false
    })
  }, [theme])

  return { theme, setTheme }
}
