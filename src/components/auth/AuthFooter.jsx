import { useTranslation } from "react-i18next";
import { APP_CONTACT_EMAIL } from "../../lib/brand";

export function AuthFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-200/80 bg-white px-5 py-5 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 text-xs sm:text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
        <p>{t("auth.footerCopyright")}</p>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href={`mailto:${APP_CONTACT_EMAIL}`}
            className="hover:text-primary transition-colors"
          >
            {t("auth.footerEmail")}
          </a>
          <a href="tel:+2250700000000" className="hover:text-primary transition-colors">
            {t("auth.footerPhone")}
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            {t("auth.footerContact")}
          </a>
        </div>
      </div>
    </footer>
  );
}
