import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, BookOpen, Video, FileText, Edit, Trash2,
  GripVertical, Settings, HelpCircle, Eye, ChevronRight, Link2, Download, ExternalLink
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { FileUpload } from "../../components/ui/FileUpload";
import { useToast } from "../../components/ui/Toast";
import { MOCK_MODULES, MOCK_LESSONS, MOCK_EXAM_QUESTIONS, MOCK_MODULE_RESOURCES } from "../../lib/mockData";

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
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const module = MOCK_MODULES.find((m) => m._id === moduleId) || MOCK_MODULES[0];
  const [lessons, setLessons] = useState(MOCK_LESSONS[moduleId] || []);
  const [questions, setQuestions] = useState(MOCK_EXAM_QUESTIONS[moduleId] || []);
  const [resources, setResources] = useState(MOCK_MODULE_RESOURCES[moduleId] || []);
  const [activeTab, setActiveTab] = useState("lessons");
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [deleteLesson, setDeleteLesson] = useState(null);
  const [deleteResource, setDeleteResource] = useState(null);
  const [deleteQuestion, setDeleteQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const addLesson = (data) => {
    const newLesson = { _id: `les_${Date.now()}`, moduleId, ...data, order: lessons.length, createdAt: Date.now(), updatedAt: Date.now() };
    setLessons((prev) => [...prev, newLesson]);
    toast.success("Lesson added!");
  };

  const addQuestion = (data) => {
    const newQ = { _id: `q_${Date.now()}`, moduleId, ...data, order: questions.length, createdAt: Date.now() };
    setQuestions((prev) => [...prev, newQ]);
    toast.success("Question added!");
  };

  const updateQuestion = (data) => {
    if (!editingQuestion) return;
    setQuestions((prev) =>
      prev.map((q) => (q._id === editingQuestion._id ? { ...q, ...data } : q))
    );
    toast.success("Question updated!");
    setEditingQuestion(null);
    setShowAddQuestion(false);
  };

  const removeLesson = () => {
    setLessons((prev) => prev.filter((l) => l._id !== deleteLesson._id));
    toast.success("Lesson deleted");
    setDeleteLesson(null);
  };

  const removeQuestion = () => {
    setQuestions((prev) => prev.filter((q) => q._id !== deleteQuestion._id));
    toast.success("Question deleted");
    setDeleteQuestion(null);
  };

  const addResource = (data) => {
    const newResource = {
      _id: `res_${Date.now()}`,
      moduleId,
      ...data,
    };
    setResources((prev) => [...prev, newResource]);
    toast.success("Resource added!");
  };

  const removeResource = () => {
    setResources((prev) => prev.filter((r) => r._id !== deleteResource._id));
    toast.success("Resource deleted");
    setDeleteResource(null);
  };

  const tabs = [
    { id: "lessons", label: `Lessons (${lessons.length})` },
    { id: "exam", label: `Exam (${questions.length} Qs)` },
    { id: "resources", label: `Resources (${resources.length})` },
    { id: "settings", label: "Settings" },
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
            <Button size="sm">{module.status === "published" ? "Unpublish" : "Publish"}</Button>
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
          {lessons.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-card shadow-card">
              <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-text-secondary">No lessons yet. Add your first lesson.</p>
            </div>
          ) : (
            lessons.map((lesson, idx) => {
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
          {questions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-card shadow-card">
              <HelpCircle size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-text-secondary">No questions yet. Add exam questions.</p>
            </div>
          ) : (
            questions.map((q, idx) => (
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
          {resources.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-card shadow-card">
              <Link2 size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-text-secondary">No resources yet. Add module resources.</p>
            </div>
          ) : (
            resources.map((resource) => (
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
          <Input label="Module Title" defaultValue={module.title} />
          <Textarea label="Description" defaultValue={module.description} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Passing Score (%)" defaultValue={module.passingScore}>
              {[50,60,70,75,80,85,90].map(v => <option key={v} value={v}>{v}%</option>)}
            </Select>
            <Select label="Max Retakes" defaultValue={module.maxRetakes}>
              {[1,2,3,5,10].map(v => <option key={v} value={v}>{v}</option>)}
              <option value="unlimited">Unlimited</option>
            </Select>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => toast.success("Settings saved!")}>Save Settings</Button>
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
