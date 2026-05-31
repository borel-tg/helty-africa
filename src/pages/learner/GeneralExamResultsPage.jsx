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
    navigate(`/learn/program/${programId}/evaluation`);
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto text-center">
      <h1 className="text-xl font-semibold mb-6">
        {t("evaluation.finalExamTitle")}
      </h1>
      <CircularProgress value={score} size={100} />
      <p className="text-3xl font-bold mt-4">{score}%</p>
      <p className="text-sm text-text-secondary mt-2 mb-8">
        {t("evaluation.finalSubmitted")}
      </p>
      <Button fullWidth onClick={onContinue}>
        {t("evaluation.backToEvaluation")}
      </Button>
    </div>
  );
}
