import { useEffect, useState } from "react";
import "./Login.scss";
import { Link, useLocation } from "react-router-dom";
import Cookie from "cookie-universal";
import axios from "axios";
import { BASE_URL, LOGIN } from "../../../Api/Api";
import { LoginFormState } from "../../../Types/app";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { useTranslation } from "react-i18next";

function Login() {
  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const cookies = Cookie();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ msg: string; path?: string }[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const redirectToReferrer = location.state?.path || "/";

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

    if (!form.email.trim()) {
      newErrors.push({ msg: "Email is required", path: "email" });
    } else if (!emailRegex.test(form.email)) {
      newErrors.push({
        msg: "Invalid email format (user@example.com)",
        path: "email",
      });
    }

    if (!form.password.trim()) {
      newErrors.push({ msg: "Password is required", path: "password" });
    } else if (form.password.length < 6) {
      newErrors.push({
        msg: "Password must be at least 6 characters",
        path: "password",
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
      const res = await axios.post(`${BASE_URL}${LOGIN}`, form);
      if (res.status === 200) {
        const token = res.data.token;
        cookies.set("ECT", token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 90,
          secure: false,
          sameSite: "lax",
        });
        window.location.href = redirectToReferrer;
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
    <div className="login">
      <div className="login-box">
        <h2>{t("login.title")}</h2>
        <form onSubmit={handleSubmit}>
          <div className="email">
            <label htmlFor="email">{t("login.emailLabel")}</label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder={t("login.emailLabel")}
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
            <label htmlFor="password">{t("login.passwordLabel")}</label>
            <div className="password-cover">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                placeholder={t("login.passwordPlaceholder")}
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

          <div className="remember-me-and-forgot-pass">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">{t("login.rememberMe")}</label>
            </div>

            <div className="forgot-pass">
              <Link to="/forgot-password">{t("login.forgotPassword")}</Link>
            </div>
          </div>

          <button className="signin-btn">{t("login.loginButton")}</button>

          <div className="or-divider">
            <div className="line"></div>
            <span>{t("login.or")}</span>
          </div>

          <a href={`${BASE_URL}/auth/google`} className="signin-google-btn">
            <FaGoogle /> {t("login.loginWithGoogleButton")}
          </a>

          <div className="signup">
            <p>{t("login.Don'tHaveAnAccount")}</p>
            <Link to="/signup">{t("login.signup")}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
