/**
 * Convex file storage adapter — generates upload URL, POSTs blob, resolves public URL.
 *
 * @param {() => Promise<string>} generateUploadUrl
 * @param {(args: { storageId: string }) => Promise<string | null>} getUrl
 * @returns {import('./types.js').StorageBackend}
 */
export function createConvexStorageBackend(generateUploadUrl, getUrl) {
  return {
    async store(file) {
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Upload failed (${response.status})`);
      }

      const { storageId } = await response.json();
      const url = await getUrl({ storageId });

      if (!url) {
        throw new Error("Could not resolve file URL from storage.");
      }

      return {
        storageId,
        url,
        fileName: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
      };
    },
  };
}
