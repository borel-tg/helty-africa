import { useParams, useNavigate } from "react-router-dom";
import { useRef } from "react";
import { Download, ArrowLeft, Award, Printer } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { MOCK_MODULES } from "../../lib/mockData";
import { formatDate } from "../../lib/utils";

export default function CertificatePage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const certRef = useRef(null);
  const module = MOCK_MODULES.find((m) => m._id === moduleId);

  const handlePrint = () => {
    window.print();
  };

  const issueDate = formatDate(Date.now());

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(`/learn/module/${moduleId}/results`)}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-6 transition-colors print:hidden"
      >
        <ArrowLeft size={16} />
        Back to Results
      </button>

      {/* Actions */}
      <div className="flex gap-3 mb-6 print:hidden">
        <Button onClick={handlePrint} size="md">
          <Download size={16} />
          Download Certificate
        </Button>
        <Button variant="outline" size="md" onClick={handlePrint}>
          <Printer size={16} />
          Print
        </Button>
      </div>

      {/* Certificate */}
      <div
        ref={certRef}
        className="bg-white rounded-card shadow-modal border-4 border-primary p-8 md:p-12 print:shadow-none print:border-4"
        style={{ minHeight: "500px" }}
      >
        {/* Header decoration */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <Award size={32} className="text-white" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-secondary font-medium mb-1">
            Certificate of Completion
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            PolioFree Africa NGO
          </h1>
        </div>

        {/* Certificate body */}
        <div className="text-center space-y-4 border-t border-b border-gray-100 py-8">
          <p className="text-lg text-text-secondary">
            This certifies that
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
            {currentUser?.name || "Fatima Coulibaly"}
          </h2>
          <p className="text-lg text-text-secondary">
            has successfully completed
          </p>
          <h3 className="text-xl md:text-2xl font-semibold text-primary">
            {module?.title || "Polio Campaign Protocols"}
          </h3>
          <p className="text-text-secondary">
            with a passing score of{" "}
            <span className="font-bold text-text-primary">85%</span>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-end justify-between">
          <div>
            <div className="w-48 border-b-2 border-gray-300 mb-1" />
            <p className="text-xs text-text-secondary">
              Dr. Amara Diallo, Training Director
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-text-primary">{issueDate}</p>
            <p className="text-xs text-text-secondary">Date of Completion</p>
          </div>
        </div>

        {/* Watermark / border decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
          <Award size={300} className="text-primary" />
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:shadow-none, .print\\:shadow-none * { visibility: visible; }
          .print\\:shadow-none { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
