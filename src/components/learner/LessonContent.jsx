import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle, Video } from "lucide-react";
import { Button } from "../ui/Button";
import { DocumentViewer } from "./DocumentViewer";

export function TextLessonContent({ lesson, onComplete, completed, preview = false }) {
  const { t } = useTranslation();
  const hasContent = Boolean(lesson.content?.trim());

  return (
    <div>
      {hasContent ? (
        <div
          className="prose prose-sm max-w-none text-text-primary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      ) : (
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
            {preview ? t("admin.lessonPreviewEmpty") : t("learner.noDocumentAttached")}
          </p>
        </div>
      )}
      {!preview && !completed && onComplete && (
        <Button onClick={onComplete} className="mt-8" size="lg">
          <CheckCircle size={18} />
          {t("learner.markComplete")}
        </Button>
      )}
    </div>
  );
}

export function VideoLessonContent({ lesson, onComplete, completed, preview = false }) {
  const { t } = useTranslation();
  const videoId = lesson.videoId;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&fs=0`;

  return (
    <div>
      {videoId ? (
        <div
          className="document-viewer-wrapper rounded-lg overflow-hidden bg-black aspect-video"
          onContextMenu={(e) => e.preventDefault()}
        >
          <iframe
            src={embedUrl}
            title={lesson.title}
            className="w-full h-full"
            allowFullScreen={false}
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
            {t("learner.videoUnavailable")}
          </p>
        </div>
      )}

      {!preview && (
        <div className="mt-4 p-3 bg-primary-50 rounded-lg text-sm text-primary-700">
          <Video size={14} className="inline mr-1.5" />
          {t("learner.watchVideoHint")}
        </div>
      )}

      {!preview && !completed && onComplete && (
        <Button onClick={onComplete} className="mt-4" size="lg">
          <CheckCircle size={18} />
          {t("learner.markComplete")}
        </Button>
      )}
    </div>
  );
}

export function DocumentLessonContent({ lesson, onComplete, completed, preview = false }) {
  const { t } = useTranslation();
  const viewerRef = useRef(null);

  const blockShortcuts = (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      ["s", "p", "c", "a"].includes(e.key.toLowerCase())
    ) {
      e.preventDefault();
    }
  };

  if (!lesson.fileUrl) {
    return (
      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <AlertTriangle size={20} className="text-amber-500 shrink-0" />
        <p className="text-sm text-amber-700">
          {t("learner.noDocumentAttached")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={viewerRef}
        tabIndex={0}
        className="document-viewer-wrapper border border-gray-100 rounded-lg overflow-hidden outline-none"
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={blockShortcuts}
      >
        <DocumentViewer
          fileUrl={lesson.fileUrl}
          fileName={lesson.fileName}
          fileType={lesson.fileType}
        />

        {!preview && (
          <div className="bg-red-50 border-t border-red-100 px-4 py-2 text-center">
            <p className="text-xs text-red-500">{t("learner.documentProtection")}</p>
          </div>
        )}
      </div>

      {!preview && !completed && onComplete && (
        <Button onClick={onComplete} className="mt-4" size="lg">
          <CheckCircle size={18} />
          {t("learner.markComplete")}
        </Button>
      )}
    </div>
  );
}

export function LessonContentBody({ lesson, preview = false, onComplete, completed }) {
  if (lesson.type === "text") {
    return (
      <TextLessonContent
        lesson={lesson}
        preview={preview}
        onComplete={onComplete}
        completed={completed}
      />
    );
  }
  if (lesson.type === "video") {
    return (
      <VideoLessonContent
        lesson={lesson}
        preview={preview}
        onComplete={onComplete}
        completed={completed}
      />
    );
  }
  if (lesson.type === "document") {
    return (
      <DocumentLessonContent
        lesson={lesson}
        preview={preview}
        onComplete={onComplete}
        completed={completed}
      />
    );
  }
  return null;
}
