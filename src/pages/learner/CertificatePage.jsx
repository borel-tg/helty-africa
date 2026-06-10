import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import { Download, ArrowLeft, Printer } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useConvexSession } from "../../hooks/useConvexSession";
import { CertificateView } from "../../components/certificate/CertificateView";
import { mergeTemplate } from "../../lib/certificate/defaults";
import { downloadCertificatePdf } from "../../lib/certificate/downloadCertificate";

export default function CertificatePage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { convexUser, template: savedTemplate } = useConvexSession();
  const certRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const issueCertificate = useMutation(api.certificates.issue);

  const certificate = useQuery(
    api.certificates.getForUserProgram,
    convexUser?._id && programId ? { programId } : "skip"
  );

  const convexProgram = useQuery(
    api.trainingPrograms.getById,
    programId ? { programId } : "skip"
  );

  const scoreFromState = location.state?.score;

  useEffect(() => {
    if (
      !convexUser?._id ||
      !programId ||
      !convexUser.organizationId ||
      certificate === undefined ||
      certificate !== null
    ) {
      return;
    }
    if (scoreFromState == null) return;

    issueCertificate({
      programId,
      organizationId: convexUser.organizationId,
      score: scoreFromState,
    }).catch(() => {});
  }, [convexUser, programId, certificate, scoreFromState, issueCertificate]);

  const template = mergeTemplate(savedTemplate);
  const learnerName = currentUser?.name ?? "—";
  const programTitle =
    convexProgram?.program?.title ?? t("learner.trainingProgramFallback");
  const score = certificate?.score ?? scoreFromState ?? null;
  const issuedAt = certificate?.issuedAt ?? Date.now();
  const certificateNumber = certificate?.certificateNumber;
  const verifyUrl = certificateNumber
    ? `${window.location.origin}/verify/${certificateNumber}`
    : undefined;

  const isLoading = convexUser?._id && certificate === undefined;
  const hasCert = certificate || scoreFromState != null;

  if (!hasCert && !isLoading) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <p className="text-text-secondary mb-4">{t("certificate.notEligible")}</p>
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/learn/program/${programId}/evaluation`)
          }
        >
          {t("evaluation.backToEvaluation")}
        </Button>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const name = learnerName.replace(/\s+/g, "-").toLowerCase();
      await downloadCertificatePdf(
        certRef.current,
        `certificate-${name}-${programId || "program"}.pdf`
      );
    } catch {
      alert(t("certificate.downloadError"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto certificate-print-root">
      <button
        type="button"
        onClick={() => navigate(`/learn/program/${programId}/evaluation`)}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-6 transition-colors print:hidden"
      >
        <ArrowLeft size={16} />
        {t("evaluation.backToEvaluation")}
      </button>

      {isLoading ? (
        <p className="text-center text-text-secondary">{t("certificate.loading")}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-6 print:hidden">
            <Button onClick={handleDownload} loading={downloading}>
              <Download size={16} />
              {t("certificate.downloadPdf")}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} />
              {t("certificate.print")}
            </Button>
          </div>

          <CertificateView
            ref={certRef}
            template={template}
            learnerName={learnerName}
            moduleTitle={programTitle}
            score={score}
            issuedAt={issuedAt}
            certificateNumber={certificateNumber}
            verifyUrl={verifyUrl}
          />
        </>
      )}
    </div>
  );
}
