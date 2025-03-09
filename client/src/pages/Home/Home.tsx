import "./Home.scss";
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import { useEffect, useState } from "react";
// import { saveLang } from "../../Redux/feature/languageSlice/languageSlice";
// import { useAppDispatch } from "../../Redux/app/hooks";
import Cards from "../../components/Cards/Cards";
function Home() {
  // const [lang, setLang] = useState<string>("");
  // const { t, i18n } = useTranslation();
  // const navigate = useNavigate();
  // const dispatch = useAppDispatch();

  // useEffect(() => {
  //   const localLang = localStorage.getItem("lang");
  //   if (localLang) {
  //     setLang(localLang);
  //   } else {
  //     setLang("en");
  //   }
  // }, []);

  // const toggleLanguage = () => {
  //   const newLang = i18n.language === "en" ? "ar" : "en";
  //   i18n.changeLanguage(newLang);
  //   document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr"; // دعم RTL
  //   setLang(newLang);
  //   dispatch(saveLang(newLang));
  //   localStorage.setItem("lang", newLang);
  //   navigate(`/${newLang}/`); // تحديث الـ Route بناءً على اللغة
  // };
  return (
    <>
      {/* <button onClick={toggleLanguage}>{t("home.change_language")}</button> */}
      <div className="Home">
        <div className="container">
          
          <Cards />
        </div>
      </div>
    </>
  );
}

export default Home;
