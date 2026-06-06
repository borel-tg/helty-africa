import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Award } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "../../lib/utils";
import { mergeTemplate } from "../../lib/certificate/defaults";
import { CertificateBadge } from "./CertificateBadge";

const GOLD = "#C9A227";

function CornerOrnament({ className, flipX, flipY }) {
  return (
    <svg
      className={`cert-corner absolute pointer-events-none ${className}`}
      viewBox="0 0 48 48"
      fill="none"
      style={{
        transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
      }}
      aria-hidden
    >
      <path
        d="M4 4h12v2H6v10H4V4zm0 0h2v12H4V4zm28 0h12v12h-2V6H32V4z"
        fill={GOLD}
        opacity="0.55"
      />
      <circle cx="10" cy="10" r="3" stroke={GOLD} strokeWidth="1" opacity="0.7" />
      <path
        d="M36 36c6-6 6-14 0-20M40 40c8-8 8-18 0-26"
        stroke={GOLD}
        strokeWidth="1"
        opacity="0.45"
      />
    </svg>
  );
}

/**
 * Template 2 — Premium institutional landscape certificate.
 */
export const CertificateViewPremium = forwardRef(function CertificateViewPremium(
  {
    template: rawTemplate,
    learnerName,
    moduleTitle,
    score,
    issuedAt,
    certificateNumber,
    verifyUrl,
    className = "",
  },
  ref
) {
  const { t } = useTranslation();
  const template = mergeTemplate(rawTemplate);
  const accent = template.accentColor || template.borderColor;
  const border = template.borderColor;
  const dateStr = formatDate(issuedAt ?? Date.now());

  return (
    <div
      ref={ref}
      className={`cert-canvas relative bg-white overflow-hidden select-none ${className}`}
      style={{
        aspectRatio: "297 / 210",
        width: "100%",
        maxWidth: "900px",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#1A1A1A",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{ border: `3px solid ${border}` }}
      />
      <div
        className="absolute inset-[6px] pointer-events-none z-30"
        style={{ border: `1px solid ${border}`, opacity: 0.5 }}
      />
      <div
        className="absolute inset-[10px] pointer-events-none z-30"
        style={{ border: `1px solid ${GOLD}`, opacity: 0.35 }}
      />

      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.055]"
        aria-hidden
      >
        <defs>
          <pattern
            id="guilloche"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="18" fill="none" stroke={accent} strokeWidth="0.5" />
            <circle cx="20" cy="20" r="12" fill="none" stroke={accent} strokeWidth="0.4" />
            <path
              d="M0 20h40M20 0v40"
              stroke={accent}
              strokeWidth="0.3"
              opacity="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#guilloche)" />
      </svg>

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, #1A1A1A 0 1px, transparent 1px 3px),
            repeating-linear-gradient(90deg, #1A1A1A 0 1px, transparent 1px 3px)`,
        }}
      />

      {template.backgroundImageUrl && (
        <img
          src={template.backgroundImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.07] pointer-events-none"
        />
      )}

      <CornerOrnament className="top-2 left-2 sm:top-3 sm:left-3" />
      <CornerOrnament className="top-2 right-2 sm:top-3 sm:right-3" flipX />
      <CornerOrnament className="bottom-2 left-2 sm:bottom-3 sm:left-3" flipY />
      <CornerOrnament className="bottom-2 right-2 sm:bottom-3 sm:right-3" flipX flipY />

      <div className="relative z-10 flex h-full min-h-0">
        <div className="cert-main flex-1 flex flex-col min-w-0">
          <div className="cert-header flex items-center justify-between">
            {template.logoUrl ? (
              <img
                src={template.logoUrl}
                alt=""
                className="cert-logo object-contain"
              />
            ) : (
              <div
                className="cert-logo-fallback rounded-full flex items-center justify-center shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  border: `2px solid ${GOLD}`,
                }}
              >
                <Award className="text-white" />
              </div>
            )}

            <div className="flex-1 text-center min-w-0 px-1">
              <h1
                className="cert-org-title font-bold tracking-tight"
                style={{ color: accent }}
              >
                {template.organizationName}
              </h1>
              {template.programSubtitle && (
                <p
                  className="cert-org-subtitle uppercase font-semibold"
                  style={{ color: "#6B7280", letterSpacing: "0.18em" }}
                >
                  {template.programSubtitle}
                </p>
              )}
            </div>

            {template.secondLogoUrl ? (
              <img
                src={template.secondLogoUrl}
                alt=""
                className="cert-logo object-contain"
              />
            ) : (
              <div
                className="cert-logo-fallback rounded-full flex items-center justify-center shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  border: `2px solid ${GOLD}`,
                }}
              >
                <Award className="text-white" />
              </div>
            )}
          </div>

          <div className="cert-divider flex items-center">
            <div className="flex-1 h-px" style={{ backgroundColor: GOLD, opacity: 0.6 }} />
            <div
              className="w-1.5 h-1.5 rotate-45 shrink-0"
              style={{ backgroundColor: accent }}
            />
            <div className="flex-1 h-px" style={{ backgroundColor: accent, opacity: 0.35 }} />
          </div>

          <div className="cert-body flex-1 flex flex-col justify-center min-h-0">
            <p className="cert-date" style={{ color: "#6B7280" }}>
              {dateStr}
            </p>

            <p
              className="cert-learner-name font-bold"
              style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                color: "#1A1A1A",
              }}
            >
              {learnerName}
            </p>

            <p className="cert-body-text" style={{ color: "#6B7280" }}>
              {t("certificate.hasCompleted")}
            </p>

            <p
              className="cert-module-title font-semibold"
              style={{
                color: accent,
                fontFamily: "'Libre Baskerville', Georgia, serif",
              }}
            >
              {moduleTitle}
            </p>

            {score != null && (
              <p className="cert-body-text" style={{ color: "#6B7280" }}>
                {t("certificate.passingScore", { score })}
              </p>
            )}
          </div>

          <div
            className="cert-footer flex items-end justify-between"
            style={{ borderTop: `1px solid ${accent}22` }}
          >
            <div className="min-w-0 flex-1">
              {template.signatureImageUrl ? (
                <img
                  src={template.signatureImageUrl}
                  alt=""
                  className="cert-signature-img object-contain object-left"
                />
              ) : (
                <div
                  className="cert-signature-line"
                  style={{ borderBottom: `2px solid ${GOLD}`, opacity: 0.7 }}
                />
              )}
              <p className="cert-signature-label" style={{ color: "#6B7280" }}>
                {template.signatureLine}
              </p>
            </div>

            {(template.signature2ImageUrl || template.signature2Line) && (
              <div className="min-w-0 flex-1">
                {template.signature2ImageUrl ? (
                  <img
                    src={template.signature2ImageUrl}
                    alt=""
                    className="cert-signature-img object-contain object-left"
                  />
                ) : (
                  <div
                    className="cert-signature-line"
                    style={{ borderBottom: `2px solid ${GOLD}`, opacity: 0.7 }}
                  />
                )}
                <p className="cert-signature-label" style={{ color: "#6B7280" }}>
                  {template.signature2Line}
                </p>
              </div>
            )}

            <div className="cert-date-block text-right shrink-0">
              <p className="cert-date-block-label font-semibold" style={{ color: "#1A1A1A" }}>
                {dateStr}
              </p>
              <p className="cert-date-block-sub" style={{ color: "#6B7280" }}>
                {t("certificate.dateOfCompletion")}
              </p>
            </div>
          </div>
        </div>

        <div
          className="cert-sidebar shrink-0 relative flex flex-col items-center justify-between text-center"
          style={{
            background: `linear-gradient(180deg, ${accent}14 0%, ${accent}08 50%, ${accent}16 100%)`,
          }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ background: `linear-gradient(180deg, ${GOLD}, ${accent})` }}
          />

          <div className="cert-ribbon">
            <p
              className="font-bold uppercase leading-relaxed"
              style={{ color: accent, letterSpacing: "0.2em" }}
            >
              {t("certificate.ribbonLine1")}
              <br />
              {t("certificate.ribbonLine2")}
            </p>
          </div>

          <CertificateBadge className="cert-badge-wrap" />

          {score != null && (
            <div className="w-full flex flex-col items-center justify-center px-1">
              <p
                className="cert-score-label font-bold uppercase leading-tight"
                style={{ color: accent }}
              >
                {t("certificate.passScore")}
              </p>
              <p
                className="cert-score-value font-extrabold"
                style={{ color: accent }}
              >
                {score}&nbsp;%
              </p>
            </div>
          )}

          {certificateNumber && verifyUrl && (
            <div className="cert-qr-block flex flex-col items-center">
              <div
                className="p-0.5 rounded bg-white"
                style={{ border: `1px solid ${accent}33` }}
              >
                <QRCodeSVG value={verifyUrl} size={52} level="M" />
              </div>
              <p className="cert-ref break-all" style={{ color: "#6B7280" }}>
                {t("certificate.ref")}: {certificateNumber}
              </p>
            </div>
          )}
        </div>
      </div>

      {template.footerText && (
        <p className="cert-disclaimer-overlay" style={{ color: "#6B7280" }}>
          {template.footerText}
        </p>
      )}
    </div>
  );
});
