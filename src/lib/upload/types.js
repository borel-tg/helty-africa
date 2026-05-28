/**
 * @typedef {Object} UploadResult
 * @property {string} storageId - Convex storage document ID
 * @property {string} url - Public URL for the stored file
 * @property {string} fileName - Original or processed file name
 * @property {number} size - Byte size of the uploaded blob
 * @property {string} mimeType - MIME type sent to storage
 * @property {number} [originalSize] - Size before compression (images only)
 */

/**
 * @typedef {Object} UploadOptions
 * @property {number} [maxSizeMB] - Target max size for image compression
 * @property {number} [maxWidthOrHeight] - Max dimension for images
 * @property {number} [maxBytes] - Hard limit for direct uploads (documents)
 * @property {number} [initialQuality] - JPEG/WebP quality (0–1)
 */

/**
 * @typedef {Object} StorageBackend
 * @property {(file: File) => Promise<UploadResult>} store
 */
