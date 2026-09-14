const APP_LABELS = {
  line: "LINE",
  facebook: "Facebook",
  instagram: "Instagram",
  "ios-webview": "แอปนี้",
  "android-webview": "แอปนี้",
};

/**
 * @returns {null | "line" | "facebook" | "instagram" | "ios-webview" | "android-webview"}
 */
export function detectInAppBrowser(userAgent = navigator.userAgent) {
  const ua = typeof userAgent === "string" ? userAgent : "";

  if (/Line\//i.test(ua)) return "line";
  if (/FBAN|FBAV/i.test(ua)) return "facebook";
  if (/Instagram/i.test(ua)) return "instagram";

  const isIos = /iPhone|iPad|iPod/i.test(ua);
  if (isIos && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua)) {
    return "ios-webview";
  }

  if (/Android/i.test(ua) && /; wv\)/i.test(ua)) {
    return "android-webview";
  }

  return null;
}

export function getInAppBrowserLabel(kind) {
  return APP_LABELS[kind] ?? "แอปนี้";
}

/**
 * @returns {{ platform: "ios" | "android" | "other", hint: string }}
 */
export function getExternalBrowserHint(userAgent = navigator.userAgent) {
  const ua = typeof userAgent === "string" ? userAgent : "";

  if (/iPhone|iPad|iPod/i.test(ua)) {
    return {
      platform: "ios",
      hint: 'กด ⋯ มุมขวาบน แล้วเลือก "เปิดใน Safari"',
    };
  }

  if (/Android/i.test(ua)) {
    return {
      platform: "android",
      hint: 'กด ⋯ แล้วเลือก "เปิดด้วย Chrome" หรือ "เปิดในเบราว์เซอร์"',
    };
  }

  return {
    platform: "other",
    hint: "เปิดลิงก์ในเบราว์เซอร์หลักของอุปกรณ์ (เช่น Safari หรือ Chrome)",
  };
}
