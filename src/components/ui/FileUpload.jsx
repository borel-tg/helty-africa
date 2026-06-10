import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X, FileText, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useToast } from "./Toast";

/**
 * Drag-and-click file upload wired to Convex storage (strategy pattern + image compression).
 *
 * @param {'thumbnail'|'logo'|'certificateBackground'|'document'} preset
 * @param {(result: import('../../lib/upload/types.js').UploadResult) => void} onUploaded
 * @param {string} [label]
 * @param {string} [value] - Existing file URL for preview
 * @param {string} [fileName] - Existing file name display
 */
export function FileUpload({
  preset = "thumbnail",
  onUploaded,
  label,
  value,
  fileName,
  className,
  disabled = false,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const toast = useToast();
  const { upload, uploading, progress, error, reset, preset: presetConfig } =
    useFileUpload(preset);
  const [preview, setPreview] = useState(value || null);
  const [localName, setLocalName] = useState(fileName || null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  useEffect(() => {
    if (fileName) setLocalName(fileName);
  }, [fileName]);

  const isImagePreset = preset !== "document";

  const handleFile = async (file) => {
    if (!file || disabled) return;

    if (presetConfig.accept && !fileMatchesAccept(file, presetConfig.accept)) {
      toast.error(t("upload.fileTypeNotAllowed"));
      return;
    }

    try {
      const result = await upload(file);
      setPreview(result.url);
      setLocalName(result.fileName);
      onUploaded?.(result);

      if (result.originalSize && result.originalSize > result.size) {
        const saved = ((1 - result.size / result.originalSize) * 100).toFixed(0);
        toast.success(t("upload.uploadedCompressed", { saved }));
      } else {
        toast.success(t("upload.fileUploaded"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("upload.uploadFailed"));
    }
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const clear = (e) => {
    e.stopPropagation();
    setPreview(null);
    setLocalName(null);
    reset();
    onUploaded?.(null);
  };

  return (
    <div className={className}>
      {label && (
        <label className="text-sm font-medium text-text-primary mb-1 block">
          {label}
        </label>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-5 text-center transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          disabled || uploading
            ? "opacity-60 cursor-not-allowed border-gray-200"
            : "cursor-pointer border-gray-200 hover:border-primary"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={presetConfig.accept}
          disabled={disabled || uploading}
          onChange={onInputChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 size={28} className="text-primary animate-spin" />
            <p className="text-sm text-text-secondary">{progress}</p>
          </div>
        ) : preview && isImagePreset ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt={t("upload.uploadPreview")}
              className="max-h-24 mx-auto rounded object-contain"
            />
            <button
              type="button"
              onClick={clear}
              className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow border border-gray-200 text-gray-500 hover:text-red-500"
              aria-label={t("upload.remove")}
            >
              <X size={14} />
            </button>
          </div>
        ) : preview || localName ? (
          <div className="flex items-center justify-center gap-2">
            <FileText size={24} className="text-primary shrink-0" />
            <p className="text-sm text-text-primary truncate max-w-[200px]">
              {localName || t("upload.uploadedFile")}
            </p>
            <button
              type="button"
              onClick={clear}
              className="p-1 text-gray-400 hover:text-red-500"
              aria-label={t("upload.remove")}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            {isImagePreset ? (
              <ImageIcon size={24} className="text-gray-300 mx-auto mb-2" />
            ) : (
              <Upload size={24} className="text-gray-300 mx-auto mb-2" />
            )}
            <p className="text-sm text-text-secondary">
              {isImagePreset ? t("upload.clickUploadImage") : t("upload.clickUploadFile")}
            </p>
            <p className="text-xs text-gray-400 mt-1">{presetConfig.hint}</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function fileMatchesAccept(file, accept) {
  const tokens = accept.split(",").map((t) => t.trim().toLowerCase());
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}
