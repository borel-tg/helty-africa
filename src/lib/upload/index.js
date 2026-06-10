export { UploadService } from "./UploadService.js";
export { createConvexStorageBackend } from "./ConvexStorageBackend.js";
export { ImageCompressUploadStrategy } from "./strategies/ImageCompressUploadStrategy.js";
export { DirectUploadStrategy } from "./strategies/DirectUploadStrategy.js";
export { BaseUploadStrategy } from "./strategies/BaseUploadStrategy.js";

/** Preset options for common upload surfaces */
export const UPLOAD_PRESETS = {
  thumbnail: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    initialQuality: 0.85,
    accept: "image/jpeg,image/png,image/webp",
    hint: "PNG or JPG, compressed automatically",
  },
  logo: {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 400,
    initialQuality: 0.9,
    accept: "image/jpeg,image/png,image/webp,image/svg+xml",
    hint: "PNG, JPG, or SVG. Raster images are compressed.",
  },
  certificateBackground: {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1600,
    initialQuality: 0.85,
    accept: "image/jpeg,image/png,image/webp",
    hint: "Light PNG or JPG watermark",
  },
  document: {
    maxBytes: 50 * 1024 * 1024,
    accept:
      ".pdf,.ppt,.pptx,.doc,.docx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    hint: "PDF, PowerPoint, or Word, max 50MB",
  },
};
