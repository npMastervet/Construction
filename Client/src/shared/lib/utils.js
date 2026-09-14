import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { APP_CONFIG } from "./appConfig";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const APP_NAME = APP_CONFIG.name;
export const APP_LOGO_URL = APP_CONFIG.logoUrl;

export const APP_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

export const APP_BUILD_DATE =
  typeof __BUILD_DATE__ !== "undefined" ? __BUILD_DATE__ : null;

// รหัสสั้นแทนวันที่อัปเวอร์ชัน (base36 ของนาที epoch) — โชว์บน UI แทนวันที่จริง, null ถ้าไม่มี
export const APP_VERSION_CODE =
  typeof __VERSION_CODE__ !== "undefined" ? __VERSION_CODE__ : null;

export function setPageTitle(title) {
  document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
}
