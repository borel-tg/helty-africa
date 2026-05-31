import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import {
  ArrowLeft, Plus, BookOpen, Video, FileText, Edit, Trash2,
  GripVertical, HelpCircle, Eye, Link2, Download, ExternalLink
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { FileUpload } from "../../components/ui/FileUpload";
import { useToast } from "../../components/ui/Toast";
import { useConvexSession } from "../../hooks/useConvexSession";

function extractYoutubeId(url) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") ?? undefined;
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || undefined;
  } catch {
    /* ignore */
  }
  return undefined;
}

const TYPE_ICONS = { text: BookOpen, video: Video, document: FileText };

function AddLessonModal({ open, onClose, onAdd }) {
  const toast = useToast();
  const [type, setType] = useState("text");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [document, setDocument] = useState(null);
  const [documentSource, setDocumentSource] = useState("upload");
  const [documentUrl, setDocumentUrl] = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    if (type === "document") {
      if (documentSource === "upload" && !document?.url) {
        toast.error("Please upload a PDF or PowerPoint file.");
        return;
      }
      if (documentSource === "url" && !documentUrl.trim()) {
        toast.error("Please add a valid online file URL.");
        return;
      }
      if (documentSource === "url" && !isValidUrl(documentUrl)) {
        toast.error("The file URL is not valid.");
        return;
      }
    }
    const resolvedUrl = documentSource === "upload" ? document?.url : documentUrl.trim();
    const resolvedFileName =
      documentSource === "upload" ? document?.fileName : getFileNameFromUrl(documentUrl);
    const resolvedFileType =
      resolvedFileName?.toLowerCase().endsWith(".ppt") ||
      resolvedFileName?.toLowerCase().endsWith(".pptx")
        ? "ppt"
        : "pdf";

    onAdd({
      type,
      title,
      description,
      videoUrl,
      fileUrl: resolvedUrl,
      fileName: resolvedFileName,
      fileType: resolvedFileType,
    });
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setDocument(null);
    setDocumentSource("upload");
    setDocumentUrl("");
    setType("text");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Lesson"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleAdd}
            disabled={
              type === "document" &&
              ((documentSource === "upload" && !document?.url) ||
                (documentSource === "url" && !documentUrl.trim()))
            }
          >
            Add Lesson
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select label="Lesson Type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="text">Text</option>
          <option value="video">Video (YouTube)</option>
          <option value="document">Document (PDF/PPT)</option>
        </Select>
        <Input label="Lesson Title *" placeholder="e.g. Introduction to Polio Eradication" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Description" placeholder="Brief description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        {type === "video" && (
          <Input label="YouTube URL" placeholder="https://www.youtube.com/watch?v=..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
        )}
        {type === "document" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDocumentSource("upload")}
                className={`px-3 py-2 rounded-md text-sm min-h-[44px] ${
                  documentSource === "upload"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-text-secondary"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setDocumentSource("url")}
                className={`px-3 py-2 rounded-md text-sm min-h-[44px] ${
                  documentSource === "url"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-text-secondary"
                }`}
              >
                Online URL
              </button>
            </div>

            {documentSource === "upload" ? (
              <FileUpload
                preset="document"
                label="Lesson document"
                value={document?.url}
                fileName={document?.fileName}
                onUploaded={setDocument}
              />
            ) : (
              <Input
                label="Document URL"
                placeholder="https://drive.google.com/... or direct PDF/PPT link"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                helperText="Supports public online files (PDF, PPT, PPTX)."
              />
            )}
          </div>
        )}
        {type === "text" && (
          <div className="border border-gray-200 rounded-lg p-4 text-center text-sm text-text-secondary">
            Rich text editor loads here (TipTap)
          </div>
        )}
      </div>
    </Modal>
  );
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function getFileNameFromUrl(value) {
  try {
    const parsed = new URL(value);
    const name = parsed.pathname.split("/").pop();
    return name || "online-document.pdf";
  } catch {
    return "online-document.pdf";
  }
}

function AddQuestionModal({ open, onClose, onAdd, onUpdate, initialQuestion }) {
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState([
    { id: "a", text: "" }, { id: "b", text: "" },
    { id: "c", text: "" }, { id: "d", text: "" },
  ]);
  const [correctId, setCorrectId] = useState("a");
  const isEdit = Boolean(initialQuestion);

  useEffect(() => {
    if (!open) return;
    if (!initialQuestion) {
      setQuestionText("");
      setOptions([
        { id: "a", text: "" }, { id: "b", text: "" },
        { id: "c", text: "" }, { id: "d", text: "" },
      ]);
      setCorrectId("a");
      return;
    }
    setQuestionText(initialQuestion.questionText || "");
    setOptions(
      initialQuestion.options?.length
        ? initialQuestion.options
        : [
            { id: "a", text: "" }, { id: "b", text: "" },
            { id: "c", text: "" }, { id: "d", text: "" },
          ]
    );
    setCorrectId(initialQuestion.correctOptionId || "a");
  }, [initialQuestion, open]);

  const updateOption = (id, text) =>
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));

  const handleAdd = () => {
    if (!questionText.trim()) return;
    const payload = { questionText, options, correctOptionId: correctId };
    if (isEdit) onUpdate?.(payload);
    else onAdd(payload);
    setQuestionText(""); setOptions([
      { id: "a", text: "" }, { id: "b", text: "" },
      { id: "c", text: "" }, { id: "d", text: "" },
    ]); setCorrectId("a");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Exam Question" : "Add Exam Question"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd}>{isEdit ? "Save Changes" : "Add Question"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Textarea label="Question Text *" placeholder="Enter the question..." value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} />
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Answer Options</label>
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={correctId === opt.id}
                onChange={() => setCorrectId(opt.id)} className="accent-primary w-4 h-4 shrink-0" />
              <input
                type="text"
                placeholder={`Option ${opt.id.toUpperCase()}`}
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
          <p className="text-xs text-text-secondary">Select the radio button for the correct answer.</p>
        </div>
      </div>
    </Modal>
  );
}

function AddResourceModal({ open, onClose, onAdd }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("link");
  const [resourceSource, setResourceSource] = useState("url");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceFile, setResourceFile] = useState(null);
  const [downloadable, setDownloadable] = useState(false);

  const handleAdd = () => {
    if (!title.trim()) {
      toast.error("Resource title is required.");
      return;
    }
    if (resourceSource === "url" && !resourceUrl.trim()) {
      toast.error("Resource URL is required.");
      return;
    }
    if (resourceSource === "upload" && !resourceFile?.url) {
      toast.error("Upload a resource file first.");
      return;
    }

    onAdd({
      title,
      description,
      type: resourceType,
      url: resourceSource === "upload" ? resourceFile?.url : resourceUrl.trim(),
      fileName: resourceSource === "upload" ? resourceFile?.fileName : undefined,
      downloadable: resourceSource === "upload" || downloadable,
    });

    setTitle("");
    setDescription("");
    setResourceType("link");
    setResourceSource("url");
    setResourceUrl("");
    setResourceFile(null);
    setDownloadable(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Module Resource"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd}>Add Resource</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Resource title *"
          placeholder="e.g. Cold Chain Checklist"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          label="Description"
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <Select
          label="Resource type"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
        >
          <option value="link">External link</option>
          <option value="video">Video link</option>
          <option value="pdf">PDF</option>
          <option value="ppt">PowerPoint</option>
          <option value="image">Image</option>
        </Select>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setResourceSource("url")}
            className={`px-3 py-2 rounded-md text-sm min-h-[44px] ${
              resourceSource === "url"
                ? "bg-primary text-white"
                : "bg-gray-100 text-text-secondary"
            }`}
          >
            Online URL
          </button>
          <button
            type="button"
            onClick={() => setResourceSource("upload")}
            className={`px-3 py-2 rounded-md text-sm min-h-[44px] ${
              resourceSource === "upload"
                ? "bg-primary text-white"
                : "bg-gray-100 text-text-secondary"
            }`}
          >
            Upload file
          </button>
        </div>

        {resourceSource === "url" ? (
          <Input
            label="Resource URL"
            placeholder="https://..."
            value={resourceUrl}
            onChange={(e) => setResourceUrl(e.target.value)}
          />
        ) : (
          <FileUpload
            preset={resourceType === "image" ? "thumbnail" : "document"}
            label="Upload resource file"
            value={resourceFile?.url}
            fileName={resourceFile?.fileName}
            onUploaded={setResourceFile}
          />
        )}

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={downloadable}
            onChange={(e) => setDownloadable(e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          Mark as downloadable resource
        </label>
      </div>
    </Modal>
  );
}

export default function ModuleEditorPage() {
  const { t } = useTranslation();
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { convexUser, isLoading: sessionLoading, convexUserMissing } = useConvexSession();

  const module = useQuery(
    api.modules.getById,
    moduleId ? { moduleId } : "skip"
  );
  const lessons = useQuery(
    api.lessons.listByModule,
    moduleId ? { moduleId } : "skip"
  );
  const questions = useQuery(
    api.exams.listQuestions,
    moduleId ? { moduleId } : "skip"
  );
  const resources = useQuery(
    api.moduleResources.listByModule,
    moduleId ? { moduleId } : "skip"
  );

  const createLesson = useMutation(api.lessons.create);
  const removeLessonMutation = useMutation(api.lessons.remove);
  const createQuestion = useMutation(api.exams.createQuestion);
  const updateQuestionMutation = useMutation(api.exams.updateQuestion);
  const deleteQuestionMutation = useMutation(api.exams.deleteQuestion);
  const createResource = useMutation(api.moduleResources.create);
  const removeResourceMutation = useMutation(api.moduleResources.remove);
  const updateModule = useMutation(api.modules.update);

  const [activeTab, setActiveTab] = useState("lessons");
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [deleteLesson, setDeleteLesson] = useState(null);
  const [deleteResource, setDeleteResource] = useState(null);
  const [deleteQuestion, setDeleteQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [settings, setSettings] = useState({
    title: "",
    description: "",
    passingScore: 70,
    maxRetakes: 3,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!module) return;
    setSettings({
      title: module.title,
      description: module.description,
      passingScore: module.passingScore,
      maxRetakes: module.maxRetakes,
    });
  }, [module?._id]);

  const addLesson = async (data) => {
    if (!convexUser?.organizationId) return;
    try {
      await createLesson({
        moduleId,
        organizationId: convexUser.organizationId,
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        videoUrl: data.videoUrl || undefined,
        videoId: extractYoutubeId(data.videoUrl),
        fileUrl: data.fileUrl || undefined,
        fileType: data.fileType || undefined,
        fileName: data.fileName || undefined,
      });
      toast.success(t("admin.lessonAdded"));
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const addQuestion = async (data) => {
    if (!convexUser?.organizationId) return;
    try {
      await createQuestion({
        moduleId,
        organizationId: convexUser.organizationId,
        questionText: data.questionText,
        options: data.options,
        correctOptionId: data.correctOptionId,
      });
      toast.success(t("admin.questionAdded"));
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const updateQuestion = async (data) => {
    if (!editingQuestion) return;
    try {
      await updateQuestionMutation({
        questionId: editingQuestion._id,
        questionText: data.questionText,
        options: data.options,
        correctOptionId: data.correctOptionId,
      });
      toast.success(t("admin.questionUpdated"));
      setEditingQuestion(null);
      setShowAddQuestion(false);
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const removeLesson = async () => {
    if (!deleteLesson) return;
    try {
      await removeLessonMutation({ lessonId: deleteLesson._id });
      toast.success(t("admin.lessonDeleted"));
      setDeleteLesson(null);
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const removeQuestion = async () => {
    if (!deleteQuestion) return;
    try {
      await deleteQuestionMutation({ questionId: deleteQuestion._id });
      toast.success(t("admin.questionDeleted"));
      setDeleteQuestion(null);
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const addResource = async (data) => {
    if (!convexUser?.organizationId) return;
    try {
      await createResource({
        moduleId,
        organizationId: convexUser.organizationId,
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        url: data.url,
        fileName: data.fileName,
        downloadable: data.downloadable,
      });
      toast.success(t("admin.resourceAdded"));
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const removeResource = async () => {
    if (!deleteResource) return;
    try {
      await removeResourceMutation({ resourceId: deleteResource._id });
      toast.success(t("admin.resourceDeleted"));
      setDeleteResource(null);
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const togglePublish = async () => {
    if (!module) return;
    const nextStatus = module.status === "published" ? "draft" : "published";
    try {
      await updateModule({ moduleId, status: nextStatus });
      toast.success(
        nextStatus === "published"
          ? t("admin.modulePublished", { title: module.title })
          : t("admin.moduleUnpublished", { title: module.title })
      );
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateModule({
        moduleId,
        title: settings.title,
        description: settings.description,
        passingScore: Number(settings.passingScore),
        maxRetakes:
          settings.maxRetakes === "unlimited"
            ? "unlimited"
            : Number(settings.maxRetakes),
      });
      toast.success(t("admin.settingsSaved"));
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    } finally {
      setSavingSettings(false);
    }
  };

  if (sessionLoading || module === undefined || lessons === undefined || questions === undefined || resources === undefined) {
    return (
      <div className="p-4 md:p-6 text-sm text-text-secondary">{t("common.loading")}</div>
    );
  }

  if (convexUserMissing) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-sm text-amber-600">{t("evaluation.convexRequired")}</p>
      </div>
    );
  }

  if (module === null) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-sm text-text-secondary">{t("learner.moduleNotFound")}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/modules")}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const lessonList = lessons ?? [];
  const questionList = questions ?? [];
  const resourceList = resources ?? [];

  const tabs = [
    { id: "lessons", label: `${t("admin.lessonsTab")} (${lessonList.length})` },
    { id: "exam", label: `${t("admin.examTab")} (${questionList.length})` },
    { id: "resources", label: `${t("admin.resourcesTab")} (${resourceList.length})` },
    { id: "settings", label: t("common.settings") },
  ];

  return (
    <div className="p-4 md:p-6 w-full">
      <button onClick={() => navigate("/admin/modules")} className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Modules
      </button>

      {/* Module header */}
      <div className="bg-white rounded-card shadow-card p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-text-primary">{module.title}</h1>
              <Badge variant={module.status === "published" ? "success" : "default"}>{module.status}</Badge>
            </div>
            <p className="text-sm text-text-secondary">{module.description}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm"><Eye size={14} /> Preview</Button>
            <Button size="sm" onClick={togglePublish}>
              {module.status === "published" ? t("common.unpublish") : t("common.publish")}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
              activeTab === tab.id ? "bg-white shadow-sm text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lessons tab */}
      {activeTab === "lessons" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddLesson(true)}>
              <Plus size={14} /> Add Lesson
            </Button>
          </div>
          {lessonList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-card shadow-card">
              <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-text-secondary">No lessons yet. Add your first lesson.</p>
            </div>
          ) : (
            lessonList.map((lesson, idx) => {
              const Icon = TYPE_ICONS[lesson.type] || BookOpen;
              return (
                <div key={lesson._id} className="bg-white rounded-card shadow-card p-4 flex items-center gap-3">
                  <GripVertical size={16} className="text-gray-300 shrink-0 cursor-grab hidden sm:block" />
                  <div className="w-8 h-8 rounded bg-primary-50 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{idx + 1}. {lesson.title}</p>
                    <p className="text-xs text-text-secondary capitalize">{lesson.type}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => navigate(`/admin/modules/${moduleId}/lesson/${lesson._id}`)}
                      className="p-2 text-gray-400 hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => setDeleteLesson(lesson)}
                      className="p-2 text-gray-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Exam tab */}
      {activeTab === "exam" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddQuestion(true)}>
              <Plus size={14} /> Add Question
            </Button>
          </div>
          {questionList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-card shadow-card">
              <HelpCircle size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-text-secondary">No questions yet. Add exam questions.</p>
            </div>
          ) : (
            questionList.map((q, idx) => (
              <div key={q._id} className="bg-white rounded-card shadow-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-text-primary flex-1">
                    {idx + 1}. {q.questionText}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setShowAddQuestion(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-primary"
                      title="Edit question"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteQuestion(q)}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                      title="Delete question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {q.options.map((opt) => (
                    <div key={opt.id} className={`text-xs px-3 py-1.5 rounded ${opt.id === q.correctOptionId ? "bg-green-50 text-green-700 font-medium" : "bg-gray-50 text-text-secondary"}`}>
                      {opt.id.toUpperCase()}. {opt.text}
                      {opt.id === q.correctOptionId && " ✓"}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Resources tab */}
      {activeTab === "resources" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddResource(true)}>
              <Plus size={14} /> Add Resource
            </Button>
          </div>
          {resourceList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-card shadow-card">
              <Link2 size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-text-secondary">No resources yet. Add module resources.</p>
            </div>
          ) : (
            resourceList.map((resource) => (
              <div key={resource._id} className="bg-white rounded-card shadow-card p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary-50 flex items-center justify-center shrink-0">
                  {resource.downloadable ? (
                    <Download size={16} className="text-primary" />
                  ) : (
                    <ExternalLink size={16} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{resource.title}</p>
                  {resource.description && (
                    <p className="text-xs text-text-secondary truncate">{resource.description}</p>
                  )}
                  <p className="text-[10px] text-text-secondary uppercase mt-0.5">
                    {resource.type}
                  </p>
                </div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-gray-400 hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Open resource"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  onClick={() => setDeleteResource(resource)}
                  className="p-2 text-gray-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Delete resource"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-card shadow-card p-5 space-y-4">
          <h3 className="text-base font-semibold text-text-primary">Module Settings</h3>
          <Input
            label={t("admin.moduleTitle")}
            value={settings.title}
            onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))}
          />
          <Textarea
            label={t("admin.description")}
            value={settings.description}
            onChange={(e) => setSettings((s) => ({ ...s, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t("admin.passingScore")}
              value={String(settings.passingScore)}
              onChange={(e) => setSettings((s) => ({ ...s, passingScore: e.target.value }))}
            >
              {[50,60,70,75,80,85,90].map(v => <option key={v} value={v}>{v}%</option>)}
            </Select>
            <Select
              label={t("admin.maxRetakes")}
              value={String(settings.maxRetakes)}
              onChange={(e) => setSettings((s) => ({ ...s, maxRetakes: e.target.value }))}
            >
              {[1,2,3,5,10].map(v => <option key={v} value={v}>{v}</option>)}
              <option value="unlimited">{t("common.unlimited")}</option>
            </Select>
          </div>
          <div className="flex justify-end pt-2">
            <Button loading={savingSettings} onClick={saveSettings}>
              {t("common.saveChanges")}
            </Button>
          </div>
        </div>
      )}

      <AddLessonModal open={showAddLesson} onClose={() => setShowAddLesson(false)} onAdd={addLesson} />
      <AddQuestionModal
        open={showAddQuestion}
        onClose={() => {
          setShowAddQuestion(false);
          setEditingQuestion(null);
        }}
        onAdd={addQuestion}
        onUpdate={updateQuestion}
        initialQuestion={editingQuestion}
      />
      <AddResourceModal open={showAddResource} onClose={() => setShowAddResource(false)} onAdd={addResource} />
      <ConfirmModal open={!!deleteLesson} onClose={() => setDeleteLesson(null)} onConfirm={removeLesson}
        title="Delete Lesson" message={`Delete "${deleteLesson?.title}"? This cannot be undone.`} confirmLabel="Delete" />
      <ConfirmModal open={!!deleteResource} onClose={() => setDeleteResource(null)} onConfirm={removeResource}
        title="Delete Resource" message={`Delete "${deleteResource?.title}"? This cannot be undone.`} confirmLabel="Delete" />
      <ConfirmModal open={!!deleteQuestion} onClose={() => setDeleteQuestion(null)} onConfirm={removeQuestion}
        title="Delete Question" message={`Delete this question? This cannot be undone.`} confirmLabel="Delete" />
    </div>
  );
}
