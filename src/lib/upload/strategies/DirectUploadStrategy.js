import { BaseUploadStrategy } from "./BaseUploadStrategy.js";

/**
 * Uploads files as-is (PDF, PPT, SVG, etc.) with optional size validation.
 */
export class DirectUploadStrategy extends BaseUploadStrategy {
  supports() {
    return true;
  }

  async upload(file, backend, options = {}) {
    if (options.maxBytes && file.size > options.maxBytes) {
      const maxMb = (options.maxBytes / (1024 * 1024)).toFixed(0);
      throw new Error(`File is too large. Maximum size is ${maxMb}MB.`);
    }

    return backend.store(file);
  }
}
