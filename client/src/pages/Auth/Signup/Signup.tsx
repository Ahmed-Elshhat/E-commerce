import { useEffect, useState } from "react";
import { SignupFormState } from "../../../Types/app";
import axios from "axios";
import { BASE_URL, SIGNUP } from "../../../Api/Api";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../../Redux/app/hooks";
import Cookie from "cookie-universal";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import "./Signup.scss";

function Signup() {
  const [form, setForm] = useState<SignupFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const cookies = Cookie();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ msg: string; path?: string }[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const { lang } = useAppSelector((state) => state.language);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (isSubmitted) {
      validateForm();
    }
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors: { msg: string; path?: string }[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com)$/;

    // التحقق من الاسم
    if (!form.name.trim()) {
      newErrors.push({ msg: "Name is required", path: "name" });
    } else if (form.name.length < 3) {
      newErrors.push({
        msg: "Name must be at least 3 characters",
        path: "name",
      });
    }

    // التحقق من البريد الإلكتروني
    if (!form.email.trim()) {
      newErrors.push({ msg: "Email is required", path: "email" });
    } else if (!emailRegex.test(form.email)) {
      newErrors.push({
        msg: "Invalid email format (user@example.com)",
        path: "email",
      });
    }

    // التحقق من كلمة المرور
    if (!form.password.trim()) {
      newErrors.push({ msg: "Password is required", path: "password" });
    } else if (form.password.length < 6) {
      newErrors.push({
        msg: "Password must be at least 6 characters",
        path: "password",
      });
    }

    // التحقق من تأكيد كلمة المرور
    if (!form.confirmPassword.trim()) {
      newErrors.push({
        msg: "Confirm Password is required",
        path: "confirmPassword",
      });
    } else if (form.confirmPassword.length < 6) {
      newErrors.push({
        msg: "Confirm Password must be at least 6 characters",
        path: "confirmPassword",
      });
    } else if (form.confirmPassword !== form.password) {
      newErrors.push({
        msg: "Confirm Password must match Password",
        path: "confirmPassword",
      });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitted(true);

    if (!validateForm()) return;

    try {
      const res = await axios.post(`${BASE_URL}${SIGNUP}`, form);
      if (res.status === 201) {
        const token = res.data.token;
        cookies.set("ECT", token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 90,
          secure: false,
          sameSite: "lax",
        });
        window.location.href = "/";
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.data?.message) {
          setErrors([{ msg: err.response.data.message }]);
        } else if (err.response.data?.errors) {
          setErrors(
            err.response.data.errors.map(
              (error: { msg: string; path: string }) => ({
                msg: error.msg,
                path: error.path,
              })
            )
          );
        }
      } else {
        console.error("Unexpected error:", err);
        setErrors([
          { msg: "An unexpected error occurred. Please try again later." },
        ]);
      }
    }
  };
  return (
    <div className="signup">
      <div className="signup-box">
        <h2>{t("signup.title")}</h2>
        <form onSubmit={handleSubmit}>
          <div className="name">
            <label htmlFor="name">{t("signup.userNameLabel")}</label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder={t("signup.userNamePlaceholder")}
              value={form.name}
              onChange={handleChange}
            />
            {errors.some((error) => error.path === "name" && isSubmitted) && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {errors.find((error) => error.path === "name")?.msg}
              </p>
            )}
          </div>

          <div className="email">
            <label htmlFor="email">{t("signup.emailLabel")}</label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder={t("signup.emailPlaceholder")}
              value={form.email}
              onChange={handleChange}
            />
            {errors.some((error) => error.path === "email" && isSubmitted) && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {errors.find((error) => error.path === "email")?.msg}
              </p>
            )}
          </div>

          <div className="password">
            <label htmlFor="password">{t("signup.passwordLabel")}</label>
            <div className="cover">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                placeholder={t("signup.passwordPlaceholder")}
                value={form.password}
                onChange={handleChange}
                style={{
                  paddingLeft: i18n.language === "ar" ? "35px" : "10px",
                  paddingRight: i18n.language === "en" ? "35px" : "10px",
                }}
              />

              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  left: i18n.language === "ar" ? "10px" : "",
                  right: i18n.language === "en" ? "10px" : "",
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.some(
              (error) => error.path === "password" && isSubmitted
            ) && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {errors.find((error) => error.path === "password")?.msg}
              </p>
            )}
          </div>

          <div className="confirmPassword">
            <label htmlFor="confirmPassword">
              {t("signup.confirmPasswordLabel")}
            </label>
            <div className="cover">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                id="confirmPassword"
                placeholder={t("signup.confirmPasswordPlaceholder")}
                value={form.confirmPassword}
                onChange={handleChange}
                style={{
                  paddingLeft: i18n.language === "ar" ? "35px" : "10px",
                  paddingRight: i18n.language === "en" ? "35px" : "10px",
                }}
              />

              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  left: i18n.language === "ar" ? "10px" : "",
                  right: i18n.language === "en" ? "10px" : "",
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.some(
              (error) => error.path === "confirmPassword" && isSubmitted
            ) && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {errors.find((error) => error.path === "confirmPassword")?.msg}
              </p>
            )}
          </div>

          {errors.some((error) => !error.path && isSubmitted) && (
            <div className="error-box">
              {errors
                .filter((error) => !error.path)
                .map((error, index) => (
                  <p key={index} className="error-text">
                    <span className="error-star">*</span> {error.msg}
                  </p>
                ))}
            </div>
          )}

          <button className="signup-btn">{t("login.loginButton")}</button>

          <div className="or-divider">
            <div className="line"></div>
            <span>{t("signup.or")}</span>
          </div>

          <a href={`${BASE_URL}/auth/google`} className="signup-google-btn">
            <FaGoogle /> {t("signup.signupWithGoogleButton")}
          </a>

          <div className="login-section">
            <p>{t("signup.Don'tHaveAnAccount")}</p>
            <Link to={`/${lang}/login`}>{t("signup.login")}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
