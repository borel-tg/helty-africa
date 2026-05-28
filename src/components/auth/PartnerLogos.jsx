import { useTranslation } from "react-i18next";
import { PARTNERS } from "../../config/partners";
import { cn } from "../../lib/utils";

function PartnerLogoItem({ partner }) {
  const hasLogo = Boolean(partner.logo);

  return (
    <li
      className="flex flex-shrink-0 items-center justify-center px-8 sm:px-10"
      aria-label={partner.logoAlt || partner.name}
    >
      {hasLogo ? (
        <img
          src={partner.logo}
          alt={partner.logoAlt || partner.name}
          className={cn(
            "h-7 sm:h-9 w-auto max-w-[140px] object-contain object-center",
            "opacity-50 grayscale transition-all duration-300",
            "hover:opacity-90 hover:grayscale-0",
          )}
          loading="lazy"
          draggable={false}
        />
      ) : (
        <span
          className={cn(
            "block text-sm sm:text-base font-semibold tracking-tight whitespace-nowrap",
            "text-white transition-colors duration-300 hover:text-white/90",
          )}
          aria-hidden={hasLogo}
        >
          {partner.name}
        </span>
      )}
    </li>
  );
}

function PartnerTrack({ partners, ariaHidden = false }) {
  return (
    <ul className="flex items-center" aria-hidden={ariaHidden || undefined}>
      {partners.map((partner) => (
        <PartnerLogoItem
          key={`${partner.id}-${ariaHidden ? "dup" : "orig"}`}
          partner={partner}
        />
      ))}
    </ul>
  );
}

export function PartnerLogos({ className, showLabel = true, onDark = false }) {
  const { t } = useTranslation();

  return (
    <div className={cn("py-3 sm:py-4", className)}>
      {showLabel && (
        <p
          className={cn(
            "text-center text-xs font-medium uppercase tracking-wider mb-3 px-2",
            onDark ? "text-white" : "text-white",
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
        {/* Edge fade */}
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-12 sm:w-20 bg-gradient-to-r to-transparent",
            onDark ? "from-primary/95" : "from-white/90",
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-12 sm:w-20 bg-gradient-to-l to-transparent",
            onDark ? "from-primary/95" : "from-white/90",
          )}
          aria-hidden="true"
        />

        <div className="partner-marquee-track flex w-max">
          <PartnerTrack partners={PARTNERS} />
          <PartnerTrack partners={PARTNERS} ariaHidden />
        </div>
      </div>
    </div>
  );
}
