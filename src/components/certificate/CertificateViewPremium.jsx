import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Award } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "../../lib/utils";
import { mergeTemplate } from "../../lib/certificate/defaults";
import { CertificateBadge } from "./CertificateBadge";

/** Gold accent used for corner ornaments, dividers, and signature lines. */
const GOLD = "#C9A227";

/** Decorative SVG corner flourish — rendered in all four corners of the certificate. */
function CornerOrnament({ className, flipX, flipY }) {
  return (
    <svg
      className={`absolute pointer-events-none ${className}`}
      width="48"
      height="48"
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
 *
 * Same information architecture as Classic, with extra decoration:
 * triple border, SVG guilloché, linen texture, gold corner ornaments,
 * gold/green header divider, gradient sidebar.
 *
 * Layout map (A4 landscape, ~72% main + ~28% sidebar):
 * ┌────────────────────────────────────────────┬──────────┐
 * │ [corner ornaments in all four corners]                 │
 * │ HEADER: left logo | org name + subtitle | right logo   │ RIBBON   │
 * │ DIVIDER: gold — diamond — green                        │ title    │
 * ├────────────────────────────────────────────┤ badge    │
 * │ BODY: date, learner name, completion line, │ score    │
 * │       module title, score                  │ QR+ref   │
 * ├────────────────────────────────────────────┤          │
 * │ FOOTER: signature 1 | signature 2 | date   │          │
 * └────────────────────────────────────────────┴──────────┘
 * FOOTER DISCLAIMER (absolute, bottom-left)
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
    /* ── ROOT: A4 landscape canvas (297:210) — PDF export captures this node ── */
    <div
      ref={ref}
      className={`relative bg-white overflow-hidden select-none ${className}`}
      style={{
        aspectRatio: "297 / 210",
        width: "100%",
        maxWidth: "900px",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#1A1A1A",
      }}
    >
      {/* ── FRAME: triple border — green outer + green inner + gold inset ── */}
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

      {/* ── WATERMARK: SVG guilloché repeating pattern (accent color) ── */}
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

      {/* ── WATERMARK: linen cross-hatch texture overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, #1A1A1A 0 1px, transparent 1px 3px),
            repeating-linear-gradient(90deg, #1A1A1A 0 1px, transparent 1px 3px)`,
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

      {/* ── DECORATION: gold corner ornaments (top-left, top-right, bottom-left, bottom-right) ── */}
      <CornerOrnament className="top-3 left-3" />
      <CornerOrnament className="top-3 right-3" flipX />
      <CornerOrnament className="bottom-3 left-3" flipY />
      <CornerOrnament className="bottom-3 right-3" flipX flipY />

      {/* ── LAYOUT ROW: main content (left) + ribbon sidebar (right) ── */}
      <div className="relative z-10 flex h-full min-h-0">
        {/* ══════════════════════════════════════════════════════════════
            MAIN COLUMN (~72% width)
            ══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col px-8 py-7 md:px-10 md:py-8 min-w-0">
          {/* ── HEADER: 3-column — left logo | org title | right logo ── */}
          <div className="flex items-center justify-between gap-3 mb-4">
            {/* Header — left logo (admin: logoUrl) */}
            {template.logoUrl ? (
              <img
                src={template.logoUrl}
                alt=""
                className="h-14 w-14 object-contain shrink-0"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  border: `2px solid ${GOLD}`,
                }}
              >
                <Award size={26} className="text-white" />
              </div>
            )}

            {/* Header — center: organization name + program subtitle */}
            <div className="flex-1 text-center min-w-0 px-2">
              <h1
                className="text-xl md:text-2xl font-bold leading-tight tracking-tight"
                style={{ color: accent }}
              >
                {template.organizationName}
              </h1>
              {template.programSubtitle && (
                <p
                  className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] mt-1.5 font-semibold"
                  style={{ color: "#6B7280" }}
                >
                  {template.programSubtitle}
                </p>
              )}
            </div>

            {/* Header — right logo / partner logo (admin: secondLogoUrl) */}
            {template.secondLogoUrl ? (
              <img
                src={template.secondLogoUrl}
                alt=""
                className="h-14 w-14 object-contain shrink-0"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  border: `2px solid ${GOLD}`,
                }}
              >
                <Award size={26} className="text-white" />
              </div>
            )}
          </div>

          {/* ── DIVIDER: gold line — diamond — green line (premium only) ── */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-px" style={{ backgroundColor: GOLD, opacity: 0.6 }} />
            <div
              className="w-2 h-2 rotate-45 shrink-0"
              style={{ backgroundColor: accent }}
            />
            <div className="flex-1 h-px" style={{ backgroundColor: accent, opacity: 0.35 }} />
          </div>

          {/* ── BODY: issue date, learner name, completion text, module, score ── */}
          <div className="flex-1 flex flex-col justify-center pl-1">
            {/* Body — issue date */}
            <p className="text-[11px] mb-3" style={{ color: "#6B7280" }}>
              {dateStr}
            </p>

            {/* Body — learner full name (dynamic) */}
            <p
              className="text-[26px] md:text-[32px] font-bold leading-tight mb-2"
              style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                color: "#1A1A1A",
              }}
            >
              {learnerName}
            </p>

            {/* Body — static French line: "a terminé avec succès la formation" */}
            <p className="text-sm mb-1.5" style={{ color: "#6B7280" }}>
              {t("certificate.hasCompleted")}
            </p>

            {/* Body — training program / module title (dynamic) */}
            <p
              className="text-lg md:text-xl font-semibold mb-3 leading-snug"
              style={{
                color: accent,
                fontFamily: "'Libre Baskerville', Georgia, serif",
              }}
            >
              {moduleTitle}
            </p>

            {/* Body — optional score line (hidden when score is null) */}
            {score != null && (
              <p className="text-sm" style={{ color: "#6B7280" }}>
                {t("certificate.passingScore", { score })}
              </p>
            )}
          </div>

          {/* ── FOOTER: signatures row + completion date ── */}
          <div
            className="flex items-end justify-between gap-4 mt-4 pt-4"
            style={{ borderTop: `1px solid ${accent}22` }}
          >
            {/* Footer — signature 1 (admin: signatureImageUrl, signatureLine) */}
            <div className="min-w-0">
              {template.signatureImageUrl ? (
                <img
                  src={template.signatureImageUrl}
                  alt=""
                  className="h-10 object-contain object-left mb-1"
                />
              ) : (
                <div
                  className="w-36 mb-1"
                  style={{ borderBottom: `2px solid ${GOLD}`, opacity: 0.7 }}
                />
              )}
              <p
                className="text-[10px] md:text-xs leading-snug"
                style={{ color: "#6B7280" }}
              >
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
                  <div
                    className="w-36 mb-1"
                    style={{ borderBottom: `2px solid ${GOLD}`, opacity: 0.7 }}
                  />
                )}
                <p
                  className="text-[10px] md:text-xs leading-snug"
                  style={{ color: "#6B7280" }}
                >
                  {template.signature2Line}
                </p>
              </div>
            )}

            {/* Footer — completion date block (right-aligned) */}
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold" style={{ color: "#1A1A1A" }}>
                {dateStr}
              </p>
              <p className="text-[10px]" style={{ color: "#6B7280" }}>
                {t("certificate.dateOfCompletion")}
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            RIGHT SIDEBAR RIBBON (~28% width, max 200px)
            ══════════════════════════════════════════════════════════════ */}
        <div
          className="w-[28%] max-w-[200px] shrink-0 relative flex flex-col items-center justify-between py-7 px-3 text-center"
          style={{
            background: `linear-gradient(180deg, ${accent}14 0%, ${accent}08 50%, ${accent}16 100%)`,
          }}
        >
          {/* Sidebar — vertical gradient stripe (left edge: gold → green) */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ background: `linear-gradient(180deg, ${GOLD}, ${accent})` }}
          />

          {/* Sidebar — ribbon title: "CERTIFICAT / DE RÉUSSITE" */}
          <div className="pt-1">
            <p
              className="text-[9px] font-bold uppercase tracking-[0.28em] leading-relaxed"
              style={{ color: accent }}
            >
              {t("certificate.ribbonLine1")}
              <br />
              {t("certificate.ribbonLine2")}
            </p>
          </div>

          {/* Sidebar — COUP award badge (static asset: src/assets/certificate/badge.png) */}
          <CertificateBadge className="w-[72px] md:w-[88px]" />

          {/* Sidebar — pass score block (hidden when score is null) */}
          {score != null && (
            <div className="w-full flex flex-col items-center justify-center py-1 px-2">
              <p
                className="text-[9px] font-bold uppercase tracking-[0.2em] leading-tight"
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
            <div className="flex flex-col items-center gap-1.5 pb-1">
              <div
                className="p-1 rounded bg-white"
                style={{ border: `1px solid ${accent}33` }}
              >
                <QRCodeSVG value={verifyUrl} size={52} level="M" />
              </div>
              <p
                className="text-[7px] leading-tight break-all max-w-[120px]"
                style={{ color: "#6B7280" }}
              >
                {t("certificate.ref")}: {certificateNumber}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── DISCLAIMER: optional footer text (admin: footerText) ── */}
      {template.footerText && (
        <p
          className="absolute bottom-2 left-4 right-[30%] text-left text-[7px] md:text-[8px] leading-tight z-20"
          style={{ color: "#6B7280" }}
        >
          {template.footerText}
        </p>
      )}
    </div>
  );
});
