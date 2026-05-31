import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { Award, Download } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { useConvexSession } from "../../hooks/useConvexSession";
import { Button } from "../../components/ui/Button";
import { formatDate } from "../../lib/utils";
import { MOCK_PROGRAM_CERTIFICATES } from "../../lib/mockData";

export default function MyCertificatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { convexUser, publishedModules } = useConvexSession();

  const certs = useQuery(
    api.certificates.listForUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const isLoading = convexUser === undefined && currentUser?.email;

  const displayCerts =
    certs && certs.length > 0
      ? certs.map((c) => {
          return {
            routeProgramId: c.programId?.startsWith?.("prog")
              ? c.programId
              : "prog1",
            moduleTitle: c.programTitle ?? c.moduleTitle ?? "Programme",
            score: c.score,
            issuedAt: c.issuedAt,
            certificateNumber: c.certificateNumber,
          };
        })
      : !convexUser && !isLoading
        ? currentUser?._id && MOCK_PROGRAM_CERTIFICATES[currentUser._id]
          ? [
              {
                routeProgramId: "prog1",
                moduleTitle: "Polio Field Worker Certification",
                score: MOCK_PROGRAM_CERTIFICATES[currentUser._id].score,
                issuedAt: MOCK_PROGRAM_CERTIFICATES[currentUser._id].issuedAt,
                certificateNumber:
                  MOCK_PROGRAM_CERTIFICATES[currentUser._id].certificateNumber,
              },
            ]
          : []
        : [];

  const showEmpty = !isLoading && displayCerts.length === 0;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-text-primary mb-6">
        {t("learner.myCertificates")}
      </h2>

      {isLoading ? (
        <p className="text-center text-text-secondary py-12">{t("certificate.loading")}</p>
      ) : showEmpty ? (
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
              key={(cert.routeProgramId ?? "cert") + cert.issuedAt}
              className="bg-white rounded-card shadow-card p-5 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <Award size={28} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-text-primary truncate">
                  {cert.moduleTitle}
                </h3>
                <p className="text-sm text-text-secondary">
                  {t("certificate.score")}:{" "}
                  <span className="font-medium text-primary">{cert.score}%</span>
                  {" · "}
                  {formatDate(cert.issuedAt)}
                </p>
                {cert.certificateNumber && (
                  <p className="text-xs text-gray-400 mt-0.5">{cert.certificateNumber}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate(
                    `/learn/program/${cert.routeProgramId ?? "prog1"}/certificate`
                  )
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
