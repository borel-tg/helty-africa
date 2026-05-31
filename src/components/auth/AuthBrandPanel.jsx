import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import congoMap from "../../assets/congo-logo.png";
import { PartnerLogos } from "./PartnerLogos";

const TESTIMONIAL_KEYS = ["testimonial1", "testimonial2", "testimonial3"];

const AVATAR_COLORS = ["bg-primary-300", "bg-secondary-300", "bg-primary-400"];

export function AuthBrandPanel({ compact = false }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  const prev = () =>
    setIndex(
      (i) => (i - 1 + TESTIMONIAL_KEYS.length) % TESTIMONIAL_KEYS.length,
    );
  const next = () => setIndex((i) => (i + 1) % TESTIMONIAL_KEYS.length);

  const key = TESTIMONIAL_KEYS[index];

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden bg-primary text-white",
        compact
          ? "min-h-[140px] p-6 lg:min-h-0 lg:p-10"
          : "min-h-[200px] p-8 lg:min-h-screen lg:p-12",
      )}
    >
      {/* DRC map watermark + decorative glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <img
          src={congoMap}
          alt=""
          className={cn(
            "absolute object-contain select-none",
            compact
              ? "right-0 top-1/2 w-[55%] max-w-[200px] -translate-y-1/2 opacity-[0.12]"
              : "right-[-6%] bottom-[-4%] w-[min(88%,480px)] max-h-[78%] opacity-[0.16] sm:opacity-[0.14]",
          )}
        />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary-300 blur-3xl" />
          <div className="absolute bottom-1/3 -left-16 h-48 w-48 rounded-full bg-primary-400 blur-2xl" />
          <Sparkles
            className="absolute top-1/4 right-1/4 h-32 w-32 text-white/10"
            strokeWidth={1}
          />
        </div>
      </div>

      <div className="relative z-10 flex flex-col flex-1 gap-6 lg:gap-8">
        <div>
          <h1
            className={cn(
              "font-semibold leading-tight tracking-tight",
              compact
                ? "text-lg sm:text-xl"
                : "text-4xl sm:text-4xl lg:text-[2rem]",
            )}
          >
            {t("auth.brandHeadline")}
          </h1>
          {!compact && (
            <p className="mt-5 text-sm sm:text-base text-white/85 max-w-lg leading-relaxed">
              {t("auth.brandSubtitle")}
            </p>
          )}
        </div>

        {!compact && (
          <>
            <PartnerLogos
              className="rounded-xl border border-white/20 bg-white/10"
              showLabel
              onDark
            />

            <div className="flex-1 flex flex-col justify-center max-w-lg">
              <p className="text-sm font-medium text-white/70 mb-3">
                {t("auth.testimonialTitle")}
              </p>
              <blockquote className="text-base sm:text-lg leading-relaxed text-white/95">
                &ldquo;{t(`auth.${key}Quote`)}&rdquo;
              </blockquote>
              <cite className="mt-4 block text-sm not-italic text-white/75">
                — {t(`auth.${key}Author`)}
              </cite>
              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  onClick={prev}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                  aria-label={t("auth.prevTestimonial")}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                  aria-label={t("auth.nextTestimonial")}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="relative rounded-2xl bg-white p-5 sm:p-6 text-text-primary shadow-lg">
              <div className="absolute -top-3 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
                <Sparkles size={14} className="text-primary" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold pr-8 leading-snug">
                {t("auth.insetCtaTitle")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                {t("auth.insetCtaSubtitle")}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {AVATAR_COLORS.map((color, i) => (
                    <div
                      key={color}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white",
                        color,
                      )}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-medium text-text-secondary">
                  {t("auth.insetCtaLearners")}
                </span>
              </div>
            </div>
          </>
        )}

        {compact && (
          <p className="text-sm text-white/80 leading-relaxed max-w-md">
            {t("auth.brandSubtitle")}
          </p>
        )}
      </div>
    </div>
  );
}
