import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { Award, Download } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useConvexSession } from "../../hooks/useConvexSession";
import { Button } from "../../components/ui/Button";
import { formatDate } from "../../lib/utils";

export default function MyCertificatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { convexUser } = useConvexSession();

  const certs = useQuery(
    api.certificates.listForUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const isLoading = convexUser?._id && certs === undefined;
  const displayCerts = certs ?? [];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-text-primary mb-6">
        {t("learner.myCertificates")}
      </h2>

      {isLoading ? (
        <p className="text-center text-text-secondary py-12">
          {t("certificate.loading")}
        </p>
      ) : displayCerts.length === 0 ? (
        <div className="text-center py-16">
          <Award size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-text-secondary">
            {t("learner.noCertificates")}
          </p>
          <p className="text-sm text-gray-400 mt-1">{t("learner.earnCertificate")}</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/learn")}>
            {t("learner.backToTraining")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayCerts.map((cert) => (
            <div
              key={cert._id}
              className="bg-white rounded-card shadow-card p-5 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <Award size={28} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-text-primary truncate">
                  {cert.programTitle ?? cert.moduleTitle ?? "Programme"}
                </h3>
                <p className="text-sm text-text-secondary">
                  {t("certificate.score")}:{" "}
                  <span className="font-medium text-primary">{cert.score}%</span>
                  {" · "}
                  {formatDate(cert.issuedAt)}
                </p>
                {cert.certificateNumber && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cert.certificateNumber}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate(`/learn/program/${cert.programId}/certificate`)
                }
              >
                <Download size={14} />
                {t("learner.viewCertificate")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
