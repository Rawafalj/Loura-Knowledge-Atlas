export const allowedSourceMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/markdown",
  "text/html",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/tiff",
]);

export function sourceMaxUploadBytes() {
  const configured = Number(process.env.SOURCE_MAX_UPLOAD_MB ?? "50");
  return (
    (Number.isFinite(configured) && configured > 0 ? configured : 50) *
    1024 *
    1024
  );
}

export function validateSourceFile(mimeType: string, sizeBytes: number) {
  if (!allowedSourceMimeTypes.has(mimeType)) {
    return {
      code: "UNSUPPORTED_SOURCE_TYPE",
      message: "This source file type is not supported.",
    };
  }
  if (sizeBytes <= 0 || sizeBytes > sourceMaxUploadBytes()) {
    return {
      code: "SOURCE_TOO_LARGE",
      message: "The source exceeds the configured upload limit.",
    };
  }
  return null;
}
