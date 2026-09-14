import { useRef, useState, useId } from "react";
import { Paperclip, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function parseAcceptExtensions(accept) {
  if (!accept) return null;
  return accept
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.startsWith("."))
    .map((part) => part.slice(1));
}

function matchesAccept(file, accept) {
  const extensions = parseAcceptExtensions(accept);
  if (!extensions?.length) return true;
  const name = (file.name || "").toLowerCase();
  return extensions.some((ext) => name.endsWith(`.${ext}`));
}

/**
 * FileDropZone — single-file drag-and-drop picker (system standard pattern)
 *
 * Props:
 *   value          : File | null
 *   onChange       : (file: File | null) => void
 *   accept         : string              — e.g. ".zip" or ".jpg,.png"
 *   maxSize        : number | null       — max bytes (null = no limit)
 *   hint           : string | null       — shown under drop zone
 *   disabled       : boolean
 *   error          : string | null       — external error from parent
 *   icon           : LucideIcon           — zone icon (default Paperclip)
 *   showPickButton : boolean              — outline "เลือกไฟล์" button (default true)
 */
export function FileDropZone({
  value = null,
  onChange,
  accept,
  maxSize = null,
  hint = null,
  disabled = false,
  error = null,
  icon = Paperclip,
  showPickButton = true,
}) {
  const Icon = icon;
  const fileInputRef = useRef(null);
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const displayError = error || validationError;

  function validate(file) {
    if (!file) return null;
    if (accept && !matchesAccept(file, accept)) {
      const extensions = parseAcceptExtensions(accept);
      const label = extensions?.length ? extensions.map((e) => `.${e}`).join(", ") : accept;
      return `ประเภทไฟล์ไม่รองรับ — อนุญาตเฉพาะ ${label}`;
    }
    if (maxSize != null && file.size > maxSize) {
      return `ไฟล์มีขนาดเกิน ${formatBytes(maxSize)}`;
    }
    return null;
  }

  function applyFile(file) {
    if (disabled) return;
    const err = validate(file);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    onChange?.(file);
  }

  function handleClear() {
    if (disabled) return;
    setValidationError(null);
    onChange?.(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleInputChange(e) {
    const f = e.target.files?.[0] ?? null;
    if (f) applyFile(f);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={handleInputChange}
      />

      {showPickButton && !disabled && !value && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
            เลือกไฟล์
          </Button>
        </div>
      )}

      {value ? (
        <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{value.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(value.size)}</p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="ลบไฟล์"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        !disabled && (
          <label
            htmlFor={inputId}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed",
              "px-4 py-6 text-center cursor-pointer transition-colors",
              dragOver
                ? "border-primary bg-muted/40"
                : "hover:border-primary/60 hover:bg-muted/30",
              displayError ? "border-destructive" : "border-muted-foreground/30"
            )}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) applyFile(f);
            }}
          >
            <Icon
              className={cn(
                "h-8 w-8",
                displayError ? "text-destructive" : "text-muted-foreground/50"
              )}
            />
            <div>
              <p className="text-sm text-muted-foreground">
                ลากไฟล์มาวาง หรือ{" "}
                <span className="text-primary font-medium">คลิกเพื่อเลือกไฟล์</span>
              </p>
              {hint && (
                <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
              )}
            </div>
          </label>
        )
      )}

      {displayError && (
        <p className="text-xs text-destructive flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {displayError}
        </p>
      )}

      {hint && value && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
