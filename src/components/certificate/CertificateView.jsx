import { useTranslation } from "react-i18next";
import { Award } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "../../lib/utils";
import { mergeTemplate } from "../../lib/certificate/defaults";

/**
 * Landscape training completion certificate (org-issued, not MOOC-style).
 */
export function CertificateView({
  template: rawTemplate,
  learnerName,
  moduleTitle,
  score,
  issuedAt,
  certificateNumber,
  verifyUrl,
  className = "",
}) {
  const { t } = useTranslation();
  const template = mergeTemplate(rawTemplate);
  const accent = template.accentColor || template.borderColor;
  const border = template.borderColor;
  const dateStr = formatDate(issuedAt ?? Date.now());

  return (
    <div
      className={`relative bg-white overflow-hidden select-none ${className}`}
      style={{
        aspectRatio: "297 / 210",
        width: "100%",
        maxWidth: "900px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Outer double border */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ border: `3px solid ${border}` }}
      />
      <div
        className="absolute inset-[6px] pointer-events-none"
        style={{ border: `1px solid ${border}`, opacity: 0.45 }}
      />

      {/* Guilloché-style watermark */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `repeating-radial-gradient(circle at 20% 30%, ${accent} 0px, transparent 8px),
            repeating-radial-gradient(circle at 80% 70%, ${accent} 0px, transparent 10px),
            repeating-linear-gradient(45deg, ${accent} 0 1px, transparent 1px 12px)`,
        }}
      />

      {template.backgroundImageUrl && (
        <img
          src={template.backgroundImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.07] pointer-events-none"
        />
      )}

      <div className="relative z-10 flex h-full min-h-0">
        {/* Main content */}
        <div className="flex-1 flex flex-col px-8 py-7 md:px-10 md:py-8 min-w-0">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            {template.logoUrl ? (
              <img
                src={template.logoUrl}
                alt=""
                className="h-14 w-14 object-contain shrink-0"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: accent }}
              >
                <Award size={28} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h1
                className="text-xl md:text-2xl font-bold leading-tight truncate"
                style={{ color: accent }}
              >
                {template.organizationName}
              </h1>
              {template.programSubtitle && (
                <p className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-text-secondary mt-1 font-medium">
                  {template.programSubtitle}
                </p>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-xs text-text-secondary mb-2">{dateStr}</p>
            <p
              className="text-2xl md:text-3xl font-bold text-text-primary leading-tight mb-2"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              {learnerName}
            </p>
            <p className="text-sm text-text-secondary mb-1">
              {t("certificate.hasCompleted")}
            </p>
            <p
              className="text-lg md:text-xl font-semibold mb-3"
              style={{
                color: accent,
                fontFamily: "'Libre Baskerville', Georgia, serif",
              }}
            >
              {moduleTitle}
            </p>
            {score != null && (
              <p className="text-sm text-text-secondary">
                {t("certificate.passingScore", { score })}
              </p>
            )}
          </div>

          {/* Footer signature */}
          <div className="flex items-end justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="min-w-0">
              {template.signatureImageUrl ? (
                <img
                  src={template.signatureImageUrl}
                  alt=""
                  className="h-10 object-contain object-left mb-1"
                />
              ) : (
                <div className="w-36 border-b-2 border-gray-300 mb-1" />
              )}
              <p className="text-[10px] md:text-xs text-text-secondary leading-snug">
                {template.signatureLine}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium text-text-primary">{dateStr}</p>
              <p className="text-[10px] text-text-secondary">
                {t("certificate.dateOfCompletion")}
              </p>
            </div>
          </div>
        </div>

        {/* Right ribbon */}
        <div
          className="w-[28%] max-w-[200px] shrink-0 relative flex flex-col items-center justify-between py-8 px-3 text-center"
          style={{ backgroundColor: `${accent}18` }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ backgroundColor: accent }}
          />
          <div className="pt-2">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em] leading-relaxed"
              style={{ color: accent }}
            >
              {t("certificate.ribbonLine1")}
              <br />
              {t("certificate.ribbonLine2")}
            </p>
          </div>

          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 flex flex-col items-center justify-center bg-white shadow-sm"
            style={{ borderColor: accent }}
          >
            <Award size={32} style={{ color: accent }} />
          </div>

          {certificateNumber && verifyUrl && (
            <div className="flex flex-col items-center gap-2 pb-2">
              <QRCodeSVG value={verifyUrl} size={56} level="M" />
              <p className="text-[8px] text-text-secondary leading-tight break-all max-w-[120px]">
                {t("certificate.ref")}: {certificateNumber}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom disclaimer */}
      {template.footerText && (
        <p className="absolute bottom-2 left-3 right-8 text-left text-[7px] md:text-[8px] text-text-secondary leading-tight z-20">
          {template.footerText}
        </p>
      )}
    </div>
  );
}

/** Preview placeholders for the admin template editor. */
export function getCertificatePreviewSample(t) {
  return {
    learnerName: t("certificate.sampleLearner"),
    moduleTitle: t("certificate.sampleModule"),
    score: 85,
    issuedAt: Date.now(),
    certificateNumber: "EVT-2026-PREVIEW",
    verifyUrl:
      typeof window !== "undefined"
        ? `${window.location.origin}/verify/EVT-2026-PREVIEW`
        : "",
  };
}
