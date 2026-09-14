import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/** จำลองสแตก session เพื่อรู้ว่า forward ได้หรือไม่ (ไม่มี browser API มาตรฐานสำหรับ canGoForward) */
const NavigationHistoryContext = createContext({ canGoForward: false });

export function useCanGoForward() {
  return useContext(NavigationHistoryContext);
}

export function NavigationHistoryProvider({ children }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [canGoForward, setCanGoForward] = useState(false);
  const initialized = useRef(false);
  const stackRef = useRef([]);
  const pointerRef = useRef(0);
  const prevBrowserIdxRef = useRef(null);

  useEffect(() => {
    const key = `${location.pathname}${location.search}`;
    const browserIdx = window.history.state?.idx ?? 0;

    if (!initialized.current) {
      stackRef.current = [key];
      pointerRef.current = 0;
      prevBrowserIdxRef.current = browserIdx;
      initialized.current = true;
      setCanGoForward(false);
      return;
    }

    const stack = stackRef.current;
    let ptr = pointerRef.current;
    const prevIdx = prevBrowserIdxRef.current;

    if (navigationType === "PUSH") {
      const nextStack = stack.slice(0, ptr + 1);
      if (nextStack[nextStack.length - 1] !== key) {
        nextStack.push(key);
      }
      stackRef.current = nextStack;
      pointerRef.current = nextStack.length - 1;
    } else if (navigationType === "REPLACE") {
      const nextStack = [...stack];
      nextStack[ptr] = key;
      stackRef.current = nextStack;
    } else if (navigationType === "POP") {
      if (prevIdx !== null && browserIdx > prevIdx) {
        ptr = Math.min(ptr + 1, stack.length - 1);
      } else if (prevIdx !== null && browserIdx < prevIdx) {
        ptr = Math.max(ptr - 1, 0);
      } else if (ptr + 1 < stack.length && stack[ptr + 1] === key) {
        ptr += 1;
      } else if (ptr > 0 && stack[ptr - 1] === key) {
        ptr -= 1;
      } else {
        stackRef.current = [key];
        ptr = 0;
      }
      pointerRef.current = ptr;
    }

    prevBrowserIdxRef.current = browserIdx;

    const p = pointerRef.current;
    const s = stackRef.current;
    setCanGoForward(p < s.length - 1);
  }, [location.pathname, location.search, navigationType]);

  const value = useMemo(() => ({ canGoForward }), [canGoForward]);

  return (
    <NavigationHistoryContext.Provider value={value}>
      {children}
    </NavigationHistoryContext.Provider>
  );
}
