import { Award } from "lucide-react";

function LogoSlot({ logoUrl, accent, variant, gold, showFallback, scalePercent }) {
  const scale = (scalePercent ?? 100) / 100;
  const sizeStyle = { "--logo-scale": scale };

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="cert-logo cert-logo-scaled object-contain"
        style={sizeStyle}
      />
    );
  }

  if (!showFallback) {
    return <div className="cert-logo cert-logo-scaled" style={sizeStyle} aria-hidden />;
  }

  const isPremium = variant === "premium";

  if (isPremium) {
    return (
      <div
        className="cert-logo-fallback cert-logo-scaled rounded-full flex items-center justify-center shadow-sm"
        style={{
          ...sizeStyle,
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          border: `2px solid ${gold}`,
        }}
      >
        <Award className="text-white" />
      </div>
    );
  }

  return (
    <div
      className="cert-logo-fallback cert-logo-scaled rounded-full flex items-center justify-center"
      style={{ ...sizeStyle, backgroundColor: accent }}
    >
      <Award className="text-white" />
    </div>
  );
}

/**
 * Certificate header: 3 logos on one row, title and subtitle centered below.
 */
export function CertificateHeader({ template, accent, variant = "classic", gold }) {
  const isPremium = variant === "premium";
  const logos = [template.logoUrl, template.secondLogoUrl, template.thirdLogoUrl];
  const logoScales = [
    template.logoScale,
    template.secondLogoScale,
    template.thirdLogoScale,
  ];
  const hasAnyLogo = logos.some(Boolean);

  return (
    <div className="cert-header flex flex-col">
      <div className="cert-logos-row flex items-center justify-between">
        {logos.map((logoUrl, index) => (
          <div
            key={index}
            className="cert-logo-slot flex flex-1 items-center justify-center min-w-0"
          >
            <LogoSlot
              logoUrl={logoUrl}
              accent={accent}
              variant={variant}
              gold={gold}
              showFallback={!hasAnyLogo && index === 1}
              scalePercent={logoScales[index]}
            />
          </div>
        ))}
      </div>

      <div className="cert-title-section text-center min-w-0">
        <h1
          className={`cert-org-title font-bold ${isPremium ? "tracking-tight" : ""}`}
          style={{ color: accent }}
        >
          {template.organizationName}
        </h1>
        {template.programSubtitle && (
          <p
            className={
              isPremium
                ? "cert-org-subtitle uppercase font-semibold"
                : "cert-org-subtitle uppercase text-text-secondary font-medium"
            }
            style={
              isPremium
                ? { color: "#6B7280", letterSpacing: "0.18em" }
                : undefined
            }
          >
            {template.programSubtitle}
          </p>
        )}
      </div>
    </div>
  );
}
