import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Award } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "../../lib/utils";
import { mergeTemplate } from "../../lib/certificate/defaults";
import { CertificateBadge } from "./CertificateBadge";

/**
 * Template 1 — Classic landscape certificate (default layout).
 *
 * Layout map (A4 landscape, ~72% main + ~28% sidebar):
 * ┌────────────────────────────────────────────┬──────────┐
 * │ HEADER: left logo | org name + subtitle | right logo   │ RIBBON   │
 * ├────────────────────────────────────────────┤ title    │
 * │ BODY: date, learner name, completion line, │ badge    │
 * │       module title, score                  │ score    │
 * ├────────────────────────────────────────────┤ QR+ref   │
 * │ FOOTER: signature 1 | signature 2 | date   │          │
 * └────────────────────────────────────────────┴──────────┘
 * FOOTER DISCLAIMER (absolute, bottom-left)
 *
 * Editable via admin: organizationName, programSubtitle, logos, signatures,
 * borderColor, accentColor, backgroundImageUrl, footerText.
 * Dynamic per certificate: learnerName, moduleTitle, score, issuedAt,
 * certificateNumber, verifyUrl.
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
      /* ── ROOT: A4 landscape canvas (297:210) — PDF export captures this node ── */
      <div
        ref={ref}
        className={`relative bg-white overflow-hidden select-none ${className}`}
        style={{
          aspectRatio: "297 / 210",
          width: "100%",
          maxWidth: "900px",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* ── FRAME: outer double border (admin: borderColor) ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ border: `3px solid ${border}` }}
        />
        <div
          className="absolute inset-[6px] pointer-events-none"
          style={{ border: `1px solid ${border}`, opacity: 0.45 }}
        />

        {/* ── WATERMARK: CSS guilloché pattern (accent color) ── */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `repeating-radial-gradient(circle at 20% 30%, ${accent} 0px, transparent 8px),
            repeating-radial-gradient(circle at 80% 70%, ${accent} 0px, transparent 10px),
            repeating-linear-gradient(45deg, ${accent} 0 1px, transparent 1px 12px)`,
          }}
        />

        {/* ── BACKGROUND: optional uploaded watermark image (admin: backgroundImageUrl) ── */}
        {template.backgroundImageUrl && (
          <img
            src={template.backgroundImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.07] pointer-events-none"
          />
        )}

        {/* ── LAYOUT ROW: main content (left) + ribbon sidebar (right) ── */}
        <div className="relative z-10 flex h-full min-h-0">
          {/* ══════════════════════════════════════════════════════════════
            MAIN COLUMN (~72% width)
            ══════════════════════════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col px-8 py-7 md:px-10 md:py-8 min-w-0">
            {/* ── HEADER: 3-column — left logo | org title | right logo ── */}
            <div className="flex items-center justify-between gap-3 mb-1">
              {/* Header — left logo (admin: logoUrl) */}
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

              {/* Header — right logo / partner logo (admin: secondLogoUrl) */}
              {template.secondLogoUrl ? (
                <img
                  src={template.secondLogoUrl}
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
            </div>

            {/* Header — center: organization name + program subtitle */}
            <div className="text-center min-w-0 px-2mb-3">
              <h1
                className="text-xl md:text-2xl font-bold leading-tight"
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

            {/* ── BODY: issue date, learner name, completion text, module, score ── */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Body — issue date */}
              <p className="text-xs text-text-secondary mb-2">{dateStr}</p>

              {/* Body — learner full name (dynamic) */}
              <p
                className="text-2xl md:text-3xl font-bold text-text-primary leading-tight mb-2"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {learnerName}
              </p>

              {/* Body — static French line: "a terminé avec succès la formation" */}
              <p className="text-sm text-text-secondary mb-1">
                {t("certificate.hasCompleted")}
              </p>

              {/* Body — training program / module title (dynamic) */}
              <p
                className="text-lg md:text-xl font-semibold mb-3"
                style={{
                  color: accent,
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                }}
              >
                {moduleTitle}
              </p>

              {/* Body — optional score line (hidden when score is null) */}
              {score != null && (
                <p className="text-sm text-text-secondary">
                  {t("certificate.passingScore", { score })}
                </p>
              )}
            </div>

            {/* ── FOOTER: signatures row + completion date ── */}
            <div className="flex items-end justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
              {/* Footer — signature 1 (admin: signatureImageUrl, signatureLine) */}
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

              {/* Footer — signature 2, optional (admin: signature2ImageUrl, signature2Line) */}
              {(template.signature2ImageUrl || template.signature2Line) && (
                <div className="min-w-0">
                  {template.signature2ImageUrl ? (
                    <img
                      src={template.signature2ImageUrl}
                      alt=""
                      className="h-10 object-contain object-left mb-1"
                    />
                  ) : (
                    <div className="w-36 border-b-2 border-gray-300 mb-1" />
                  )}
                  <p className="text-[10px] md:text-xs text-text-secondary leading-snug">
                    {template.signature2Line}
                  </p>
                </div>
              )}

              {/* Footer — completion date block (right-aligned) */}
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-text-primary">
                  {dateStr}
                </p>
                <p className="text-[10px] text-text-secondary">
                  {t("certificate.dateOfCompletion")}
                </p>
              </div>
            </div>

            {/* ── DISCLAIMER: optional footer text (admin: footerText) ── */}
            {template.footerText && (
              <p className="mt-10 bottom-2 left-3 right-8 text-left text-[7px] md:text-[8px] text-text-secondary leading-tight z-20">
                {template.footerText}
              </p>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════
            RIGHT SIDEBAR RIBBON (~28% width, max 200px)
            ══════════════════════════════════════════════════════════════ */}
          <div
            className="w-[28%] max-w-[200px] shrink-0 relative flex flex-col items-center justify-between py-8 px-3 text-center"
            style={{ backgroundColor: `${accent}18` }}
          >
            {/* Sidebar — vertical accent stripe (left edge) */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ backgroundColor: accent }}
            />

            {/* Sidebar — ribbon title: "CERTIFICAT / DE RÉUSSITE" */}
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

            {/* Sidebar — COUP award badge (static asset: src/assets/certificate/badge.png) */}
            <CertificateBadge className="w-[100px] md:w-[120px]" />

            {/* Sidebar — pass score block (hidden when score is null) */}
            {score != null && (
              <div className="w-full flex flex-col items-center justify-center py-1 px-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-widest leading-tight"
                  style={{ color: accent }}
                >
                  {t("certificate.passScore")}
                </p>
                <p
                  className="text-2xl md:text-3xl font-extrabold leading-tight mt-0.5"
                  style={{ color: accent }}
                >
                  {score}&nbsp;%
                </p>
              </div>
            )}

            {/* Sidebar — QR verification + reference number (only on issued certificates) */}
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
      </div>
    );
  },
);
