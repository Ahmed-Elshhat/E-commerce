import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

function LanguageWrapper({ children }: { children: React.ReactNode }) {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const supportedLanguages: string[] = ["en", "ar"];

  useEffect(() => {
    if (!lang || !supportedLanguages.includes(lang)) {
      navigate("/not-found", { replace: true });
      return;
    }
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang, i18n, navigate]);

  return supportedLanguages.includes(lang!) ? children : null;
}

export default LanguageWrapper;
