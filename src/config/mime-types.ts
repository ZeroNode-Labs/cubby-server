// Allowed MIME types configuration
export const ALLOWED_MIME_TYPES = {
  images: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",
    "image/heic",
    "image/heif",
  ],
  // Future categories can be added here
  // documents: ["application/pdf", "application/msword", ...],
  // videos: ["video/mp4", "video/mpeg", ...],
  // archives: ["application/zip", "application/x-rar", ...],
};

// Get all allowed MIME types (currently just images)
export const getAllowedMimeTypes = (): string[] => {
  return [...ALLOWED_MIME_TYPES.images];
};

// Check if MIME type is allowed
export const isAllowedMimeType = (mimeType: string): boolean => {
  const allowed = getAllowedMimeTypes();
  return allowed.includes(mimeType.toLowerCase());
};

// Get file category from MIME type
export const getFileCategory = (mimeType: string): string | null => {
  const lowerMimeType = mimeType.toLowerCase();

  if (ALLOWED_MIME_TYPES.images.includes(lowerMimeType)) {
    return "image";
  }

  return null;
};

// Human-readable error message for allowed types
export const getAllowedTypesMessage = (): string => {
  return "Only image files are allowed (JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, HEIC, HEIF)";
};
