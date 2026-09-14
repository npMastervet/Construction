const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_QUALITY = 0.85;

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Unable to compress image"));
      },
      "image/jpeg",
      quality
    );
  });
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function resizeImageFile(
  file,
  { maxEdge = DEFAULT_MAX_EDGE, quality = DEFAULT_QUALITY } = {}
) {
  if (!file?.type?.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await canvasToBlob(canvas, quality);
    return new File(
      [blob],
      file.name.replace(/\.[^.]+$/, "") + ".jpg",
      { type: "image/jpeg", lastModified: Date.now() }
    );
  } catch {
    return file;
  }
}
