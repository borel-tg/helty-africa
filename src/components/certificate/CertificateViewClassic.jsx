import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Award } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "../../lib/utils";
import { mergeTemplate } from "../../lib/certificate/defaults";
import { CertificateBadge } from "./CertificateBadge";

/**
 * Template 1 — Classic landscape certificate (default layout).
 */
export const CertificateViewClassic = forwardRef(
  function CertificateViewClassic(
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
    ref,
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
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ border: `3px solid ${border}` }}
        />
        <div
          className="absolute inset-[6px] pointer-events-none"
          style={{ border: `1px solid ${border}`, opacity: 0.45 }}
        />

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
                  className="cert-logo-fallback rounded-full flex items-center justify-center"
                  style={{ backgroundColor: accent }}
                >
                  <Award className="text-white" />
                </div>
              )}

              <div className="flex-1 text-center min-w-0 px-1">
                <h1
                  className="cert-org-title font-bold"
                  style={{ color: accent }}
                >
                  {template.organizationName}
                </h1>
                {template.programSubtitle && (
                  <p className="cert-org-subtitle uppercase text-text-secondary font-medium">
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
                  className="cert-logo-fallback rounded-full flex items-center justify-center"
                  style={{ backgroundColor: accent }}
                >
                  <Award className="text-white" />
                </div>
              )}
            </div>

            <div className="cert-body flex-1 flex flex-col justify-center min-h-0">
              <p className="cert-date text-text-secondary">{dateStr}</p>

              <p
                className="cert-learner-name font-bold text-text-primary"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {learnerName}
              </p>

              <p className="cert-body-text text-text-secondary">
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
                <p className="cert-body-text text-text-secondary">
                  {t("certificate.passingScore", { score })}
                </p>
              )}
            </div>

            <div className="cert-footer flex items-end justify-between border-t border-gray-100">
              <div className="min-w-0 flex-1">
                {template.signatureImageUrl ? (
                  <img
                    src={template.signatureImageUrl}
                    alt=""
                    className="cert-signature-img object-contain object-left"
                  />
                ) : (
                  <div className="cert-signature-line border-b-2 border-gray-300" />
                )}
                <p className="cert-signature-label text-text-secondary">
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
                    <div className="cert-signature-line border-b-2 border-gray-300" />
                  )}
                  <p className="cert-signature-label text-text-secondary">
                    {template.signature2Line}
                  </p>
                </div>
              )}

              <div className="cert-date-block text-right shrink-0">
                <p className="cert-date-block-label font-medium text-text-primary">
                  {dateStr}
                </p>
                <p className="cert-date-block-sub text-text-secondary">
                  {t("certificate.dateOfCompletion")}
                </p>
              </div>
            </div>

            {template.footerText && (
              <p className="cert-disclaimer text-text-secondary">
                {template.footerText}
              </p>
            )}
          </div>

          <div
            className="cert-sidebar shrink-0 relative flex flex-col items-center justify-between text-center"
            style={{ backgroundColor: `${accent}18` }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ backgroundColor: accent }}
            />

            <div className="cert-ribbon">
              <p
                className="font-bold uppercase leading-relaxed"
                style={{ color: accent }}
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
                <QRCodeSVG value={verifyUrl} size={56} level="M" />
                <p className="cert-ref text-text-secondary break-all">
                  {t("certificate.ref")}: {certificateNumber}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
