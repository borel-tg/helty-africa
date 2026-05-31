import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Input";

export function FinalExamQuestionModal({
  open,
  onClose,
  onAdd,
  onUpdate,
  initialQuestion,
}) {
  const { t } = useTranslation();
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState([
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ]);
  const [correctId, setCorrectId] = useState("a");
  const isEdit = Boolean(initialQuestion);

  useEffect(() => {
    if (!open) return;
    if (!initialQuestion) {
      setQuestionText("");
      setOptions([
        { id: "a", text: "" },
        { id: "b", text: "" },
        { id: "c", text: "" },
        { id: "d", text: "" },
      ]);
      setCorrectId("a");
      return;
    }
    setQuestionText(initialQuestion.questionText || "");
    setOptions(
      initialQuestion.options?.length
        ? initialQuestion.options
        : [
            { id: "a", text: "" },
            { id: "b", text: "" },
            { id: "c", text: "" },
            { id: "d", text: "" },
          ]
    );
    setCorrectId(initialQuestion.correctOptionId || "a");
  }, [initialQuestion, open]);

  const updateOption = (id, text) =>
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));

  const handleSave = () => {
    if (!questionText.trim()) return;
    const payload = { questionText: questionText.trim(), options, correctOptionId: correctId };
    if (isEdit) onUpdate?.(payload);
    else onAdd(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? t("evaluation.editFinalQuestion")
          : t("evaluation.addFinalQuestion")
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>
            {isEdit ? t("common.saveChanges") : t("evaluation.addFinalQuestion")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Textarea
          label={t("evaluation.questionText")}
          placeholder={t("evaluation.questionTextPlaceholder")}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            {t("evaluation.answerOptions")}
          </label>
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="final-correct"
                checked={correctId === opt.id}
                onChange={() => setCorrectId(opt.id)}
                className="accent-primary w-4 h-4 shrink-0"
              />
              <input
                type="text"
                placeholder={t("evaluation.optionPlaceholder", {
                  letter: opt.id.toUpperCase(),
                })}
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
          <p className="text-xs text-text-secondary">
            {t("evaluation.correctAnswerHint")}
          </p>
        </div>
      </div>
    </Modal>
  );
}
