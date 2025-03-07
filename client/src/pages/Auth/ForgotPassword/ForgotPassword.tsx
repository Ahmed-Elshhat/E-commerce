import { useEffect, useState } from "react";
import "./ForgotPassword.scss";
import axios from "axios";
import { BASE_URL, FORGOT_PASSWORD } from "../../../Api/Api";
import { useNavigate } from "react-router-dom";
import { saveEmail } from "../../../Redux/feature/resetDataPassSlice/resetDataPassSlice";
import { useAppDispatch, useAppSelector } from "../../../Redux/app/hooks";
import Loading from "../../../components/Loading/Loading";
import { useTranslation } from "react-i18next";

function ForgotPassword() {
  const [email, setEmail] = useState<string>("");
  const [errors, setErrors] = useState<{ msg: string; path?: string }[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { lang } = useAppSelector((state) => state.language);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSubmitted) {
      validateForm();
    }
  }, [email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const validateForm = () => {
    const newErrors: { msg: string; path?: string }[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com)$/;

    if (!email.trim()) {
      newErrors.push({ msg: "Email is required", path: "email" });
    } else if (!emailRegex.test(email)) {
      newErrors.push({
        msg: "Invalid email format (user@example.com)",
        path: "email",
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
      const res = await axios.post(`${BASE_URL}${FORGOT_PASSWORD}`, { email });
      if (res.status === 200) {
        setLoading(false);
        dispatch(saveEmail(email));
        navigate(`/${lang}/verify-reset-code`, { replace: true });
      }
    } catch (err) {
      setLoading(false);
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
        setErrors([
          { msg: "An unexpected error occurred. Please try again later." },
        ]);
      }
    }
  };

  return (
    <>
      {loading && <Loading transparent={true} />}
      <div className="forgot-password">
        <div className="forgot-pass-box">
          <h2>{t("forgotPassword.title")}</h2>
          <p>{t("forgotPassword.instruction")}</p>
          <form onSubmit={handleSubmit}>
            <div className="email">
              <label htmlFor="email">{t("forgotPassword.emailLabel")}</label>
              <input
                type="text"
                name="email"
                id="email"
                placeholder={t("forgotPassword.emailPlaceholder")}
                value={email}
                onChange={handleChange}
              />
              {errors.some(
                (error) => error.path === "email" && isSubmitted
              ) && (
                <p className="error-text">
                  <span className="error-star">*</span>{" "}
                  {errors.find((error) => error.path === "email")?.msg}
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

            <div className="btns">
              <button type="submit" className="submit-btn">
                {t("forgotPassword.sendButton")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ForgotPassword;
