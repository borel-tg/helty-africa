import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "../locales/fr.json";
import en from "../locales/en.json";
import {
  APP_BRAND_NAME,
  APP_BRAND_SHORT_NAME,
  APP_DEVELOPER_NAME,
  APP_DEMO_EMAIL_DOMAIN,
} from "../lib/brand";

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: "fr",
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false,
    defaultVariables: {
      brandName: APP_BRAND_NAME,
      brandShortName: APP_BRAND_SHORT_NAME,
      developerName: APP_DEVELOPER_NAME,
      demoEmailDomain: APP_DEMO_EMAIL_DOMAIN,
    },
  },
  // Avoid returning raw keys like "common.status" in the UI
  returnEmptyString: false,
  returnNull: false,
});

export default i18n;