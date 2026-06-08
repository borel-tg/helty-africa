import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Expand,
  FileText,
  Loader2,
  Minimize,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { cn } from "../../lib/utils";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { usePdfZoomGestures } from "../../hooks/usePdfZoomGestures";
import {
  detectDocumentMedia,
  getGoogleDriveFileId,
  getGoogleDrivePreviewUrl,
  wouldTriggerPptDownload,
} from "../../lib/documentMedia";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const PUBLIC_DEMO_PDF = "/demo/sample-pdf.pdf";
export const PUBLIC_DEMO_PPT = "/demo/sample-ppt.ppt";

const PDF_LOAD_ERROR = "Failed to load PDF.";
const PDF_MIN_SCALE = 0.6;
const PDF_MAX_SCALE = 2.5;
const PDF_ZOOM_STEP = 0.15;

/** Single entry: picks embed / pdf.js / image from URL + metadata. */
export function DocumentViewer({ fileUrl, fileName, fileType }) {
  const media = useMemo(
    () => detectDocumentMedia(fileUrl, fileName, fileType),
    [fileUrl, fileName, fileType]
  );

  if (media.kind === "none") return null;
  if (media.kind === "blocked") {
    return <BlockedDocumentFrame fileName={fileName} />;
  }
  if (media.kind === "image") {
    return (
      <ImageDocumentFrame src={media.imageSrc} fileName={fileName} />
    );
  }
  if (media.kind === "embed") {
    return (
      <EmbeddedDocumentFrame
        src={media.embedSrc}
        fileName={fileName}
        title={fileName || "Document"}
        supportsSlideNav={media.supportsSlideNav}
      />
    );
  }
  return (
    <PdfDocumentViewer
      fileUrl={fileUrl}
      fileName={fileName}
      pdfSrc={media.pdfSrc}
    />
  );
}

/** @deprecated Use DocumentViewer — kept for imports that pass a lesson object */
export function PptDocumentViewer({ lesson }) {
  return (
    <DocumentViewer
      fileUrl={lesson.fileUrl}
      fileName={lesson.fileName}
      fileType={lesson.fileType}
    />
  );
}

function ImageDocumentFrame({ src, fileName }) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullScreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullScreenChange);
  }, []);

  const toggleReaderMode = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen?.();
      return;
    }
    await document.exitFullscreen?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn("bg-white", isFullscreen && "h-[100dvh] flex flex-col")}
    >
      <DocumentToolbar
        fileName={fileName}
        isFullscreen={isFullscreen}
        onToggleReaderMode={toggleReaderMode}
      />
      <div
        className={cn(
          "bg-gray-100 min-h-[420px] flex items-center justify-center p-4",
          isFullscreen && "flex-1 min-h-0 overflow-auto"
        )}
      >
        <img
          src={src}
          alt={fileName || "Lesson image"}
          className="max-w-full max-h-[78dvh] object-contain shadow-md rounded"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      <DocumentBottomNav
        isFullscreen={isFullscreen}
        onToggleReaderMode={toggleReaderMode}
      />
    </div>
  );
}

function BlockedDocumentFrame({ fileName }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
      <DocumentToolbar fileName={fileName} />
      <div className="bg-gray-50 min-h-[420px] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <AlertTriangle size={28} className="text-amber-500 shrink-0" />
          <p className="text-sm text-text-secondary">
            {t("learner.documentPptBlocked")}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmbeddedDocumentFrame({
  src,
  fileName,
  title = "Document",
  supportsSlideNav = false,
}) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(1);

  useEffect(() => {
    const onFullScreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullScreenChange);
  }, []);

  const toggleReaderMode = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen?.();
      return;
    }
    await document.exitFullscreen?.();
  };

  if (wouldTriggerPptDownload(src)) {
    return <BlockedDocumentFrame fileName={fileName} />;
  }

  const iframeSrc =
    supportsSlideNav && src.includes("docs.google.com/presentation")
      ? `${src.split("#")[0]}#slide=id.p${Math.max(1, slideIndex)}`
      : src;

  return (
    <div
      ref={containerRef}
      className={cn("bg-white", isFullscreen && "h-[100dvh] flex flex-col")}
    >
      <DocumentToolbar
        fileName={fileName}
        isFullscreen={isFullscreen}
        onToggleReaderMode={toggleReaderMode}
      />
      <iframe
        title={title}
        src={iframeSrc}
        className={cn(
          "w-full h-[78dvh] min-h-[420px] bg-white border-0",
          isFullscreen && "flex-1 min-h-0 h-auto"
        )}
        allow="autoplay; fullscreen"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <DocumentBottomNav
        page={slideIndex}
        numPages={supportsSlideNav ? Number.MAX_SAFE_INTEGER : 0}
        isFullscreen={isFullscreen}
        onToggleReaderMode={toggleReaderMode}
        onPrev={
          supportsSlideNav ? () => setSlideIndex((s) => Math.max(1, s - 1)) : undefined
        }
        onNext={supportsSlideNav ? () => setSlideIndex((s) => s + 1) : undefined}
      />
    </div>
  );
}

