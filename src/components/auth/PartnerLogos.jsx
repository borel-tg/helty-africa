import { useTranslation } from "react-i18next";
import { PARTNERS } from "../../config/partners";
import { cn } from "../../lib/utils";

function PartnerLogoItem({ partner, onDark }) {
  return (
    <li
      className="flex flex-shrink-0 items-center justify-center px-3 sm:px-4"
      aria-label={partner.logoAlt || partner.name}
    >
      <div
        className={cn(
          "flex h-11 sm:h-12 min-w-[100px] max-w-[180px] items-center justify-center rounded-lg px-4 py-2 shadow-sm",
          onDark ? "bg-white/95" : "bg-white border border-gray-100",
        )}
      >
        <img
          src={partner.logo}
          alt={partner.logoAlt || partner.name}
          className="h-7 sm:h-8 w-auto max-w-[140px] object-contain object-center"
          loading="lazy"
          draggable={false}
        />
      </div>
    </li>
  );
}

function PartnerTrack({ partners, onDark, ariaHidden = false }) {
  return (
    <ul className="flex items-center gap-2 sm:gap-3" aria-hidden={ariaHidden || undefined}>
      {partners.map((partner) => (
        <PartnerLogoItem
          key={`${partner.id}-${ariaHidden ? "dup" : "orig"}`}
          partner={partner}
          onDark={onDark}
        />
      ))}
    </ul>
  );
}

export function PartnerLogos({ className, showLabel = true, onDark = false }) {
  const { t } = useTranslation();

  if (PARTNERS.length === 0) {
    return null;
  }

  const durationSec = Math.max(24, PARTNERS.length * 5);

  return (
    <div className={cn("py-3 sm:py-4", className)}>
      {showLabel && (
        <p
          className={cn(
            "text-center text-xs font-medium uppercase tracking-wider mb-3 px-2",
            onDark ? "text-white/80" : "text-text-secondary",
          )}
        >
          {t("auth.partnerLabel")}
        </p>
      )}

      <div
        className="partner-marquee relative w-full overflow-hidden"
        role="region"
        aria-label={t("auth.partnerMarqueeLabel")}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-16 bg-gradient-to-r to-transparent",
            onDark ? "from-primary" : "from-white",
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-16 bg-gradient-to-l to-transparent",
            onDark ? "from-primary" : "from-white",
          )}
          aria-hidden="true"
        />

        <div
          className="partner-marquee-track flex w-max items-center"
          style={{ animationDuration: `${durationSec}s` }}
        >
          <PartnerTrack partners={PARTNERS} onDark={onDark} />
          <PartnerTrack partners={PARTNERS} onDark={onDark} ariaHidden />
        </div>
      </div>
    </div>
  );
}
