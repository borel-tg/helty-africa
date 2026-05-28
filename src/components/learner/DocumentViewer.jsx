import { useEffect, useMemo, useRef, useState } from "react";
import {
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

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/** Stable public paths (also in /public/demo) for Office Online embed. */
export const PUBLIC_DEMO_PDF = "/demo/sample-pdf.pdf";
export const PUBLIC_DEMO_PPT = "/demo/sample-ppt.ppt";

function useAbsolutePublicUrl(lesson) {
  return useMemo(() => {
    if (lesson.fileUrl?.startsWith("http")) return lesson.fileUrl;
    if (lesson.fileUrl?.startsWith("/")) {
      return `${window.location.origin}${lesson.fileUrl}`;
    }
    if (lesson.fileType === "ppt") {
      return `${window.location.origin}${PUBLIC_DEMO_PPT}`;
    }
    return `${window.location.origin}${PUBLIC_DEMO_PDF}`;
  }, [lesson.fileType, lesson.fileUrl]);
}

export function PdfDocumentViewer({ fileUrl, fileName }) {
  const containerRef = useRef(null);
  const normalizedFileUrl = useMemo(
    () => normalizeExternalDocumentUrl(fileUrl, "pdf"),
    [fileUrl]
  );
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        onZoomIn={() => setScale((s) => Math.min(2, s + 0.15))}
        onZoomOut={() => setScale((s) => Math.max(0.6, s - 0.15))}
      />

      <div
        className={cn(
          "bg-gray-100 min-h-[420px] flex justify-center overflow-auto p-2 md:p-4",
          isFullscreen && "flex-1 min-h-0"
        )}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Loader2 className="animate-spin text-primary" size={28} />
            <p className="text-sm text-text-secondary">Loading PDF…</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600 py-8 text-center">{error}</p>
        )}
        <Document
          file={normalizedFileUrl}
          onLoadSuccess={({ numPages: total }) => {
            setNumPages(total);
            setPage(1);
            setLoading(false);
            setError(null);
          }}
          onLoadError={(err) => {
            setLoading(false);
            setError(err?.message || "Failed to load PDF");
          }}
          loading={null}
          className={cn(loading && "hidden")}
        >
          <Page
            pageNumber={page}
            width={Math.max(280, containerWidth - (isFullscreen ? 16 : 32))}
            scale={scale}
            className="shadow-md"
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
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

export function PptDocumentViewer({ lesson }) {
  const absoluteUrl = useAbsolutePublicUrl(lesson);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(1);
  const embedInfo = useMemo(
    () => getPresentationEmbedInfo(absoluteUrl, slideIndex),
    [absoluteUrl, slideIndex]
  );
  const containerRef = useRef(null);

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
        fileName={lesson.fileName}
        isFullscreen={isFullscreen}
        onToggleReaderMode={toggleReaderMode}
      />
      <iframe
        title={lesson.fileName || "Presentation"}
        src={embedInfo.src}
        className={cn(
          "w-full h-[78dvh] min-h-[420px] bg-white border-0",
          isFullscreen && "flex-1 min-h-0 h-auto"
        )}
      />
      <DocumentBottomNav
        page={slideIndex}
        numPages={embedInfo.supportsSlideNav ? Number.MAX_SAFE_INTEGER : 0}
        isFullscreen={isFullscreen}
        onToggleReaderMode={toggleReaderMode}
        onPrev={() => setSlideIndex((s) => Math.max(1, s - 1))}
        onNext={() => setSlideIndex((s) => s + 1)}
      />
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
              className="p-2 rounded hover:bg-gray-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
          )}
          {onZoomIn && (
            <button
              type="button"
              onClick={onZoomIn}
              className="p-2 rounded hover:bg-gray-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
          )}
          {typeof scale === "number" && (
            <span className="text-xs text-text-secondary tabular-nums">
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
          disabled={numPages > 0 ? page <= 1 : false}
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
          disabled={numPages > 0 ? page >= numPages : false}
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

function normalizeExternalDocumentUrl(url, fileType) {
  if (!url) {
    return `${window.location.origin}${
      fileType === "ppt" ? PUBLIC_DEMO_PPT : PUBLIC_DEMO_PDF
    }`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("docs.google.com")) {
      const path = parsed.pathname;
      const idMatch = path.match(/\/d\/([^/]+)/);
      const fileId = idMatch?.[1];
      if (fileType === "pdf" && path.includes("/document/") && fileId) {
        return `https://docs.google.com/document/d/${fileId}/export?format=pdf`;
      }
      if (fileType === "pdf" && path.includes("/presentation/") && fileId) {
        return `https://docs.google.com/presentation/d/${fileId}/export/pdf`;
      }
      return parsed.toString();
    }
    if (parsed.hostname.includes("drive.google.com")) {
      const idMatch = parsed.pathname.match(/\/d\/([^/]+)/);
      const fileId = idMatch?.[1] || parsed.searchParams.get("id");
      if (fileId) {
        if (fileType === "pdf") {
          return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function getPresentationEmbedInfo(url, slideIndex = 1) {
  const fallback = {
    src: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      url
    )}`,
    supportsSlideNav: false,
  };
  try {
    const parsed = new URL(url);
    const isLocalHost =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    if (parsed.hostname.includes("docs.google.com")) {
      const idMatch = parsed.pathname.match(/\/d\/([^/]+)/);
      const fileId = idMatch?.[1];
      if (parsed.pathname.includes("/presentation/") && fileId) {
        return {
          src: `https://docs.google.com/presentation/d/${fileId}/embed?rm=minimal#slide=id.p${Math.max(
            1,
            slideIndex
          )}`,
          supportsSlideNav: true,
        };
      }
    }

    if (isLocalHost) {
      return {
        src: parsed.toString(),
        supportsSlideNav: false,
      };
    }

    const normalized = normalizeExternalDocumentUrl(url, "ppt");
    return {
      src: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        normalized
      )}`,
      supportsSlideNav: false,
    };
  } catch {
    return fallback;
  }
}
