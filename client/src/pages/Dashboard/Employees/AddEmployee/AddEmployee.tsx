import { useEffect, useState } from "react";
import { useAppSelector } from "../../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { Axios } from "../../../../Api/axios";
import { USERS } from "../../../../Api/Api";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser } from "react-icons/fa";
import LoadingButton from "../../../../components/LoadingButton/LoadingButton";
import axios from "axios";
import "./AddEmployee.scss";

function AddEmployee() {
  // Form state for storing user input
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    startShift: "",
    endShift: "",
  });
  
  // Validation errors state
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    startShift: "",
    endShift: "",
    general: "",
  });

  const [loading, setLoading] = useState(false); // Button loading state
  const [showPassword, setShowPassword] = useState<boolean>(false); // Toggle password visibility
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false); // Trigger form validation
  const { lang } = useAppSelector((state) => state.language); // Language selector from Redux
  const { t, i18n } = useTranslation(); // i18next for translations
  const navigate = useNavigate(); // React router navigation

  // Validate inputs again if form is submitted and language/form changed
  useEffect(() => {
    if (isSubmitted) {
      const fields = [
        "name",
        "email",
        "password",
        "confirmPassword",
        "phone",
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
  }, [form, i18n.language]);

  // Handle input change and clean phone number
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const sanitizedValue = value.replace(/[^\d+]/g, ""); // Allow only digits and "+"
      setForm({ ...form, [name]: sanitizedValue });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Show/hide password fields
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Extract hour from time input (e.g., "09:30")
  function getHour(time: string) {
    const match = time.match(/^(\d{1,2}):([0-5]\d)$/);
    if (!match) return null;

    const hour = parseInt(match[1], 10);
    return hour >= 0 && hour < 24 ? hour : null;
  }

  // Form validation function
  const validateForm = () => {
    const newErrors: { msg: string; path?: string }[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com)$/;
    const egyptianPhoneRegex = /^(?:\+?20|0)?1[0125]\d{8}$/;
    const startShiftHour = getHour(form.startShift);
    const endShiftHour = getHour(form.endShift);

    // Name validation
    if (!form.name.trim()) {
      newErrors.push({
        msg: t("dashboard.addEmployee.errors.nameRequired"),
        path: "name",
      });
    } else if (form.name.length < 4) {
      newErrors.push({
        msg: t("dashboard.addEmployee.errors.nameMin"),
        path: "name",
      });
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.push({
        msg: t("dashboard.addEmployee.errors.emailRequired"),
        path: "email",
      });
    } else if (!emailRegex.test(form.email)) {
      newErrors.push({
        msg: t("dashboard.addEmployee.errors.emailInvalid"),
        path: "email",
      });
    }

    // Password validation
    if (!form.password.trim()) {
      newErrors.push({
        msg: t("dashboard.addEmployee.errors.passwordRequired"),
        path: "password",
      });
    } else if (form.password.length < 6) {
      newErrors.push({
        msg: t("dashboard.addEmployee.errors.passwordMin"),
        path: "password",
      });
    }

    // Confirm password validation
    if (!form.confirmPassword.trim()) {
      newErrors.push({
        msg: t("dashboard.addEmployee.errors.confirmPasswordRequired"),
        path: "confirmPassword",
      });
    } else if (form.confirmPassword !== form.password) {
      newErrors.push({
        msg: t("dashboard.addEmployee.errors.confirmPasswordMismatch"),
        path: "confirmPassword",
      });
    }

    // Optional phone validation (if provided)
    if (form.phone.trim() && !egyptianPhoneRegex.test(form.phone)) {
      newErrors.push({
        msg: t("dashboard.addEmployee.errors.phoneInvalid"),
        path: "phone",
      });
    }

    // Shift time validations
    if (
      form.startShift === "" ||
      startShiftHour === null ||
      startShiftHour < 0 ||
      startShiftHour > 23
    ) {
      newErrors.push({
        msg: t("dashboard.addEmployee.errors.startShiftInvalid"),
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
        msg: t("dashboard.addEmployee.errors.endShiftInvalid"),
        path: "endShift",
      });
    }

    // Check if shifts are the same
    if (form.startShift === form.endShift) {
      newErrors.push({
        msg: t("dashboard.addEmployee.errors.shiftSame"),
        path: "",
      });
    }

    // Map the error array to a record object
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

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      startShift: "",
      endShift: "",
      general: "",
    });

    setIsSubmitted(true);

    if (!validateForm().isValid) {
      setLoading(false);
      return;
    }

    try {
      const res = await Axios.post(`${USERS}`, form);
      if (res.status === 201) {
        setLoading(false);
        // Navigate to dashboard on success
        navigate(`/${lang}/dashboard/`);
      }
    } catch (err) {
      setLoading(false);
      console.log(err);
      // Handle backend error responses
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
        <h2>
          {t("dashboard.addEmployee.title")} <FaUser />
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Name Field */}
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

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">
              {t("dashboard.addEmployee.emailLabel")}
            </label>
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

          {/* Phone Field */}
          <div className="form-group">
            <label htmlFor="phone">
              {t("dashboard.addEmployee.phoneLabel")}
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              placeholder={t("dashboard.addEmployee.phonePlaceholder")}
              value={form.phone}
              onChange={handleChange}
            />
            {errors.phone && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.phone}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">
              {t("dashboard.addEmployee.passwordLabel")}
            </label>
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

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              {t("dashboard.addEmployee.confirmPasswordLabel")}
            </label>
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

          {/* Shift Time Inputs */}
          <div className="shifts">
            <div className="form-group">
              <label htmlFor="startShift">
                {t("dashboard.addEmployee.startShiftLabel")}
              </label>
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
              <label htmlFor="endShift">
                {t("dashboard.addEmployee.endShiftLabel")}
              </label>
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

          {/* General backend or validation errors */}
          {errors.general && (
            <div className="error-box">
              <p className="error-text">
                <span className="error-star">*</span> {errors.general}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="btn-submit" disabled={loading}>
            {t("dashboard.addEmployee.submitButton")}
            {loading && <LoadingButton width="20px" height="20px" />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddEmployee;
