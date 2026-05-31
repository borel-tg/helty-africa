import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Download } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Select } from "../ui/Input";
import { ConfirmModal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { FinalExamQuestionModal } from "./FinalExamQuestionModal";

const DEFAULT_EXAM_SETTINGS = {
  timeLimitMinutes: 45,
  showCorrectAnswers: true,
  allowReview: true,
  randomizeQuestions: false,
};

export function ProgramFinalExamEditor({
  programId,
  organizationId,
  programModules,
  policy,
  setPolicy,
}) {
  const { t } = useTranslation();
  const toast = useToast();

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteQuestion, setDeleteQuestion] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importModuleId, setImportModuleId] = useState("");
  const [importSearch, setImportSearch] = useState("");

  const questions = useQuery(
    api.generalExams.listQuestions,
    programId ? { programId } : "skip"
  );

  const settings = useQuery(
    api.generalExams.getSettings,
    programId ? { programId } : "skip"
  );

  const importable = useQuery(
    api.generalExams.listImportableModuleQuestions,
    programId && importOpen && importModuleId
      ? {
          programId,
          moduleId: importModuleId,
          search: importSearch || undefined,
        }
      : "skip"
  );

  useEffect(() => {
    if (!importOpen || !programModules?.length) return;
    setImportModuleId((current) => {
      if (current && programModules.some((m) => m._id === current)) return current;
      return programModules[0]._id;
    });
  }, [importOpen, programModules]);

  const addQuestion = useMutation(api.generalExams.addQuestion);
  const updateQuestion = useMutation(api.generalExams.updateQuestion);
  const removeQuestion = useMutation(api.generalExams.deleteQuestion);
  const importQuestion = useMutation(api.generalExams.importFromModuleQuestion);
  const upsertSettings = useMutation(api.generalExams.upsertSettings);

  const [examSettings, setExamSettings] = useState(DEFAULT_EXAM_SETTINGS);

  useEffect(() => {
    if (settings === undefined) return;
    setExamSettings(
      settings
        ? {
            timeLimitMinutes: settings.timeLimitMinutes ?? 45,
            showCorrectAnswers: settings.showCorrectAnswers,
            allowReview: settings.allowReview,
            randomizeQuestions: settings.randomizeQuestions,
          }
        : DEFAULT_EXAM_SETTINGS
    );
  }, [settings, programId]);

  const handleSaveSettings = async () => {
    if (!programId || !organizationId) return;
    try {
      await upsertSettings({
        programId,
        organizationId,
        timeLimitMinutes: examSettings.timeLimitMinutes || undefined,
        showCorrectAnswers: examSettings.showCorrectAnswers,
        allowReview: examSettings.allowReview,
        randomizeQuestions: examSettings.randomizeQuestions,
      });
      toast.success(t("evaluation.finalExamSettingsSaved"));
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const handleAdd = async (payload) => {
    try {
      await addQuestion({
        programId,
        organizationId,
        ...payload,
      });
      toast.success(t("evaluation.finalQuestionAdded"));
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const handleUpdate = async (payload) => {
    if (!editingQuestion) return;
    try {
      await updateQuestion({
        questionId: editingQuestion._id,
        ...payload,
      });
      toast.success(t("common.saved"));
      setEditingQuestion(null);
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const handleDelete = async () => {
    if (!deleteQuestion) return;
    try {
      await removeQuestion({ questionId: deleteQuestion._id });
      toast.success(t("evaluation.finalQuestionDeleted"));
      setDeleteQuestion(null);
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const handleImport = async (moduleQuestionId) => {
    try {
      await importQuestion({
        programId,
        organizationId,
        moduleQuestionId,
      });
      toast.success(t("evaluation.finalQuestionImported"));
    } catch (err) {
      toast.error(err.message ?? t("common.error"));
    }
  };

  const sortedQuestions = [...(questions ?? [])].sort((a, b) => a.order - b.order);
  const hasProgramModules = (programModules?.length ?? 0) > 0;

  return (
    <Card className="p-5 mb-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t("evaluation.finalExamEditorTitle")}</h2>
          <p className="text-xs text-text-secondary mt-1">
            {t("evaluation.finalExamEditorHint")}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddQuestion(true)}>
          <Plus size={14} />
          {t("evaluation.addFinalQuestion")}
        </Button>
      </div>

      {/* Exam settings */}
      <div className="rounded-lg border border-gray-100 p-4 space-y-3 bg-gray-50/80">
        <h3 className="text-sm font-medium">{t("evaluation.finalExamSettingsTitle")}</h3>
        <div className="flex flex-wrap gap-4">
          <label className="text-sm">
            {t("evaluation.finalTimeLimit")}
            <input
              type="number"
              min={0}
              className="input mt-1 block w-28"
              value={examSettings.timeLimitMinutes ?? ""}
              onChange={(e) =>
                setExamSettings((s) => ({
                  ...s,
                  timeLimitMinutes: e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
            />
            <span className="text-xs text-text-secondary ml-1">
              {t("evaluation.minutes")} ({t("evaluation.zeroUnlimited")})
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm self-end">
            <input
              type="checkbox"
              checked={examSettings.randomizeQuestions}
              onChange={(e) =>
                setExamSettings((s) => ({
                  ...s,
                  randomizeQuestions: e.target.checked,
                }))
              }
            />
            {t("evaluation.randomizeQuestions")}
          </label>
          <Select
            label={t("evaluation.finalMaxRetakes")}
            className="w-full max-w-xs"
            value={String(policy?.generalExamMaxRetakes ?? 3)}
            onChange={(e) =>
              setPolicy((p) => ({
                ...p,
                generalExamMaxRetakes:
                  e.target.value === "unlimited"
                    ? "unlimited"
                    : Number(e.target.value),
              }))
            }
          >
            {[1, 2, 3, 5, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="unlimited">{t("common.unlimited")}</option>
          </Select>
        </div>
        <p className="text-xs text-text-secondary">
          {t("evaluation.finalMaxRetakesHint")}
        </p>
        <Button size="sm" variant="outline" onClick={handleSaveSettings}>
          {t("evaluation.saveFinalExamSettings")}
        </Button>
      </div>

      {/* Question list */}
      {questions === undefined ? (
        <p className="text-sm text-text-secondary">{t("common.loading")}</p>
      ) : sortedQuestions.length === 0 ? (
        <p className="text-sm text-text-secondary">{t("evaluation.noFinalQuestionsAdmin")}</p>
      ) : (
        <ul className="space-y-2">
          {sortedQuestions.map((q, idx) => (
            <li
              key={q._id}
              className="flex items-start justify-between gap-3 p-3 border rounded-lg text-sm bg-white"
            >
              <div className="min-w-0 flex-1">
                <span className="text-xs text-text-secondary font-medium">
                  {t("evaluation.questionNumber", { n: idx + 1 })}
                  {q.sourceModuleQuestionId && (
                    <span className="ml-2 text-primary">
                      ({t("evaluation.importedFromModule")})
                    </span>
                  )}
                </span>
                <p className="mt-1">{q.questionText}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-primary"
                  title={t("common.edit")}
                  onClick={() => setEditingQuestion(q)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-red-500"
                  title={t("common.delete")}
                  onClick={() => setDeleteQuestion(q)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Import from program modules */}
      {hasProgramModules && (
        <div className="border-t pt-4">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium text-text-primary w-full"
            onClick={() => setImportOpen((o) => !o)}
          >
            <Download size={16} className="text-primary" />
            {t("evaluation.importFromProgramModules")}
            {importOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {importOpen && (
            <div className="mt-3 space-y-3">
              <Select
                label={t("evaluation.importSelectModule")}
                value={importModuleId}
                onChange={(e) => {
                  setImportModuleId(e.target.value);
                  setImportSearch("");
                }}
              >
                {programModules.length === 0 ? (
                  <option value="">{t("evaluation.importSelectModulePlaceholder")}</option>
                ) : null}
                {programModules.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title}
                  </option>
                ))}
              </Select>

              {importModuleId && (
                <>
                  <input
                    className="input w-full text-sm"
                    placeholder={t("evaluation.searchPlaceholder")}
                    value={importSearch}
                    onChange={(e) => setImportSearch(e.target.value)}
                  />
                  {importable === undefined ? (
                    <p className="text-xs text-text-secondary">{t("common.loading")}</p>
                  ) : importable.questions.length === 0 ? (
                    <p className="text-xs text-text-secondary">
                      {t("evaluation.noModuleQuestionsToImport")}
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-text-secondary">
                        {t("evaluation.importQuestionCount", {
                          count: importable.questions.length,
                        })}
                      </p>
                      <ul className="space-y-2 max-h-72 overflow-y-auto rounded-lg border p-2 bg-white">
                        {importable.questions.map((q) => (
                          <li
                            key={q._id}
                            className="flex items-start justify-between gap-2 text-sm p-2 rounded-md hover:bg-gray-50"
                          >
                            <p className="min-w-0 flex-1 line-clamp-3">{q.questionText}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0"
                              disabled={q.alreadyImported}
                              onClick={() => handleImport(q._id)}
                            >
                              {q.alreadyImported
                                ? t("evaluation.alreadyImported")
                                : t("evaluation.importQuestion")}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <FinalExamQuestionModal
        open={showAddQuestion}
        onClose={() => setShowAddQuestion(false)}
        onAdd={handleAdd}
      />
      <FinalExamQuestionModal
        open={Boolean(editingQuestion)}
        onClose={() => setEditingQuestion(null)}
        onUpdate={handleUpdate}
        initialQuestion={editingQuestion}
      />
      <ConfirmModal
        open={Boolean(deleteQuestion)}
        onClose={() => setDeleteQuestion(null)}
        onConfirm={handleDelete}
        title={t("evaluation.deleteFinalQuestion")}
        message={t("evaluation.deleteFinalQuestionConfirm")}
        confirmLabel={t("common.delete")}
        confirmVariant="danger"
      />
    </Card>
  );
}
