import { ChangeEvent, useEffect, useState } from "react";
import { useAppSelector } from "../../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { RiCoupon3Fill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { COUPONS } from "../../../../Api/Api";
import { Axios } from "../../../../Api/axios";
import axios from "axios";
import LoadingButton from "../../../../components/LoadingButton/LoadingButton";
import "./AddCoupon.scss";

function AddCoupon() {
  // Local form state
  const [form, setForm] = useState({
    name: "",
    expire: "",
    discount: 5,
  });

  // Validation errors state
  const [errors, setErrors] = useState({
    name: "",
    expire: "",
    discount: "",
    general: "",
  });

  // Loading state while submitting form
  const [loading, setLoading] = useState(false);

  // Tracks if form was ever submitted
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Get selected language from Redux store
  const { lang } = useAppSelector((state) => state.language);

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Clear field-specific error after user starts editing it again (only after submit)
  useEffect(() => {
    if (isSubmitted) {
      const fields = ["name", "expire", "discount", "general"];

      const newErrors = validateForm().errors;

      fields.forEach((field) => {
        if (!newErrors[field]) {
          setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
        }
      });
    }
  }, [form.name, form.expire, form.discount, i18n.language]);

  // Handle input changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Validate all form inputs
  const validateForm = () => {
    const newErrors: { msg: string; path?: string }[] = [];

    // Name validations
    if (!form.name.trim()) {
      newErrors.push({
        msg: t("dashboard.addCoupon.errors.nameRequired"),
        path: "name",
      });
    } else if (form.name.length < 8) {
      newErrors.push({
        msg: t("dashboard.addCoupon.errors.nameMin"),
        path: "name",
      });
    } else if (form.name.length > 20) {
      newErrors.push({
        msg: t("dashboard.addCoupon.errors.nameMax"),
        path: "name",
      });
    }

    // Expire date validations
    if (!form.expire) {
      newErrors.push({
        msg: t("dashboard.addCoupon.errors.expireRequired"),
        path: "expire",
      });
    } else {
      const selectedDateTime = new Date(form.expire).getTime();
      const currentDateTime = new Date().getTime();

      if (selectedDateTime < currentDateTime) {
        newErrors.push({
          msg: t("dashboard.addCoupon.errors.expirePast"),
          path: "expire",
        });
      }
    }

    // Discount validations (only allow predefined values)
    const allowedDiscounts = [
      5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
      100,
    ];

    if (!allowedDiscounts.includes(+form.discount)) {
      newErrors.push({
        msg:
          t("dashboard.addCoupon.errors.discountInvalid") +
          allowedDiscounts.join(", "),
        path: "discount",
      });
    }

    // Convert list of error objects into an object with field-based keys
    const errorsMap = newErrors.reduce<Record<string, string>>((acc, error) => {
      if (error.path) {
        acc[error.path] = error.msg;
      } else {
        acc.general = error.msg;
      }
      return acc;
    }, {});

    // Update state with the new errors
    setErrors((prevErrors) => ({
      ...prevErrors,
      ...errorsMap,
    }));

    return { isValid: newErrors.length === 0, errors: errorsMap };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Clear old errors
    setErrors({
      name: "",
      expire: "",
      discount: "",
      general: "",
    });

    setIsSubmitted(true);

    // If form is invalid, stop submission
    if (!validateForm().isValid) {
      setLoading(false);
      return;
    }

    try {
      // Send POST request to backend API
      const res = await Axios.post(`${COUPONS}`, {
        name: form.name,
        expire: new Date(form.expire).getTime(), // Store date as timestamp
        discount: form.discount,
      });

      // Navigate back to coupon list on success
      if (res.status === 201) {
        setLoading(false);
        navigate(`/${lang}/dashboard/coupons`);
      }
    } catch (err) {
      setLoading(false);
      console.log(err);

      // Handle Axios errors from backend
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
        // Fallback error message
        console.error("Unexpected error:", err);
        setErrors((prevErrors) => ({
          ...prevErrors,
          general: "An unexpected error occurred. Please try again later.",
        }));
      }
    }
  };

  return (
    <div className="add-coupon">
      <div className="form-container">
        <h2>
          {t("dashboard.addCoupon.title")} <RiCoupon3Fill />
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Name input */}
          <div className="form-group">
            <label htmlFor="name">{t("dashboard.addCoupon.nameLabel")}</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder={t("dashboard.addCoupon.namePlaceholder")}
              value={form.name}
              onChange={handleChange}
            />
            {errors.name && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.name}
              </p>
            )}
          </div>

          {/* Expiration date input */}
          <div className="form-group">
            <label htmlFor="expire">
              {t("dashboard.addCoupon.expireLabel")}
            </label>
            <input
              type="datetime-local"
              id="expire"
              name="expire"
              value={form.expire}
              onChange={handleChange}
            />
            {errors.expire && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.expire}
              </p>
            )}
          </div>

          {/* Discount select */}
          <div className="form-group">
            <label htmlFor="discount">
              {t("dashboard.addCoupon.discountLabel")}
            </label>
            <select
              name="discount"
              id="discount"
              value={form.discount}
              onChange={handleChange}
            >
              {/* NOTE: some values are duplicated below (e.g., 45, 60, 75, 95) */}
              {/* You may want to fix this duplication later */}
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="25">25</option>
              <option value="30">30</option>
              <option value="35">35</option>
              <option value="40">40</option>
              <option value="45">45</option>
              <option value="45">50</option>
              <option value="55">55</option>
              <option value="60">60</option>
              <option value="60">65</option>
              <option value="70">70</option>
              <option value="75">75</option>
              <option value="75">80</option>
              <option value="85">85</option>
              <option value="90">90</option>
              <option value="95">95</option>
              <option value="95">100</option>
            </select>
            {errors.discount && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.discount}
              </p>
            )}
          </div>

          {/* General error box (e.g., server error) */}
          {errors.general && (
            <div className="error-box">
              <p className="error-text">
                <span className="error-star">*</span> {errors.general}
              </p>
            </div>
          )}

          {/* Submit button with loading spinner */}
          <button type="submit" className="btn-submit" disabled={loading}>
            {t("dashboard.addCoupon.submitButton")}
            {loading && <LoadingButton width="20px" height="20px" />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddCoupon;
