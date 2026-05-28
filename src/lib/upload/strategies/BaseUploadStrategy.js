/**
 * Abstract upload strategy — subclasses implement `supports` and `upload`.
 */
export class BaseUploadStrategy {
  /**
   * @param {File} _file
   * @returns {boolean}
   */
  supports(_file) {
    return false;
  }

  /**
   * @param {File} _file
   * @param {import('../types.js').StorageBackend} _backend
   * @param {import('../types.js').UploadOptions} [_options]
   * @returns {Promise<import('../types.js').UploadResult>}
   */
  async upload(_file, _backend, _options = {}) {
    throw new Error("upload() must be implemented by subclass");
  }
}
