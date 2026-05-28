import imageCompression from "browser-image-compression";
import { BaseUploadStrategy } from "./BaseUploadStrategy.js";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Compresses images client-side (browser-image-compression) then uploads.
 * Keeps visual quality high while reducing payload size.
 */
export class ImageCompressUploadStrategy extends BaseUploadStrategy {
  supports(file) {
    return IMAGE_TYPES.has(file.type);
  }

  async upload(file, backend, options = {}) {
    const originalSize = file.size;

    const compressed = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB ?? 1,
      maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
      useWebWorker: true,
      initialQuality: options.initialQuality ?? 0.85,
      fileType: file.type === "image/png" ? "image/png" : "image/jpeg",
    });

    const result = await backend.store(compressed);
    return { ...result, originalSize };
  }
}
