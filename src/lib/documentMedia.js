/**
 * Detect how to render a document lesson from URL, filename, and stored type hint.
 * Google Drive PDFs use pdf.js first (fallback to Drive preview iframe on load error).
 * Slides / PPT stay in embed viewers.
 */

export function getGoogleDriveFileId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (!parsed.hostname.includes("drive.google.com")) return null;
    const pathMatch = parsed.pathname.match(/\/d\/([^/]+)/);
    if (pathMatch?.[1]) return pathMatch[1];
    if (parsed.pathname.includes("/open")) {
      return parsed.searchParams.get("id");
    }
    return parsed.searchParams.get("id");
  } catch {
    return null;
  }
}

export function getGoogleDrivePreviewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/** Public export URL for pdf.js (requires file shared as “anyone with the link”). */
export function getGoogleDrivePdfUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

function isDrivePptLesson(nameHint, pathHint, fileType) {
  const detected =
    nameHint || pathHint || (fileType === "ppt" ? "ppt" : fileType === "pdf" ? "pdf" : null);
  return detected === "ppt";
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp)(\?|#|$)/i;
const PDF_EXT = /\.pdf(\?|#|$)/i;
const PPT_EXT = /\.(pptx?|ppsx?|odp)(\?|#|$)/i;

function extHint(value) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (IMAGE_EXT.test(lower)) return "image";
  if (PDF_EXT.test(lower)) return "pdf";
  if (PPT_EXT.test(lower)) return "ppt";
  return null;
}

function isConvexOrDirectPdfUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.toLowerCase().endsWith(".pdf")) return true;
    if (parsed.pathname.includes("/api/storage/")) return true;
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return parsed.pathname.toLowerCase().endsWith(".pdf");
    }
    return false;
  } catch {
    return false;
  }
}

function officeEmbedUrl(url) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
}

/** True when the URL points at a raw PowerPoint file (not a viewer/embed page). */
export function isDirectPptFileUrl(url) {
  if (!url?.trim()) return false;
  return PPT_EXT.test(url.trim());
}

function isSafeEmbedViewerUrl(url) {
  if (!url) return false;
  return (
    url.includes("view.officeapps.live.com") ||
    url.includes("drive.google.com/") ||
    url.includes("docs.google.com/")
  );
}

/** Embedding this src in an iframe would trigger a browser file download. */
export function wouldTriggerPptDownload(src) {
  return isDirectPptFileUrl(src) && !isSafeEmbedViewerUrl(src);
}

/**
 * @returns {{ kind: 'none'|'embed'|'pdf'|'image'|'blocked', embedSrc?: string, pdfSrc?: string, imageSrc?: string, supportsSlideNav?: boolean }}
 */
export function detectDocumentMedia(fileUrl, fileName, fileType) {
  if (!fileUrl?.trim()) return { kind: "none" };

  const url = fileUrl.trim();
  const nameHint = extHint(fileName);
  let pathHint = null;
  let parsed;

  try {
    parsed = new URL(url);
    pathHint = extHint(parsed.pathname + parsed.search);
  } catch {
    if (
      wouldTriggerPptDownload(url) ||
      nameHint === "ppt" ||
      fileType === "ppt"
    ) {
      return { kind: "blocked" };
    }
    return { kind: "embed", embedSrc: url };
  }

  const driveId = getGoogleDriveFileId(url);
  if (driveId) {
    if (isDrivePptLesson(nameHint, pathHint, fileType)) {
      return { kind: "embed", embedSrc: getGoogleDrivePreviewUrl(driveId) };
    }
    return { kind: "pdf", pdfSrc: getGoogleDrivePdfUrl(driveId) };
  }

  if (parsed.hostname.includes("docs.google.com")) {
    const idMatch = parsed.pathname.match(/\/d\/([^/]+)/);
    const fileId = idMatch?.[1];
    if (fileId && parsed.pathname.includes("/presentation/")) {
      return {
        kind: "embed",
        embedSrc: `https://docs.google.com/presentation/d/${fileId}/embed?rm=minimal`,
        supportsSlideNav: true,
      };
    }
    if (fileId && parsed.pathname.includes("/document/")) {
      return {
        kind: "embed",
        embedSrc: `https://docs.google.com/document/d/${fileId}/preview`,
      };
    }
  }

  const detected = nameHint || pathHint || (fileType === "ppt" ? "ppt" : fileType === "pdf" ? "pdf" : null);

  if (detected === "image") {
    return { kind: "image", imageSrc: url };
  }

  if (detected === "ppt") {
    return { kind: "embed", embedSrc: officeEmbedUrl(url) };
  }

  if (detected === "pdf" && isConvexOrDirectPdfUrl(url)) {
    return { kind: "pdf", pdfSrc: url };
  }

  if (detected === "pdf" || isConvexOrDirectPdfUrl(url)) {
    if (isConvexOrDirectPdfUrl(url)) {
      return { kind: "pdf", pdfSrc: url };
    }
    return { kind: "embed", embedSrc: officeEmbedUrl(url) };
  }

  // Unknown share / view links — iframe embed (Drive-style hosts, CDN, etc.)
  if (url.startsWith("http")) {
    return { kind: "embed", embedSrc: officeEmbedUrl(url) };
  }

  return { kind: "pdf", pdfSrc: url };
}

/** Convex `fileType` field: pdf | ppt (viewer also detects images from URL). */
export function inferStoredFileType(fileUrl, fileName, manualFormat = "pdf") {
  const hint = extHint(fileName) || extHint(safePath(fileUrl));
  if (hint === "ppt") return "ppt";
  if (hint === "pdf") return "pdf";
  return manualFormat === "ppt" ? "ppt" : "pdf";
}

function safePath(url) {
  try {
    const parsed = new URL(url.trim());
    return parsed.pathname + parsed.search;
  } catch {
    return "";
  }
}
