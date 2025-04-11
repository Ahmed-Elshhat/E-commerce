import { useEffect, useState } from "react";
import "./AddEmployee.scss";
import { useAppSelector } from "../../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { Axios } from "../../../../Api/axios";
import { USERS } from "../../../../Api/Api";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser } from "react-icons/fa";

function AddEmployee() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    startShift: "",
    endShift: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    startShift: "",
    endShift: "",
    general: "",
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const { lang } = useAppSelector((state) => state.language);
  const navigate = useNavigate();
  const { t , i18n } = useTranslation();

  useEffect(() => {
    if (isSubmitted) {
      const fields = [
        "name",
        "email",
        "password",
        "confirmPassword",
        "startShift",
        "endShift",
        "general",
      ];

      const newErrors = validateForm().errors;

      fields.forEach((field) => {
        if (!newErrors[field]) {
          setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
        }
      });
    }
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  function getHour(time: string) {
    const match = time.match(/^(\d{1,2}):([0-5]\d)$/);
    if (!match) return null;

    const hour = parseInt(match[1], 10);
    return hour >= 0 && hour < 24 ? hour : null;
  }

  const validateForm = () => {
    const newErrors: { msg: string; path?: string }[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com)$/;
    const startShiftHour = getHour(form.startShift);
    const endShiftHour = getHour(form.endShift);

    if (!form.name.trim()) {
      newErrors.push({ msg: "Name is required", path: "name" });
    } else if (form.name.length < 4) {
      newErrors.push({
        msg: "Name must be at least 4 characters",
        path: "name",
      });
    }

    if (!form.email.trim()) {
      newErrors.push({ msg: "Email is required", path: "email" });
    } else if (!emailRegex.test(form.email)) {
      newErrors.push({ msg: "Invalid email format", path: "email" });
    }

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
        msg: "Confirm Password is required",
        path: "confirmPassword",
      });
    } else if (form.confirmPassword !== form.password) {
      newErrors.push({
        msg: "Passwords do not match",
        path: "confirmPassword",
      });
    }

    if (
      form.startShift === "" ||
      startShiftHour === null ||
      startShiftHour < 0 ||
      startShiftHour > 23
    ) {
      newErrors.push({
        msg: "Invalid start shift format (HH:MM)",
        path: "startShift",
      });
    }

    if (
      form.endShift === "" ||
      endShiftHour === null ||
      endShiftHour < 0 ||
      endShiftHour > 23
    ) {
      newErrors.push({
        msg: "Invalid end shift format (HH:MM)",
        path: "endShift",
      });
    }

    if (form.startShift === form.endShift) {
      newErrors.push({
        msg: "Start and end shifts cannot be the same",
        path: "",
      });
    }

    const errorsMap = newErrors.reduce<Record<string, string>>((acc, error) => {
      if (error.path) {
        acc[error.path] = error.msg;
      } else {
        acc.general = error.msg;
      }
      return acc;
    }, {});

    setErrors((prevErrors) => ({
      ...prevErrors,
      ...errorsMap,
    }));

    return { isValid: newErrors.length === 0, errors: errorsMap };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      startShift: "",
      endShift: "",
      general: "",
    });

    setIsSubmitted(true);

    if (!validateForm().isValid) return;

    try {
      const res = await Axios.post(`${USERS}`, form);
      if (res.status === 201) {
        navigate(`/${lang}/dashboard/`);
      }
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.data?.message) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            general: err.response?.data.message,
          }));
        } else if (err.response.data?.errors) {
          const newErrors: { msg: string; path?: string }[] =
            err.response.data.errors;

          const errorsMap = newErrors.reduce<Record<string, string>>(
            (acc, error) => {
              if (error.path) {
                acc[error.path] = error.msg;
              } else {
                acc.general = error.msg;
              }
              return acc;
            },
            {}
          );

          setErrors((prevErrors) => ({
            ...prevErrors,
            ...errorsMap,
          }));
        }
      } else {
        console.error("Unexpected error:", err);
        setErrors((prevErrors) => ({
          ...prevErrors,
          general: "An unexpected error occurred. Please try again later.",
        }));
      }
    }
  };

  return (
    <div className="add-employee">
      <div className="form-container">
        <h2>{t("dashboard.addEmployee.title")} <FaUser /></h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t("dashboard.addEmployee.nameLabel")}</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder={t("dashboard.addEmployee.namePlaceholder")}
              value={form.name}
              onChange={handleChange}
            />

            {errors.name && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.name}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">{t("dashboard.addEmployee.emailLabel")}</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder={t("dashboard.addEmployee.emailPlaceholder")}
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.email}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("dashboard.addEmployee.passwordLabel")}</label>
            <div className="cover">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••"
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

            {errors.password && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.password}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t("dashboard.addEmployee.confirmPasswordLabel")}</label>
            <div className="cover">
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
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

            {errors.confirmPassword && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="shifts">
            <div className="form-group">
              <label htmlFor="startShift">{t("dashboard.addEmployee.startShiftLabel")}</label>

              <input
                type="time"
                id="startShift"
                name="startShift"
                value={form.startShift}
                onChange={handleChange}
              />

              {errors.startShift && (
                <p className="error-text">
                  <span className="error-star">*</span> {errors.startShift}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="endShift">{t("dashboard.addEmployee.endShiftLabel")}</label>
              <input
                type="time"
                id="endShift"
                name="endShift"
                value={form.endShift}
                onChange={handleChange}
              />

              {errors.endShift && (
                <p className="error-text">
                  <span className="error-star">*</span> {errors.endShift}
                </p>
              )}
            </div>
          </div>

          {errors.general && (
            <div className="error-box">
              <p className="error-text">
                <span className="error-star">*</span> {errors.general}
              </p>
            </div>
          )}

          <button type="submit" className="btn-submit">
            {t("dashboard.addEmployee.submitButton")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddEmployee;
