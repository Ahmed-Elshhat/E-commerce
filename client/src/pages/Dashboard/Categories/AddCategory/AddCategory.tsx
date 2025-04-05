import { useEffect, useRef, useState } from "react";
import "./AddCategory.scss";
import { useAppSelector } from "../../../../Redux/app/hooks";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CATEGORIES } from "../../../../Api/Api";
import { Axios } from "../../../../Api/axios";
import axios from "axios";
import LoadingButton from "../../../../components/LoadingButton/LoadingButton";

function AddCategory() {
  const [form, setForm] = useState({
    nameEn: "",
    nameAr: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [errors, setErrors] = useState({
    nameEn: "",
    nameAr: "",
    image: "",
    general: "",
  });
  const openImage = useRef<HTMLInputElement | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const { lang } = useAppSelector((state) => state.language);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isArabicNameNotUnique =
    errors.general === "The category name in Arabic must be unique";
  const isEnglishNameNotUnique =
    errors.general === "The category name in English must be unique";

  useEffect(() => {
    if (isSubmitted) {
      const fields = ["nameEn", "nameAr", "image", "general"];

      const newErrors = validateForm().errors;

      fields.forEach((field) => {
        if (!newErrors[field]) {
          setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
        }
      });
    }
  }, [form, image]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors: { msg: string; path?: string }[] = [];

    // Validation for nameEn
    if (!form.nameEn.trim()) {
      newErrors.push({
        msg: t("dashboard.addCategory.errors.nameEnRequired"),
        path: "nameEn",
      });
    } else if (form.nameEn.length < 3) {
      newErrors.push({
        msg: t("dashboard.addCategory.errors.nameEnMin"),
        path: "nameEn",
      });
    } else if (form.nameEn.length > 32) {
      newErrors.push({
        msg: t("dashboard.addCategory.errors.nameEnMax"),
        path: "nameEn",
      });
    }

    // Validation for nameAr
    if (!form.nameAr.trim()) {
      newErrors.push({
        msg: t("dashboard.addCategory.errors.nameArRequired"),
        path: "nameAr",
      });
    } else if (form.nameAr.length < 3) {
      newErrors.push({
        msg: t("dashboard.addCategory.errors.nameArMin"),
        path: "nameAr",
      });
    } else if (form.nameAr.length > 32) {
      newErrors.push({
        msg: t("dashboard.addCategory.errors.nameArMax"),
        path: "nameAr",
      });
    }

    // Image validation
    if (!image) {
      newErrors.push({
        msg: t("dashboard.addCategory.errors.imageRequired"),
        path: "image",
      });
    }

    // Create errors map
    const errorsMap = newErrors.reduce<Record<string, string>>((acc, error) => {
      if (error.path) {
        acc[error.path] = error.msg;
      } else {
        acc.general = error.msg;
      }
      return acc;
    }, {});

    // Set errors
    setErrors((prevErrors) => ({
      ...prevErrors,
      ...errorsMap,
    }));

    // Return validation status and errors
    return { isValid: newErrors.length === 0, errors: errorsMap };
  };

  function handleOpenImage() {
    if (openImage.current !== null) {
      openImage.current.click();
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({
      nameEn: "",
      nameAr: "",
      image: "",
      general: "",
    });

    setIsSubmitted(true);

    if (!validateForm().isValid) {
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("nameEn", form.nameEn);
    formData.append("nameAr", form.nameAr);
    if (image) {
      formData.append("image", image);
    }

    try {
      const res = await Axios.post(`${CATEGORIES}`, formData);
      if (res.status === 201) {
        setLoading(false);
        navigate(`/${lang}/dashboard/categories`);
        console.log(res.data);
      }
    } catch (err) {
      setLoading(false);
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
    <div className="add-category">
      <div className="form-container">
        <h2>{t("dashboard.addCategory.title")}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nameAr">
              {t("dashboard.addCategory.categoryNameLabelAr")}
            </label>
            <input
              type="text"
              id="nameAr"
              name="nameAr"
              placeholder={t("dashboard.addCategory.categoryNamePlaceholderAr")}
              value={form.nameAr}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            {(errors.nameAr || isArabicNameNotUnique) && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {isArabicNameNotUnique ? errors.general : errors.nameAr}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="nameEn">
              {t("dashboard.addCategory.categoryNameLabelEn")}
            </label>
            <input
              type="text"
              id="nameEn"
              name="nameEn"
              placeholder={t("dashboard.addCategory.categoryNamePlaceholderEn")}
              value={form.nameEn}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            {(errors.nameEn || isEnglishNameNotUnique) && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {isEnglishNameNotUnique ? errors.general : errors.nameEn}
              </p>
            )}
          </div>
          <div className="file-wrapper">
            <input
              type="file"
              accept="image/*"
              ref={openImage}
              onChange={(e) => {
                const file = e.target.files?.item(0);
                if (file) setImage(file);
              }}
            />
          </div>
          {image && (
            <div className="image-preview">
              <img
                src={URL.createObjectURL(image)}
                alt={image.name}
                className="preview-img"
              />
              <div className="image-details">
                <p>
                  <strong>{t("dashboard.addCategory.fileName")} : </strong>{" "}
                  {image.name}
                </p>
                <p>
                  <strong>{t("dashboard.addCategory.size")} :</strong>{" "}
                  {(image.size / 1024).toFixed(2)} KB
                </p>
                <button className="remove-btn" onClick={() => setImage(null)}>
                  ❌ {t("dashboard.addCategory.deleteImageButton")}
                </button>
              </div>
            </div>
          )}
          <div
            className="upload-image-btn"
            onClick={handleOpenImage}
            style={{ display: image ? "none" : "block" }}
          >
            <img src="/images/upload.png" alt="" />
            <p>{t("dashboard.addCategory.uploadImage")}</p>
          </div>
          {errors.image && (
            <p className="error-text image-err">
              <span className="error-star">*</span> {errors.image}
            </p>
          )}
          {errors.general &&
            !isArabicNameNotUnique &&
            !isEnglishNameNotUnique && (
              <div className="error-box">
                <p className="error-text">
                  <span className="error-star">*</span> {errors.general}
                </p>
              </div>
            )}
          <button type="submit" className="btn-submit" disabled={loading}>
            {t("dashboard.addCategory.submitButton")}{" "}
            {loading && <LoadingButton width="20px" height="20px" />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddCategory;
