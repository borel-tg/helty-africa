import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen, Edit, Trash2, Eye, EyeOff, ChevronRight, GripVertical } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { FileUpload } from "../../components/ui/FileUpload";
import { useToast } from "../../components/ui/Toast";
import { MOCK_MODULES, MOCK_LESSONS } from "../../lib/mockData";

function CreateModuleModal({ open, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: "",
    description: "",
    passingScore: "70",
    maxRetakes: "3",
  });
  const [loading, setLoading] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);

  const update = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success("Module created successfully!");
    setThumbnail(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Module"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={loading} onClick={handleSubmit}>Create Module</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Module Title *" placeholder="e.g. Polio Campaign Protocols" value={form.title} onChange={update("title")} />
        <Textarea label="Description *" placeholder="Brief overview of what learners will learn..." value={form.description} onChange={update("description")} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Passing Score (%)" value={form.passingScore} onChange={update("passingScore")}>
            {[50,60,70,75,80,85,90].map(v => <option key={v} value={v}>{v}%</option>)}
          </Select>
          <Select label="Max Retakes" value={form.maxRetakes} onChange={update("maxRetakes")}>
            {[1,2,3,5,10].map(v => <option key={v} value={v}>{v}</option>)}
            <option value="unlimited">Unlimited</option>
          </Select>
        </div>
        <FileUpload
          preset="thumbnail"
          label="Module thumbnail (optional)"
          value={thumbnail?.url}
          onUploaded={setThumbnail}
        />
      </div>
    </Modal>
  );
}

export default function ModulesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [modules, setModules] = useState(MOCK_MODULES);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const toggleStatus = (mod) => {
    setModules((prev) =>
      prev.map((m) =>
        m._id === mod._id
          ? { ...m, status: m.status === "published" ? "draft" : "published" }
          : m
      )
    );
    toast.success(
      mod.status === "published"
        ? `"${mod.title}" unpublished`
        : `"${mod.title}" published`
    );
  };

  const handleDelete = () => {
    setModules((prev) => prev.filter((m) => m._id !== deleteTarget._id));
    toast.success("Module deleted");
    setDeleteTarget(null);
  };

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Modules</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {modules.filter((m) => m.status === "published").length} published ·{" "}
            {modules.filter((m) => m.status === "draft").length} draft
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Module
        </Button>
      </div>

      <div className="space-y-3">
        {modules.map((mod) => {
          const lessonCount = (MOCK_LESSONS[mod._id] || []).length;
          return (
            <div
              key={mod._id}
              className="bg-white rounded-card shadow-card p-4 flex items-center gap-4 group hover:shadow-md transition-all"
            >
              {/* Drag handle */}
              <GripVertical size={16} className="text-gray-300 shrink-0 cursor-grab hidden sm:block" />

              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                <BookOpen size={24} className="text-primary opacity-60" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="text-sm font-semibold text-text-primary truncate">
                    {mod.title}
                  </h3>
                  <Badge variant={mod.status === "published" ? "success" : "default"}>
                    {mod.status}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary line-clamp-1 mb-1">
                  {mod.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span>{lessonCount} lessons</span>
                  <span>Pass: {mod.passingScore}%</span>
                  <span>Retakes: {mod.maxRetakes}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleStatus(mod)}
                  title={mod.status === "published" ? "Unpublish" : "Publish"}
                  className="p-2 text-gray-400 hover:text-primary rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  {mod.status === "published" ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => navigate(`/admin/modules/${mod._id}`)}
                  title="Edit"
                  className="p-2 text-gray-400 hover:text-primary rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(mod)}
                  title="Delete"
                  className="p-2 text-gray-400 hover:text-red-500 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => navigate(`/admin/modules/${mod._id}`)}
                  className="p-2 text-gray-400 hover:text-primary rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {modules.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-text-secondary">No modules yet</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create First Module
            </Button>
          </div>
        )}
      </div>

      <CreateModuleModal open={showCreate} onClose={() => setShowCreate(false)} />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Module"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? Lesson content will be removed, but employee progress data is retained.`}
        confirmLabel="Delete Module"
      />
    </div>
  );
}
