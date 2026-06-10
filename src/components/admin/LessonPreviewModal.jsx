import { useTranslation } from "react-i18next";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { LessonContentBody } from "../learner/LessonContent";

export function LessonPreviewModal({ open, onClose, lesson }) {
  const { t } = useTranslation();

  if (!lesson) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("admin.lessonPreview")}
      size="xl"
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t("common.close")}
        </Button>
      }
    >
      <div className="space-y-4 overflow-y-auto max-h-[60vh] px-1">
        <div>
          <p className="text-xs text-text-secondary capitalize mb-1">
            {t(`lessonTypes.${lesson.type === "video" ? "videoYoutube" : lesson.type}`)}
          </p>
          <h3 className="text-lg font-semibold text-text-primary">{lesson.title}</h3>
          {lesson.description && (
            <p className="text-sm text-text-secondary mt-1">{lesson.description}</p>
          )}
        </div>
        <div className="border border-gray-100 rounded-lg p-4 md:p-5 bg-gray-50/50">
          <LessonContentBody lesson={lesson} preview />
        </div>
      </div>
    </Modal>
  );
}
