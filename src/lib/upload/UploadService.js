import { ImageCompressUploadStrategy } from "./strategies/ImageCompressUploadStrategy.js";
import { DirectUploadStrategy } from "./strategies/DirectUploadStrategy.js";

/**
 * Context object for the strategy pattern — picks the right uploader per file type.
 */
export class UploadService {
  /**
   * @param {import('./types.js').StorageBackend} backend
   * @param {import('./strategies/BaseUploadStrategy.js').BaseUploadStrategy[]} [strategies]
   */
  constructor(backend, strategies) {
    this.backend = backend;
    this.strategies =
      strategies ??
      [new ImageCompressUploadStrategy(), new DirectUploadStrategy()];
  }

  /**
   * @param {File} file
   * @returns {import('./strategies/BaseUploadStrategy.js').BaseUploadStrategy}
   */
  resolveStrategy(file) {
    const match = this.strategies.find((s) => s.supports(file));
    if (!match) {
      throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
    }
    return match;
  }

  /**
   * @param {File} file
   * @param {import('./types.js').UploadOptions} [options]
   * @returns {Promise<import('./types.js').UploadResult>}
   */
  async upload(file, options) {
    const strategy = this.resolveStrategy(file);
    return strategy.upload(file, this.backend, options);
  }
}
