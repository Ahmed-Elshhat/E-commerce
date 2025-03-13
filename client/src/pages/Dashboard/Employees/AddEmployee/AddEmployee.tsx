import { useEffect, useState } from "react";
import "./AddEmployee.scss";
import { useAppSelector } from "../../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { Axios } from "../../../../Api/axios";
import { USERS } from "../../../../Api/Api";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
  const [errors, setErrors] = useState<{ msg: string; path?: string }[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const { lang } = useAppSelector((state) => state.language);
  const navigate = useNavigate();
  const { i18n } = useTranslation();

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com)$/;
    const timeRegex = /^([01]\d|2[0-4]):([0-5]\d)$/;

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

    if (form.startShift && !timeRegex.test(form.startShift)) {
      newErrors.push({
        msg: "Invalid start shift format (HH:MM)",
        path: "startShift",
      });
    }

    if (form.endShift && !timeRegex.test(form.endShift)) {
      newErrors.push({
        msg: "Invalid end shift format (HH:MM)",
        path: "endShift",
      });
    }

    if (form.startShift === form.endShift) {
      newErrors.push({
        msg: "Start and end shifts cannot be the same",
        path: "shiftMatch",
      });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitted(true);

    if (!validateForm()) return;

    try {
      const res = await Axios.post(`${USERS}`, form);
      if (res.status === 201) {
        navigate(`/${lang}/dashboard/`);
      }
    } catch (err) {
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
    <div className="add-employee">
      <div className="form-container">
        <h2>إضافة موظف جديد</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">الاسم</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="أدخل اسم الموظف"
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

          <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="أدخل البريد الإلكتروني"
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

          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
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

            {errors.some(
              (error) => error.path === "password" && isSubmitted
            ) && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {errors.find((error) => error.path === "password")?.msg}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
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

            {errors.some(
              (error) => error.path === "confirmPassword" && isSubmitted
            ) && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {errors.find((error) => error.path === "confirmPassword")?.msg}
              </p>
            )}
          </div>

          <div className="shifts">
            <div className="form-group">
              <label htmlFor="startShift">startShift</label>

              <input
                type="time"
                id="startShift"
                name="startShift"
                value={form.startShift}
                onChange={handleChange}
              />

              {errors.some(
                (error) => error.path === "shiftMatch" && isSubmitted
              ) && (
                <p className="error-text">
                  <span className="error-star">*</span>{" "}
                  {errors.find((error) => error.path === "shiftMatch")?.msg}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="endShift">endShift</label>
              <input
                type="time"
                id="endShift"
                name="endShift"
                value={form.endShift}
                onChange={handleChange}
              />

              {errors.some(
                (error) => error.path === "endShift" && isSubmitted
              ) && (
                <p className="error-text">
                  <span className="error-star">*</span>{" "}
                  {errors.find((error) => error.path === "endShift")?.msg}
                </p>
              )}
            </div>
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

          <button type="submit" className="btn-submit">
            إضافة الموظف
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddEmployee;