export function PdfDocumentViewer({ fileUrl, fileName, pdfSrc }) {
  const media = useMemo(
    () => detectDocumentMedia(fileUrl, fileName, "pdf"),
    [fileUrl, fileName]
  );

  if (media.kind === "embed") {
    return (
      <EmbeddedDocumentFrame
        src={media.embedSrc}
        fileName={fileName}
        title={fileName || "Document"}
        supportsSlideNav={media.supportsSlideNav}
      />
    );
  }

  if (media.kind === "image") {
    return <ImageDocumentFrame src={media.imageSrc} fileName={fileName} />;
  }

  const resolvedPdfSrc = pdfSrc || media.pdfSrc || fileUrl;

  return (
    <PdfJsDocumentViewer
      fileUrl={fileUrl}
      fileName={fileName}
      normalizedFileUrl={resolvedPdfSrc}
    />
  );
}

function PdfJsDocumentViewer({ fileUrl, fileName, normalizedFileUrl }) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery();
  const containerRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [embedFallback, setEmbedFallback] = useState(null);

  const { scrollRef, zoomIn, zoomOut } = usePdfZoomGestures({
    scale,
    setScale,
    minScale: PDF_MIN_SCALE,
    maxScale: PDF_MAX_SCALE,
    step: PDF_ZOOM_STEP,
  });

  const pagePadding = isMobile ? 8 : isFullscreen ? 16 : 32;
  const pageWidth = Math.max(280, containerWidth - pagePadding);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const resizeObserver = new ResizeObserver(() => {
      setContainerWidth(node.clientWidth);
    });
    resizeObserver.observe(node);
    setContainerWidth(node.clientWidth);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const onFullScreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullScreenChange);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setEmbedFallback(null);
    setScale(1);
    setPage(1);
  }, [normalizedFileUrl]);

  const toggleReaderMode = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen?.();
      return;
    }
    await document.exitFullscreen?.();
  };

  if (embedFallback) {
    return (
      <EmbeddedDocumentFrame
        src={embedFallback}
        fileName={fileName}
        title={fileName || "Document"}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-white",
        isFullscreen && "h-[100dvh] flex flex-col"
      )}
    >
      <DocumentToolbar
        fileName={fileName}
        page={page}
        numPages={numPages}
        scale={scale}
        isFullscreen={isFullscreen}
        onToggleReaderMode={toggleReaderMode}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(numPages, p + 1))}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        hideZoomOnMobile={isMobile}
      />

      <div
        ref={scrollRef}
        className={cn(
          "relative bg-gray-100 min-h-[420px] flex justify-center overflow-auto p-1 md:p-4 touch-pan-x touch-pan-y",
          isFullscreen && "flex-1 min-h-0"
        )}
      >
        <p className="sr-only" aria-live="polite">
          {numPages > 0
            ? t("learner.documentZoomStatus", {
                page,
                total: numPages,
                zoom: Math.round(scale * 100),
              })
            : ""}
        </p>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Loader2 className="animate-spin text-primary" size={28} />
            <p className="text-sm text-text-secondary">{t("learner.documentLoading")}</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600 py-8 text-center">{t("learner.documentError")}</p>
        )}
        <Document
          file={normalizedFileUrl}
          onLoadSuccess={({ numPages: total }) => {
            setNumPages(total);
            setPage(1);
            setLoading(false);
            setError(null);
          }}
          onLoadError={() => {
            setLoading(false);
            const driveId = getGoogleDriveFileId(fileUrl);
            if (driveId) {
              setEmbedFallback(getGoogleDrivePreviewUrl(driveId));
              return;
            }
            const fallback = detectDocumentMedia(fileUrl, fileName, null);
            if (fallback.kind === "embed") {
              setEmbedFallback(fallback.embedSrc);
              return;
            }
            setError(PDF_LOAD_ERROR);
          }}
          loading={null}
          className={cn(loading && "hidden")}
        >
          <Page
            pageNumber={page}
            width={pageWidth}
            scale={scale}
            className="shadow-md"
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>

        {isMobile && numPages > 0 && !loading && (
          <MobileZoomControls
            scale={scale}
            minScale={PDF_MIN_SCALE}
            maxScale={PDF_MAX_SCALE}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={() => setScale(1)}
            canZoomOut={scale > PDF_MIN_SCALE + 0.01}
            canZoomIn={scale < PDF_MAX_SCALE - 0.01}
          />
        )}
      </div>
      <div className="border-t border-gray-100">
        <DocumentBottomNav
          page={page}
          numPages={numPages}
          isFullscreen={isFullscreen}
          onToggleReaderMode={toggleReaderMode}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(numPages, p + 1))}
        />
      </div>
    </div>
  );
}

function MobileZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  canZoomIn,
  canZoomOut,
}) {
  return (
    <div
      className="md:hidden absolute bottom-4 right-3 z-10 flex flex-col gap-2"
      role="group"
      aria-label="Zoom controls"
    >
      <button
        type="button"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className="min-h-[44px] min-w-[44px] rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center disabled:opacity-40"
        aria-label="Zoom in"
      >
        <ZoomIn size={20} />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="min-h-[36px] min-w-[44px] rounded-full bg-white/95 shadow-md border border-gray-200 text-xs font-medium text-text-secondary tabular-nums"
        aria-label="Reset zoom"
      >
        {Math.round(scale * 100)}%
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className="min-h-[44px] min-w-[44px] rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center disabled:opacity-40"
        aria-label="Zoom out"
      >
        <ZoomOut size={20} />
      </button>
    </div>
  );
}

function DocumentToolbar({
  fileName,
  page,
  numPages,
  scale,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  hideZoomOnMobile = false,
  isFullscreen = false,
  onToggleReaderMode,
}) {
  return (
    <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex flex-wrap items-center gap-3">
      <FileText size={16} className="text-text-secondary shrink-0" />
      <span className="text-sm text-text-secondary truncate flex-1 min-w-0">
        {fileName || "document"}
      </span>
      {numPages > 0 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={page <= 1}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-40 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-text-secondary tabular-nums min-w-[4rem] text-center">
            {page} / {numPages}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={page >= numPages}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-40 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
          {onZoomOut && (
            <button
              type="button"
              onClick={onZoomOut}
              className={cn(
                "p-2 rounded hover:bg-gray-200 min-h-[36px] min-w-[36px] flex items-center justify-center",
                hideZoomOnMobile && "hidden md:flex"
              )}
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
          )}
          {onZoomIn && (
            <button
              type="button"
              onClick={onZoomIn}
              className={cn(
                "p-2 rounded hover:bg-gray-200 min-h-[36px] min-w-[36px] flex items-center justify-center",
                hideZoomOnMobile && "hidden md:flex"
              )}
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
          )}
          {typeof scale === "number" && (
            <span
              className={cn(
                "text-xs text-text-secondary tabular-nums",
                hideZoomOnMobile && "hidden md:inline"
              )}
            >
              {Math.round(scale * 100)}%
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={onToggleReaderMode}
        className="p-2 rounded hover:bg-gray-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
        aria-label={isFullscreen ? "Exit reader mode" : "Enter reader mode"}
        title={isFullscreen ? "Exit reader mode" : "Reader mode"}
      >
        {isFullscreen ? <Minimize size={16} /> : <Expand size={16} />}
      </button>
      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium shrink-0">
        View Only
      </span>
    </div>
  );
}

function DocumentBottomNav({
  page,
  numPages,
  onPrev,
  onNext,
  isFullscreen = false,
  onToggleReaderMode,
}) {
  return (
    <div className="bg-gray-50 border-t border-gray-100 px-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={numPages > 0 ? page <= 1 : !onPrev}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Previous page"
          title="Previous"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          onClick={onToggleReaderMode}
          className="p-2 rounded hover:bg-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={isFullscreen ? "Exit reader mode" : "Enter reader mode"}
          title={isFullscreen ? "Exit reader mode" : "Reader mode"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Expand size={18} />}
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={numPages > 0 ? page >= numPages : !onNext}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Next page"
          title="Next"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
