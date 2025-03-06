import "./Home.scss";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
function Home() {
  const [lang, setLang] = useState<string>("en");
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const localLang = localStorage.getItem("lang");
    if (localLang) {
      setLang(localLang);
    } else {
      setLang("en");
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr"; // دعم RTL
    localStorage.setItem("lang", newLang);
    navigate(`/${newLang}/`); // تحديث الـ Route بناءً على اللغة
  };
  return (
    <div className="Home">
      <div className="home-links">
        <Link to={`/${lang}/login`}>Login</Link>
        <Link to={`/${lang}/forgot-password`}>Forgot Password</Link>
        <Link to={`/${lang}/verify-reset-code`}>Verify Reset Code</Link>
        <Link to={`/${lang}/reset-password`}>Reset Password</Link>
      </div>
      <h1>{t("home.title")}</h1>
      <p>{t("home.description")}</p>
      <button onClick={toggleLanguage}>{t("home.change_language")}</button>
    </div>
  );
}

export default Home;
