import { ChangeEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../../../Redux/app/hooks";
import { RiCoupon3Fill } from "react-icons/ri";
import { COUPONS } from "../../../../Api/Api";
import { Axios } from "../../../../Api/axios";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import LoadingButton from "../../../../components/LoadingButton/LoadingButton";
import "./UpdateCoupon.scss";

function UpdateCoupon() {
  // Form state initialization
  const [form, setForm] = useState({
    name: "",
    expire: "",
    discount: 5,
  });

  // Errors state for form validation
  const [errors, setErrors] = useState({
    name: "",
    expire: "",
    discount: "",
    general: "",
  });

  // Fetching coupon ID from URL params
  const { id } = useParams();

  // Loading state for showing progress
  const [loading, setLoading] = useState({
    state: false,
    type: "",
  });

  // To track if the form was submitted
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Language setting from Redux state
  const { lang } = useAppSelector((state) => state.language);

  // Hook for navigation
  const navigate = useNavigate();

  // For translations based on the current language
  const { t, i18n } = useTranslation();

  // Fetch coupon data when the component mounts or the coupon ID changes
  useEffect(() => {
    const fetchCoupon = async () => {
      setLoading({ state: true, type: "get" });
      try {
        const res = await Axios.get(`${COUPONS}/${id}`);
        if (res.status === 200) {
          setLoading({ state: false, type: "" });
          const data = res.data.data;
          const localExpire = toLocalDateTimeString(data.expire);
          setForm({
            name: data.name,
            expire: localExpire,
            discount: data.discount,
          });
        }
      } catch (error) {
        setLoading({ state: false, type: "" });
        console.error("Error fetching coupon:", error);
      }
    };

    fetchCoupon();
  }, [id]);

  // Reset error messages when form fields or language changes
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

  // Handle input field changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Form validation
  const validateForm = () => {
    const newErrors: { msg: string; path?: string }[] = [];

    // Validate coupon name
    if (!form.name.trim()) {
      newErrors.push({
        msg: t("dashboard.updateCoupon.errors.nameRequired"),
        path: "name",
      });
    } else if (form.name.length < 8) {
      newErrors.push({
        msg: t("dashboard.updateCoupon.errors.nameMin"),
        path: "name",
      });
    } else if (form.name.length > 20) {
      newErrors.push({
        msg: t("dashboard.updateCoupon.errors.nameMax"),
        path: "name",
      });
    }

    // Validate expiration date
    if (!form.expire) {
      newErrors.push({
        msg: t("dashboard.updateCoupon.errors.expireRequired"),
        path: "expire",
      });
    } else {
      const selectedDateTime = new Date(form.expire).getTime();
      const currentDateTime = new Date().getTime();

      // Check if expiration date is in the past
      if (selectedDateTime < currentDateTime) {
        newErrors.push({
          msg: t("dashboard.updateCoupon.errors.expirePast"),
          path: "expire",
        });
      }
    }

    // Validate discount value
    const allowedDiscounts = [
      5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
      100,
    ];

    if (!allowedDiscounts.includes(+form.discount)) {
      newErrors.push({
        msg:
          t("dashboard.updateCoupon.errors.discountInvalid") +
          allowedDiscounts.join(", "),
        path: "discount",
      });
    }

    // Map errors to respective fields
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

  // Convert date to local format for input field
  const toLocalDateTimeString = (date: Date) =>
    new Date(date)
      .toLocaleString("sv-SE", {
        hour12: false,
      })
      .replace(" ", "T")
      .slice(0, 16);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading({ state: true, type: "put" });
    setErrors({
      name: "",
      expire: "",
      discount: "",
      general: "",
    });

    setIsSubmitted(true);

    // If form is invalid, stop submission
    if (!validateForm().isValid) {
      setLoading({ state: true, type: "" });
      return;
    }

    // Attempt to update the coupon
    try {
      const res = await Axios.put(`${COUPONS}/${id}`, {
        name: form.name,
        expire: new Date(form.expire).getTime(),
        discount: form.discount,
      });
      if (res.status === 200) {
        setLoading({ state: false, type: "" });
        navigate(`/${lang}/dashboard/coupons`); // Navigate back to coupons page
      }
    } catch (err) {
      setLoading({ state: false, type: "" });
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
    <div className="add-coupon">
      <div className="form-container">
        <h2>
          {t("dashboard.updateCoupon.title")} <RiCoupon3Fill />
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Coupon name input */}
          <div className="form-group">
            <label htmlFor="name">
              {t("dashboard.updateCoupon.nameLabel")}
            </label>
            {loading.state && loading.type === "get" ? (
              <Skeleton height={40} />
            ) : (
              <input
                type="text"
                id="name"
                name="name"
                placeholder={t("dashboard.updateCoupon.namePlaceholder")}
                value={form.name}
                onChange={handleChange}
              />
            )}
            {errors.name && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.name}
              </p>
            )}
          </div>

          {/* Expiration date input */}
          <div className="form-group">
            <label htmlFor="expire">
              {t("dashboard.updateCoupon.expireLabel")}
            </label>
            {loading.state && loading.type === "get" ? (
              <Skeleton height={40} />
            ) : (
              <input
                type="datetime-local"
                id="expire"
                name="expire"
                value={form.expire}
                onChange={handleChange}
              />
            )}
            {errors.expire && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.expire}
              </p>
            )}
          </div>

          {/* Discount input */}
          <div className="form-group">
            <label htmlFor="discount">
              {t("dashboard.updateCoupon.discountLabel")}
            </label>
            {loading.state && loading.type === "get" ? (
              <Skeleton height={40} />
            ) : (
              <select
                name="discount"
                id="discount"
                value={form.discount}
                onChange={handleChange}
              >
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
            )}
            {errors.discount && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.discount}
              </p>
            )}
          </div>

          {/* General error message */}
          {errors.general && (
            <div className="error-box">
              <p className="error-text">
                <span className="error-star">*</span> {errors.general}
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="btn-submit"
            disabled={loading.state && loading.type === "put"}
          >
            {t("dashboard.updateCoupon.submitButton")}
            {loading.state && loading.type === "put" && (
              <LoadingButton width="20px" height="20px" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpdateCoupon;
