import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import { Download, ArrowLeft, Printer } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useConvexSession } from "../../hooks/useConvexSession";
import {
  MOCK_TRAINING_PROGRAM,
  MOCK_PROGRAM_CERTIFICATES,
} from "../../lib/mockData";
import { CertificateView } from "../../components/certificate/CertificateView";
import { mergeTemplate } from "../../lib/certificate/defaults";
import { downloadCertificatePdf } from "../../lib/certificate/downloadCertificate";

const MOCK_PROGRAM_ROUTE = "prog1";

export default function CertificatePage() {
  const { programId: routeProgramId, moduleId: legacyModuleId } = useParams();
  const programId = routeProgramId || (legacyModuleId ? null : MOCK_PROGRAM_ROUTE);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { convexUser, template: savedTemplate } = useConvexSession();
  const certRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const isMockProgram = !programId || programId.startsWith("prog");
  const convexProgramId =
    programId && !isMockProgram ? programId : undefined;

  const issueCertificate = useMutation(api.certificates.issue);

  const certificate = useQuery(
    api.certificates.getForUserProgram,
    convexUser?._id && convexProgramId
      ? { userId: convexUser._id, programId: convexProgramId }
      : "skip"
  );

  const convexProgram = useQuery(
    api.trainingPrograms.getById,
    convexProgramId ? { programId: convexProgramId } : "skip"
  );

  const mockCert = currentUser?._id
    ? MOCK_PROGRAM_CERTIFICATES[currentUser._id]
    : null;
  const examState = location.state;
  const scoreFromState = examState?.score;

  useEffect(() => {
    if (
      !convexUser?._id ||
      !convexProgramId ||
      !convexUser.organizationId ||
      certificate === undefined ||
      certificate !== null
    ) {
      return;
    }
    if (scoreFromState == null) return;

    issueCertificate({
      userId: convexUser._id,
      programId: convexProgramId,
      organizationId: convexUser.organizationId,
      score: scoreFromState,
    }).catch(() => {});
  }, [convexUser, convexProgramId, certificate, scoreFromState, issueCertificate]);

  const template = mergeTemplate(savedTemplate);
  const learnerName = currentUser?.name ?? "—";
  const programTitle =
    convexProgram?.program?.title ??
    MOCK_TRAINING_PROGRAM.title ??
    "Training program";
  const score =
    certificate?.score ?? mockCert?.score ?? scoreFromState ?? null;
  const issuedAt =
    certificate?.issuedAt ?? mockCert?.issuedAt ?? Date.now();
  const certificateNumber =
    certificate?.certificateNumber ?? mockCert?.certificateNumber;
  const verifyUrl = certificateNumber
    ? `${window.location.origin}/verify/${certificateNumber}`
    : undefined;

  const isLoading = convexUser === undefined && currentUser?.email;
  const hasCert = certificate || mockCert || scoreFromState != null;

  if (!hasCert && !isLoading) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <p className="text-text-secondary mb-4">{t("certificate.notEligible")}</p>
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/learn/program/${programId || MOCK_PROGRAM_ROUTE}/evaluation`)
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
        onClick={() =>
          navigate(
            `/learn/program/${programId || MOCK_PROGRAM_ROUTE}/evaluation`
          )
        }
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-6 transition-colors print:hidden"
      >
        <ArrowLeft size={16} />
        {t("evaluation.backToEvaluation")}
      </button>

      <div className="flex gap-3 mb-6 print:hidden">
        <Button onClick={handleDownload} size="md" loading={downloading}>
          <Download size={16} />
          {t("certificate.downloadPdf")}
        </Button>
        <Button variant="outline" size="md" onClick={() => window.print()}>
          <Printer size={16} />
          {t("certificate.print")}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-text-secondary">{t("certificate.loading")}</p>
      ) : (
        <div ref={certRef} className="mx-auto print:shadow-none">
          <CertificateView
            template={template}
            learnerName={learnerName}
            moduleTitle={programTitle}
            score={score}
            issuedAt={issuedAt}
            certificateNumber={certificateNumber}
            verifyUrl={verifyUrl}
          />
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .certificate-print-root,
          .certificate-print-root * { visibility: visible; }
          .certificate-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
