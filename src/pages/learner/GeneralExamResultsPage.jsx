import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { CircularProgress } from "../../components/ui/Progress";
import { useProgramEvaluation } from "../../hooks/useProgramEvaluation";

export default function GeneralExamResultsPage() {
  const { t } = useTranslation();
  const { programId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const score = location.state?.score ?? 0;
  const { evaluation, handleFinalize } = useProgramEvaluation(programId);

  const policy = evaluation?.policy;
  const passed =
    evaluation?.finalScore != null &&
    evaluation.finalScore >= (policy?.programPassThreshold ?? 80);

  const onContinue = async () => {
    await handleFinalize();
    navigate(`/learn/program/${programId}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto text-center">
      <h1 className="text-xl font-semibold mb-6">
        {t("evaluation.finalExamTitle")}
      </h1>
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <CircularProgress value={score} size={100} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-text-primary">{score}%</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-text-secondary mb-8">
        {t("evaluation.finalSubmitted")}
      </p>
      <Button fullWidth onClick={onContinue}>
        {t("trainings.backToProgram")}
      </Button>
    </div>
  );
}
