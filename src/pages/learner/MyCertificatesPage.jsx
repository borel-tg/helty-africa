import { useNavigate } from "react-router-dom";
import { Award, Download } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
import { MOCK_MODULES } from "../../lib/mockData";
import { formatDate } from "../../lib/utils";

// Mock: learner has cert for mod1
const MOCK_USER_CERTS = [
  { moduleId: "mod1", score: 85, issuedAt: Date.now() - 2 * 86400000 },
];

export default function MyCertificatesPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-text-primary mb-6">
        My Certificates
      </h2>

      {MOCK_USER_CERTS.length === 0 ? (
        <div className="text-center py-16">
          <Award size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-text-secondary">
            No certificates yet
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Complete a module to earn your certificate.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate("/learn")}
          >
            Go to Training
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {MOCK_USER_CERTS.map((cert) => {
            const mod = MOCK_MODULES.find((m) => m._id === cert.moduleId);
            return (
              <div
                key={cert.moduleId}
                className="bg-white rounded-card shadow-card p-5 flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                  <Award size={28} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-text-primary truncate">
                    {mod?.title || "Module"}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Score: <span className="font-medium text-primary">{cert.score}%</span>
                    {" · "}
                    Issued: {formatDate(cert.issuedAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/learn/module/${cert.moduleId}/certificate`)}
                >
                  <Download size={14} />
                  View
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
