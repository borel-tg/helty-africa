import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import { Download, ArrowLeft, Printer } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useConvexSession } from "../../hooks/useConvexSession";
import { MOCK_MODULES } from "../../lib/mockData";
import { CertificateView } from "../../components/certificate/CertificateView";
import { mergeTemplate } from "../../lib/certificate/defaults";
import { downloadCertificatePdf } from "../../lib/certificate/downloadCertificate";

export default function CertificatePage() {
  const { moduleId: routeModuleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { convexUser, template: savedTemplate, resolveModuleId } = useConvexSession();
  const certRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const convexModuleId = resolveModuleId(routeModuleId);
  const issueCertificate = useMutation(api.certificates.issue);

  const certificate = useQuery(
    api.certificates.getForUserModule,
    convexUser?._id && convexModuleId
      ? { userId: convexUser._id, moduleId: convexModuleId }
      : "skip"
  );

  const convexModule = useQuery(
    api.modules.getById,
    convexModuleId && !String(convexModuleId).startsWith("mod")
      ? { moduleId: convexModuleId }
      : "skip"
  );

  const mockModule = MOCK_MODULES.find((m) => m._id === routeModuleId);
  const examState = location.state;
  const scoreFromState = examState?.score;
  const passedFromState = examState?.passed;

  useEffect(() => {
    if (
      !convexUser?._id ||
      !convexModuleId ||
      !convexUser.organizationId ||
      certificate === undefined ||
      certificate !== null
    ) {
      return;
    }
    const shouldIssue =
      passedFromState === true || scoreFromState != null;
    if (!shouldIssue) return;

    issueCertificate({
      userId: convexUser._id,
      moduleId: convexModuleId,
      organizationId: convexUser.organizationId,
      score: scoreFromState ?? 0,
    }).catch(() => {});
  }, [
    convexUser,
    convexModuleId,
    certificate,
    passedFromState,
    scoreFromState,
    issueCertificate,
  ]);

  const template = mergeTemplate(savedTemplate);
  const learnerName = currentUser?.name ?? "—";
  const moduleTitle =
    convexModule?.title ?? mockModule?.title ?? "Training module";
  const score = certificate?.score ?? scoreFromState ?? null;
  const issuedAt = certificate?.issuedAt ?? Date.now();
  const certificateNumber = certificate?.certificateNumber;
  const verifyUrl = certificateNumber
    ? `${window.location.origin}/verify/${certificateNumber}`
    : undefined;

  const isLoading = convexUser === undefined && currentUser?.email;

  const handleDownload = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const name = learnerName.replace(/\s+/g, "-").toLowerCase();
      await downloadCertificatePdf(
        certRef.current,
        `certificate-${name}-${routeModuleId}.pdf`
      );
    } catch {
      alert(t("certificate.downloadError"));
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => window.print();

  const certLoaded = !convexUser || certificate !== undefined;
  const canView =
    passedFromState || certificate || (!convexUser && certLoaded);

  if (certLoaded && !canView) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <p className="text-text-secondary mb-4">{t("certificate.notEligible")}</p>
        <Button variant="outline" onClick={() => navigate(`/learn/module/${routeModuleId}`)}>
          {t("learner.backToModule")}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto certificate-print-root">
      <button
        type="button"
        onClick={() => navigate(`/learn/module/${routeModuleId}/results`)}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-6 transition-colors print:hidden"
      >
        <ArrowLeft size={16} />
        {t("learner.backToModule")}
      </button>

      <div className="flex gap-3 mb-6 print:hidden">
        <Button onClick={handleDownload} size="md" loading={downloading}>
          <Download size={16} />
          {t("certificate.downloadPdf")}
        </Button>
        <Button variant="outline" size="md" onClick={handlePrint}>
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
            moduleTitle={moduleTitle}
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
