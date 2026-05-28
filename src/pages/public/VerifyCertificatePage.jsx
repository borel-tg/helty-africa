import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { CheckCircle, XCircle, Award } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { formatDate } from "../../lib/utils";
import { mergeTemplate } from "../../lib/certificate/defaults";
import { CertificateView } from "../../components/certificate/CertificateView";

export default function VerifyCertificatePage() {
  const { certificateNumber } = useParams();
  const { t } = useTranslation();

  const result = useQuery(
    api.certificates.getByNumber,
    certificateNumber ? { certificateNumber } : "skip"
  );

  const isLoading = result === undefined;
  const isValid = result != null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-text-secondary">{t("certificate.loading")}</p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-card shadow-card p-8 text-center">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-primary mb-2">
            {t("certificate.verifyInvalid")}
          </h1>
          <p className="text-sm text-text-secondary">{t("certificate.verifyInvalidDesc")}</p>
          <p className="text-xs text-gray-400 mt-4 font-mono">{certificateNumber}</p>
        </div>
      </div>
    );
  }

  const { certificate, learnerName, moduleTitle, template } = result;
  const merged = mergeTemplate(template);
  const verifyUrl = `${window.location.origin}/verify/${certificate.certificateNumber}`;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 justify-center mb-6 text-green-700">
          <CheckCircle size={24} />
          <h1 className="text-lg font-semibold">{t("certificate.verifyValid")}</h1>
        </div>

        <div className="bg-white rounded-card shadow-card p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-secondary">{t("certificate.issuedTo")}</p>
              <p className="font-semibold text-text-primary">{learnerName}</p>
            </div>
            <div>
              <p className="text-text-secondary">{t("certificate.module")}</p>
              <p className="font-semibold text-text-primary">{moduleTitle}</p>
            </div>
            <div>
              <p className="text-text-secondary">{t("certificate.score")}</p>
              <p className="font-semibold text-primary">{certificate.score}%</p>
            </div>
            <div>
              <p className="text-text-secondary">{t("certificate.issuedOn")}</p>
              <p className="font-semibold">{formatDate(certificate.issuedAt)}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-text-secondary">{t("certificate.issuedBy")}</p>
              <p className="font-semibold">{merged.organizationName}</p>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 text-xs text-gray-500 font-mono">
              <Award size={14} />
              {certificate.certificateNumber}
            </div>
          </div>
        </div>

        <div className="shadow-modal rounded-card overflow-hidden bg-gray-50 p-2 md:p-4">
          <CertificateView
            template={merged}
            learnerName={learnerName}
            moduleTitle={moduleTitle}
            score={certificate.score}
            issuedAt={certificate.issuedAt}
            certificateNumber={certificate.certificateNumber}
            verifyUrl={verifyUrl}
          />
        </div>
      </div>
    </div>
  );
}
