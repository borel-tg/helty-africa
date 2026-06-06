import { useTranslation } from "react-i18next";
import {
  APP_DEVELOPER_NAME,
  APP_DEVELOPER_WHATSAPP,
  getDeveloperWhatsAppUrl,
} from "../../lib/brand";

export function AuthFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-200/80 bg-white px-5 py-5 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 text-xs sm:text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
        <p>{t("auth.footerCopyright")}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            {t("auth.footerDevelopedBy", { developerName: APP_DEVELOPER_NAME })}
          </span>
          <span className="hidden sm:inline text-gray-300" aria-hidden="true">
            ·
          </span>
          <a
            href={getDeveloperWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <span className="text-text-secondary">{t("auth.footerWhatsApp")}</span>
            <span className="font-medium text-text-primary">{APP_DEVELOPER_WHATSAPP}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
