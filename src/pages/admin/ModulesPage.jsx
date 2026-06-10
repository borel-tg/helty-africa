import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import { Plus, BookOpen, Edit, Trash2, Eye, EyeOff, ChevronRight, GripVertical } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { FileUpload } from "../../components/ui/FileUpload";
import { useToast } from "../../components/ui/Toast";
import { useConvexSession } from "../../hooks/useConvexSession";

function CreateModuleModal({ open, onClose, convexUser, onCreated }) {
  const { t } = useTranslation();
  const toast = useToast();
  const createModule = useMutation(api.modules.create);
  const [form, setForm] = useState({
    title: "",
    description: "",
    passingScore: "70",
    maxRetakes: "2",
  });
  const [loading, setLoading] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);

  const update = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !convexUser?._id) return;
    setLoading(true);
    try {
      const id = await createModule({
        organizationId: convexUser.organizationId,
        title: form.title.trim(),
        description: form.description.trim(),
        thumbnailUrl: thumbnail?.url,
        passingScore: Number(form.passingScore),
        maxRetakes: form.maxRetakes === "unlimited" ? "unlimited" : Number(form.maxRetakes),
      });
      toast.success(t("admin.moduleCreated"));
      setForm({ title: "", description: "", passingScore: "70", maxRetakes: "2" });
      setThumbnail(null);
      onClose();
      onCreated(id);
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("admin.createModule")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button loading={loading} onClick={handleSubmit}>{t("admin.createModule")}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label={`${t("admin.moduleTitle")} *`} placeholder={t("admin.moduleTitlePlaceholder")} value={form.title} onChange={update("title")} />
        <Textarea label={`${t("admin.moduleDescription")} *`} placeholder={t("admin.moduleDescriptionPlaceholder")} value={form.description} onChange={update("description")} />
        <div className="grid grid-cols-2 gap-4">
          <Select label={t("admin.passingScore")} value={form.passingScore} onChange={update("passingScore")}>
            {[50,60,70,75,80,85,90].map(v => <option key={v} value={v}>{v}%</option>)}
          </Select>
          <Select label={t("admin.maxRetakes")} value={form.maxRetakes} onChange={update("maxRetakes")}>
            {[1,2,3,5,10].map(v => <option key={v} value={v}>{v}</option>)}
            <option value="unlimited">{t("admin.unlimited")}</option>
          </Select>
        </div>
        <FileUpload
          preset="thumbnail"
          label={t("admin.moduleThumbnail")}
          value={thumbnail?.url}
          onUploaded={setThumbnail}
        />
      </div>
    </Modal>
  );
}

export default function ModulesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { convexUser, isLoading, convexUserMissing } = useConvexSession();
  const updateModule = useMutation(api.modules.update);
  const removeModule = useMutation(api.modules.remove);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const modules = useQuery(
    api.modules.list,
    convexUser?.organizationId
      ? { organizationId: convexUser.organizationId }
      : "skip"
  );

  const toggleStatus = async (mod) => {
    const nextStatus = mod.status === "published" ? "draft" : "published";
    try {
      await updateModule({ moduleId: mod._id, status: nextStatus });
      toast.success(
        nextStatus === "published"
          ? t("admin.modulePublished", { title: mod.title })
          : t("admin.moduleUnpublished", { title: mod.title })
      );
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeModule({ moduleId: deleteTarget._id });
      toast.success(t("admin.moduleDeleted"));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 text-sm text-text-secondary">
        {t("common.loading")}
      </div>
    );
  }

  if (convexUserMissing) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-sm text-amber-600">{t("evaluation.convexRequired")}</p>
      </div>
    );
  }

  const displayModules = modules ?? [];

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">{t("admin.modules")}</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {displayModules.filter((m) => m.status === "published").length} {t("common.published").toLowerCase()} ·{" "}
            {displayModules.filter((m) => m.status === "draft").length} {t("common.draft").toLowerCase()}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          {t("admin.newModule")}
        </Button>
      </div>

      <div className="space-y-3">
        {displayModules.map((mod) => (
          <div
            key={mod._id}
            className="bg-white rounded-card shadow-card p-4 flex items-center gap-4 group hover:shadow-md transition-all"
          >
            <GripVertical size={16} className="text-gray-300 shrink-0 cursor-grab hidden sm:block" />

            <div className="w-14 h-14 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <BookOpen size={24} className="text-primary opacity-60" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="text-sm font-semibold text-text-primary truncate">
                  {mod.title}
                </h3>
                <Badge variant={mod.status === "published" ? "success" : "default"}>
                  {t(`status.${mod.status}`)}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary line-clamp-1 mb-1">
                {mod.description}
              </p>
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <span>{mod.lessonCount ?? 0} {t("admin.lessons")}</span>
                <span>{t("admin.pass")}: {mod.passingScore}%</span>
                <span>{t("admin.retakes")}: {mod.maxRetakes}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleStatus(mod)}
                title={mod.status === "published" ? t("admin.unpublish") : t("admin.publish")}
                className="p-2 text-gray-400 hover:text-primary rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {mod.status === "published" ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => navigate(`/admin/modules/${mod._id}`)}
                title={t("common.edit")}
                className="p-2 text-gray-400 hover:text-primary rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => setDeleteTarget(mod)}
                title={t("common.delete")}
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
        ))}

        {displayModules.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-text-secondary">{t("admin.noModules")}</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> {t("admin.createFirstModule")}
            </Button>
          </div>
        )}
      </div>

      <CreateModuleModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        convexUser={convexUser}
        onCreated={(id) => navigate(`/admin/modules/${id}`)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("admin.deleteModule")}
        message={t("admin.deleteModuleConfirm", { title: deleteTarget?.title })}
        confirmLabel={t("admin.deleteModule")}
      />
    </div>
  );
}
