import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink } from "lucide-react";
import {
  getExternalBrowserHint,
  getInAppBrowserLabel,
} from "@/shared/lib/inAppBrowser";

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through */
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export function InAppBrowserWarning({ label }) {
  const appName = getInAppBrowserLabel(label);
  const { hint } = getExternalBrowserHint();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const id = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(id);
  }, [copied]);

  const handleCopyLink = useCallback(async () => {
    const ok = await copyTextToClipboard(window.location.href);
    if (ok) setCopied(true);
  }, []);

  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3.5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30"
      role="alert"
    >
      <div className="flex gap-2">
        <ExternalLink
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            ไม่สามารถเข้าสู่ระบบ Google ในแอปนี้ได้
          </p>
          <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-400/90">
            คุณกำลังเปิดระบบผ่าน
            {appName === "แอปนี้" ? "แอปนี้" : `แอป ${appName}`} — Google
            ไม่อนุญาตให้ล็อกอินใน in-app browser กรุณาเปิดลิงก์ใน Safari หรือ
            Chrome แทน
          </p>
          <p className="text-sm leading-relaxed text-amber-700/90 dark:text-amber-400/80">
            <span className="font-medium">วิธีเปิดในเบราว์เซอร์:</span> {hint}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-amber-300 bg-white text-amber-900 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900/50"
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                คัดลอกแล้ว
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                คัดลอกลิงก์
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
