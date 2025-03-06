import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

// جلب اللغة المحفوظة أو استخدام "en" كافتراضي
const savedLang = localStorage.getItem("lang") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: savedLang, // تعيين اللغة المحفوظة أو الافتراضية
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
