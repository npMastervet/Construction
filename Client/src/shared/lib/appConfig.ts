/** Public build-time settings only. Never put secrets in VITE_* variables. */
export const APP_CONFIG = Object.freeze({
  name: import.meta.env.VITE_APP_NAME?.trim() || "Construction Cost Manager",
  description: "ระบบบริหารต้นทุนงานก่อสร้างและรีโนเวท",
  logoUrl: import.meta.env.VITE_APP_LOGO_URL?.trim() || "/branding/logo.svg",
  apiUrl: (import.meta.env.VITE_API_URL?.trim() || "/api").replace(/\/+$/, ""),
});
