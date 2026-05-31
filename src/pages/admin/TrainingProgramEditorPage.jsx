import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import { useConvexSession } from "../../hooks/useConvexSession";
import { DEFAULT_EVALUATION_POLICY } from "../../lib/evaluation";

export default function TrainingProgramEditorPage() {
  const { t } = useTranslation();
  const { programId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { convexUser } = useConvexSession();

  const [searchTerm, setSearchTerm] = useState("");
  const [policy, setPolicy] = useState({ ...DEFAULT_EVALUATION_POLICY });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [accessMode, setAccessMode] = useState("open");
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);

  const data = useQuery(
    api.trainingPrograms.getById,
    programId ? { programId } : "skip"
  );

  const orgModules = useQuery(
    api.modules.list,
    convexUser?.organizationId
      ? { organizationId: convexUser.organizationId }
      : "skip"
  );

  const searchResults = useQuery(
    api.generalExams.searchModuleQuestions,
    convexUser?.organizationId && searchTerm.length > 2
      ? {
          organizationId: convexUser.organizationId,
          search: searchTerm,
        }
      : "skip"
  );

  const updateProgram = useMutation(api.trainingPrograms.update);
  const addModule = useMutation(api.trainingPrograms.addModule);
  const removeModule = useMutation(api.trainingPrograms.removeModule);
  const importQuestion = useMutation(api.generalExams.importFromModuleQuestion);

  useEffect(() => {
    if (!data?.program) return;
    const p = data.program;
    setTitle(p.title);
    setDescription(p.description);
    setAccessMode(p.accessMode);
    setStatus(p.status);
    setPolicy(p.evaluationPolicy ?? { ...DEFAULT_EVALUATION_POLICY });
  }, [data?.program?._id]);

  const handleSave = async () => {
    if (!programId) return;
    if (policy.moduleExamWeight + policy.generalExamWeight !== 100) {
      toast.error(t("evaluation.weightsMustSum100"));
      return;
    }
    setSaving(true);
    try {
      await updateProgram({
        programId,
        title,
        description,
        accessMode,
        status,
        evaluationPolicy: policy,
      });
      toast.success(t("common.saved"));
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async (moduleId) => {
    if (!programId || !convexUser) return;
    try {
      const mod = orgModules?.find((m) => m._id === moduleId);
      await addModule({
        programId,
        moduleId,
        organizationId: convexUser.organizationId,
      });
      if (mod?.assignedProgramId && mod.assignedProgramId !== programId) {
        toast.success(
          t("evaluation.moduleMovedFromProgram", { program: mod.assignedProgramTitle })
        );
      } else {
        toast.success(t("evaluation.moduleAdded"));
      }
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const handleRemoveModule = async (linkId) => {
    try {
      await removeModule({ linkId });
      toast.success(t("evaluation.moduleRemoved"));
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const linkedModuleIds = new Set(data?.modules?.map((m) => m._id) ?? []);
  const availableModules = (orgModules ?? []).filter(
    (m) => !linkedModuleIds.has(m._id)
  );

  if (data === undefined) {
    return (
      <div className="p-4 md:p-6 text-sm text-text-secondary">
        {t("common.loading")}
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-sm text-text-secondary">{t("evaluation.programNotFound")}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/programs")}>
          {t("evaluation.backToPrograms")}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <button
        onClick={() => navigate("/admin/programs")}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-4"
      >
        <ArrowLeft size={16} />
        {t("evaluation.backToPrograms")}
      </button>

      <h1 className="text-xl font-semibold mb-6">{title || t("evaluation.newProgram")}</h1>

      <Card className="p-5 mb-6 space-y-4">
        <h2 className="font-semibold">{t("evaluation.generalInfo")}</h2>
        <label className="block text-sm">
          <span className="text-text-secondary">{t("evaluation.programTitle")}</span>
          <input
            className="input w-full mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-text-secondary">{t("evaluation.fieldDescription")}</span>
          <textarea
            className="input w-full mt-1 min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="text-sm">
            {t("evaluation.accessMode")}
            <select
              className="input mt-1 block"
              value={accessMode}
              onChange={(e) => setAccessMode(e.target.value)}
            >
              <option value="open">{t("evaluation.accessOpen")}</option>
              <option value="closed">{t("evaluation.accessClosed")}</option>
            </select>
          </label>
          <label className="text-sm">
            {t("evaluation.fieldStatus")}
            <select
              className="input mt-1 block"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">{t("common.draft")}</option>
              <option value="published">{t("common.published")}</option>
            </select>
          </label>
        </div>
        {!data.learnerReady && status === "published" && (
          <p className="text-sm text-amber-600">{t("evaluation.publishRequiresModule")}</p>
        )}
      </Card>

      <Card className="p-5 mb-6 space-y-4">
        <h2 className="font-semibold">{t("evaluation.policyTitle")}</h2>
        <label className="block text-sm">
          {t("evaluation.passThreshold")}
          <input
            type="number"
            className="input w-full mt-1 max-w-xs"
            value={policy.programPassThreshold}
            onChange={(e) =>
              setPolicy((p) => ({
                ...p,
                programPassThreshold: Number(e.target.value),
              }))
            }
          />
        </label>
        <div className="flex gap-4 flex-wrap">
          <label className="text-sm">
            {t("evaluation.moduleWeight")}
            <input
              type="number"
              className="input mt-1 block w-24"
              value={policy.moduleExamWeight}
              onChange={(e) =>
                setPolicy((p) => ({
                  ...p,
                  moduleExamWeight: Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="text-sm">
            {t("evaluation.generalWeight")}
            <input
              type="number"
              className="input mt-1 block w-24"
              value={policy.generalExamWeight}
              onChange={(e) =>
                setPolicy((p) => ({
                  ...p,
                  generalExamWeight: Number(e.target.value),
                }))
              }
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={policy.generalExamEnabled}
            onChange={(e) =>
              setPolicy((p) => ({ ...p, generalExamEnabled: e.target.checked }))
            }
          />
          {t("evaluation.enableFinalExam")}
        </label>
        <label className="block text-sm">
          {t("evaluation.unlockMode")}
          <select
            className="input mt-1 block w-full max-w-md"
            value={policy.unlockGeneralExamMode}
            onChange={(e) =>
              setPolicy((p) => ({
                ...p,
                unlockGeneralExamMode: e.target.value,
              }))
            }
          >
            <option value="all_module_attempts">
              {t("evaluation.unlockAttempts")}
            </option>
            <option value="all_module_passes">
              {t("evaluation.unlockPasses")}
            </option>
          </select>
        </label>
      </Card>

      <Card className="p-5 mb-6">
        <h2 className="font-semibold mb-3">{t("evaluation.programModules")}</h2>
        {data.modules.length === 0 && (
          <p className="text-sm text-text-secondary mb-4">{t("evaluation.noModulesInProgram")}</p>
        )}
        <ul className="space-y-2 mb-4">
          {data.modules.map((m) => (
            <li
              key={m._id}
              className="flex items-center justify-between p-2 border rounded-lg text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate">{m.title}</span>
                <Badge variant={m.status === "published" ? "success" : "default"}>
                  {m.status}
                </Badge>
              </div>
              {m.linkId && (
                <button
                  type="button"
                  onClick={() => handleRemoveModule(m.linkId)}
                  className="text-red-500 shrink-0 p-1"
                  title={t("evaluation.removeModule")}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
        {availableModules.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableModules.map((m) => (
              <Button
                key={m._id}
                size="sm"
                variant="outline"
                onClick={() => handleAddModule(m._id)}
                title={
                  m.assignedProgramTitle
                    ? t("evaluation.moduleInOtherProgram", { program: m.assignedProgramTitle })
                    : undefined
                }
              >
                <Plus size={14} />
                {m.title}
                {m.assignedProgramTitle && (
                  <span className="text-xs opacity-70 ml-1">
                    ({t("evaluation.fromProgram", { program: m.assignedProgramTitle })})
                  </span>
                )}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary">{t("evaluation.noModulesAvailable")}</p>
        )}
      </Card>

      {policy.generalExamEnabled && (
        <Card className="p-5 mb-6">
          <h2 className="font-semibold mb-3">{t("evaluation.finalQuestionPool")}</h2>
          <p className="text-xs text-text-secondary mb-3">
            {t("evaluation.searchModuleQuestions")} ({data.generalQuestionCount ?? 0}{" "}
            {t("evaluation.questionsInPool")})
          </p>
          <div className="flex gap-2 mb-3">
            <input
              className="input flex-1"
              placeholder={t("evaluation.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} className="text-gray-400 self-center" />
          </div>
          {searchResults?.map(({ question, moduleTitle }) => (
            <div
              key={question._id}
              className="flex items-start justify-between gap-2 p-2 border-b text-sm"
            >
              <div>
                <p className="text-xs text-text-secondary">{moduleTitle}</p>
                <p>{question.questionText}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  importQuestion({
                    programId,
                    organizationId: convexUser.organizationId,
                    moduleQuestionId: question._id,
                  })
                }
              >
                {t("evaluation.addToPool")}
              </Button>
            </div>
          ))}
        </Card>
      )}

      <Button onClick={handleSave} loading={saving}>
        {t("common.saveChanges")}
      </Button>
    </div>
  );
}
