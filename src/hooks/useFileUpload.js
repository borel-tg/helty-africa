import { useCallback, useMemo, useState } from "react";
import { useConvex, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  UploadService,
  createConvexStorageBackend,
  UPLOAD_PRESETS,
} from "../lib/upload";

/**
 * Upload files to Convex storage using strategy-pattern handlers
 * (image compression vs direct document upload).
 *
 * @param {'thumbnail'|'logo'|'certificateBackground'|'document'} [preset]
 */
export function useFileUpload(preset = "thumbnail") {
  const convex = useConvex();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const presetConfig = UPLOAD_PRESETS[preset] ?? UPLOAD_PRESETS.thumbnail;

  const uploadService = useMemo(() => {
    const backend = createConvexStorageBackend(
      () => generateUploadUrl(),
      ({ storageId }) => convex.query(api.storage.getUrl, { storageId })
    );
    return new UploadService(backend);
  }, [convex, generateUploadUrl]);

  const upload = useCallback(
    async (file) => {
      setError(null);
      setUploading(true);

      try {
        const isImage =
          file.type.startsWith("image/") && file.type !== "image/svg+xml";
        setProgress(isImage ? "Compressing image…" : "Uploading…");

        const result = await uploadService.upload(file, presetConfig);
        setProgress("Done");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        throw err;
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(null), 1200);
      }
    },
    [uploadService, presetConfig]
  );

  const reset = useCallback(() => {
    setError(null);
    setProgress(null);
  }, []);

  return {
    upload,
    uploading,
    progress,
    error,
    reset,
    preset: presetConfig,
  };
}

export { UPLOAD_PRESETS };
