import { useEffect, useState } from "react";
import "./ResetPassword.scss";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ResetPasswordFormState } from "../../../Types/app";
import { useAppDispatch, useAppSelector } from "../../../Redux/app/hooks";
import { BASE_URL, RESET_PASSWORD } from "../../../Api/Api";
import Cookie from "cookie-universal";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
import { useNavigate } from "react-router-dom";
import { clearData } from "../../../Redux/feature/resetDataPassSlice/resetDataPassSlice";
import { useTranslation } from "react-i18next";

function ResetPassword() {
  const [form, setForm] = useState<ResetPasswordFormState>({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ msg: string; path?: string }[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { email, resetCode } = useAppSelector((state) => state.resetDataPass);
  const { lang } = useAppSelector((state) => state.language);
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const cookies = Cookie();

  useEffect(() => {
    if (!email || !resetCode) {
      dispatch(clearData());
      navigate(`/${lang}/forgot-password`, { replace: true });
      return;
    }
  }, [dispatch, email, lang, navigate, resetCode]);

  useEffect(() => {
    if (isSubmitted) {
      validateForm();
    }
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors: { msg: string; path?: string }[] = [];
    if (!form.password.trim()) {
      newErrors.push({ msg: "Password is required", path: "password" });
    } else if (form.password.length < 6) {
      newErrors.push({
        msg: "Password must be at least 6 characters",
        path: "password",
      });
    }

    if (!form.confirmPassword.trim()) {
      newErrors.push({
        msg: "Confirmation password is required",
        path: "confirmPassword",
      });
    } else if (form.confirmPassword.length < 6) {
      newErrors.push({
        msg: "Confirmation password must be at least 6 characters",
        path: "confirmPassword",
      });
    }

    if (form.password !== form.confirmPassword) {
      newErrors.push({
        msg: "Passwords do not match",
        path: "confirmPassword",
      });
    }

    if (newErrors.length !== 0) {
      setLoading(false);
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setIsSubmitted(true);
    if (!validateForm()) return;
    try {
      const res = await axios.put(`${BASE_URL}${RESET_PASSWORD}`, {
        newPassword: form.password,
        confirmPassword: form.confirmPassword,
        email,
        resetCode,
      });
      if (res.status === 200) {
        setLoading(false);
        const token = res.data.token;
        cookies.set("ECT", token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 90,
          secure: false,
          sameSite: "lax",
        });
        dispatch(clearData());
        window.location.href = "/";
      }
    } catch (err) {
      setLoading(false);
      console.log(err);
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
    <>
      {loading && <Loading transparent={true} />}
      <div className="reset-pass">
        <div className="reset-pass-box">
          <h2>{t("resetPassword.title")}</h2>
          <p>{t("resetPassword.instruction")}</p>

          <form onSubmit={handleSubmit}>
            <div className="new-pass">
              <label htmlFor="new-password">
                {t("resetPassword.passwordLabel")}
              </label>
              <div className="input-cover">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  placeholder={t("resetPassword.passwordPlaceholder")}
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
                  className="absolute right-3 top-4 text-gray-500 focus:outline-none cursor-pointer text-xl"
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

            <div className="confirm-password">
              <label htmlFor="confirm-password">
                {t("resetPassword.confirmPasswordLabel")}
              </label>
              <div className="input-cover">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="confirm-password"
                  placeholder={t("resetPassword.confirmPasswordPlaceholder")}
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
                  {
                    errors.find((error) => error.path === "confirmPassword")
                      ?.msg
                  }
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

            <button type="submit" className="submit-btn">
              {t("resetPassword.resetButton")}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default ResetPassword;
