import { useTranslation } from "react-i18next";
import "./Footer.scss";
import { useEffect, useState } from "react";
import { useAppDispatch } from "../../Redux/app/hooks";
import { saveLang } from "../../Redux/feature/languageSlice/languageSlice";

function Footer() {
  const [lang, setLang] = useState<string>("");
    const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    console.log(lang);
    const localLang = localStorage.getItem("lang");
    setLang(localLang || "en");
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    setLang(newLang);
    dispatch(saveLang(newLang));
    localStorage.setItem("lang", newLang);
  };
  return (
    <footer className="footer">
      <button onClick={toggleLanguage}>{t("home.change_language")}</button>

      <div className="footer-container">
        {/* Grid Layout for Large Screens */}
        <div className="footer-grid">
          {/* About Us */}
          <div>
            <h3 className="footer-title">About Us</h3>
            <p className="footer-text">
              We are the leading e-commerce platform, offering the best deals on
              electronics, fashion, and more.
            </p>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="footer-title">Customer Service</h3>
            <ul className="footer-list">
              <li>
                <a href="#" className="footer-link">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Returns & Refunds
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="footer-title">Categories</h3>
            <ul className="footer-list">
              <li>
                <a href="#" className="footer-link">
                  Electronics
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Fashion
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Home & Living
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Health & Beauty
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="footer-title">Follow Us</h3>
            <div className="footer-social">
              <a href="#" className="footer-icon">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="#" className="footer-icon">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="footer-icon">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="footer-icon">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <p>&copy; 2025 YourStore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
