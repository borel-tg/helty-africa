import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import { Plus, GraduationCap, ChevronRight, Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmModal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { useConvexSession } from "../../hooks/useConvexSession";

export default function TrainingProgramsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { convexUser, isLoading, convexUserMissing } = useConvexSession();
  const createProgram = useMutation(api.trainingPrograms.create);
  const deleteProgram = useMutation(api.trainingPrograms.remove);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const programs = useQuery(
    api.trainingPrograms.listForOrg,
    convexUser?.organizationId
      ? { organizationId: convexUser.organizationId }
      : "skip"
  );

  const handleCreate = async () => {
    if (!convexUser?._id) {
      toast.error(t("evaluation.convexRequired"));
      return;
    }
    const id = await createProgram({
      organizationId: convexUser.organizationId,
      title: t("evaluation.newProgramTitle"),
      description: "",
      createdBy: convexUser._id,
    });
    navigate(`/admin/programs/${id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProgram({ programId: deleteTarget._id });
      toast.success(t("evaluation.programDeleted"));
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

  const displayPrograms = programs ?? [];

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {t("evaluation.adminProgramsTitle")}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {t("evaluation.adminProgramsSubtitle")}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={16} />
          {t("evaluation.newProgram")}
        </Button>
      </div>

      <div className="space-y-3">
        {displayPrograms.map((p) => (
          <Card
            key={p._id}
            className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div
              className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
              onClick={() => navigate(`/admin/programs/${p._id}`)}
            >
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <GraduationCap size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary">{p.title}</p>
                <p className="text-xs text-text-secondary">
                  {t("evaluation.moduleCount", {
                    count: p.moduleCount ?? 0,
                  })}
                  {" · "}
                  {p.status === "published"
                    ? t("common.published")
                    : t("common.draft")}
                  {!p.learnerReady && p.status === "published" && (
                    <span className="text-amber-600">
                      {" "}
                      — {t("evaluation.notLearnerReady")}
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-300 shrink-0" />
            </div>
            <button
              type="button"
              title={t("evaluation.deleteProgram")}
              onClick={() => setDeleteTarget(p)}
              className="p-2 text-gray-400 hover:text-red-500 rounded transition-colors shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </Card>
        ))}

        {displayPrograms.length === 0 && (
          <div className="text-center py-16">
            <GraduationCap size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-text-secondary">
              {t("evaluation.noPrograms")}
            </p>
            <Button className="mt-4" onClick={handleCreate}>
              <Plus size={16} />
              {t("evaluation.newProgram")}
            </Button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("evaluation.deleteProgram")}
        message={t("evaluation.deleteProgramConfirm", { title: deleteTarget?.title })}
        confirmLabel={t("evaluation.deleteProgram")}
      />
    </div>
  );
}
