import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../../Redux/app/hooks";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CATEGORIES } from "../../../../Api/Api";
import { Axios } from "../../../../Api/axios";
import axios from "axios";
import LoadingButton from "../../../../components/LoadingButton/LoadingButton";
import "./UpdateCategory.scss";
import Skeleton from "react-loading-skeleton";
import { BiSolidCategoryAlt } from "react-icons/bi";

function UpdateCategory() {
  const [form, setForm] = useState({
    nameEn: "",
    nameAr: "",
  });
  const [image, setImage] = useState<File | string | null>(null);
  const { id } = useParams();
  const [loading, setLoading] = useState({
    state: false,
    type: "",
  });

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
    const fetchCategory = async () => {
      setLoading({ state: true, type: "get" });
      try {
        const res = await Axios.get(`${CATEGORIES}/${id}`);
        if (res.status === 200) {
          setLoading({ state: false, type: "" });
          const data = res.data.data;
          setForm({ nameAr: data.nameAr, nameEn: data.nameEn });
          setImage(data.image);
        }
      } catch (error) {
        setLoading({ state: false, type: "" });
        console.error("Error fetching category:", error);
      }
    };

    fetchCategory();
  }, [id]);

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
        msg: t("dashboard.updateCategory.errors.nameEnRequired"),
        path: "nameEn",
      });
    } else if (form.nameEn.length < 3) {
      newErrors.push({
        msg: t("dashboard.updateCategory.errors.nameEnMin"),
        path: "nameEn",
      });
    } else if (form.nameEn.length > 32) {
      newErrors.push({
        msg: t("dashboard.updateCategory.errors.nameEnMax"),
        path: "nameEn",
      });
    }

    // Validation for nameAr
    if (!form.nameAr.trim()) {
      newErrors.push({
        msg: t("dashboard.updateCategory.errors.nameArRequired"),
        path: "nameAr",
      });
    } else if (form.nameAr.length < 3) {
      newErrors.push({
        msg: t("dashboard.updateCategory.errors.nameArMin"),
        path: "nameAr",
      });
    } else if (form.nameAr.length > 32) {
      newErrors.push({
        msg: t("dashboard.updateCategory.errors.nameArMax"),
        path: "nameAr",
      });
    }

    // Image validation
    if (!image) {
      newErrors.push({
        msg: t("dashboard.updateCategory.errors.imageRequired"),
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
    setLoading({ state: true, type: "put" });
    setErrors({
      nameEn: "",
      nameAr: "",
      image: "",
      general: "",
    });

    setIsSubmitted(true);

    if (!validateForm().isValid) {
      setLoading({ state: false, type: "" });
      return;
    }

    const formData = new FormData();
    formData.append("nameEn", form.nameEn);
    formData.append("nameAr", form.nameAr);
    if (image instanceof File) {
      formData.append("image", image);
    }

    try {
      const res = await Axios.put(`${CATEGORIES}/${id}`, formData);
      if (res.status === 200) {
        setLoading({ state: false, type: "" });
        navigate(`/${lang}/dashboard/categories`);
        console.log(res.data);
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
    <div className="update-category">
      <div className="form-container">
        <h2>{t("dashboard.updateCategory.title")} <BiSolidCategoryAlt /></h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nameAr">
              {t("dashboard.updateCategory.categoryNameLabelAr")}
            </label>
            {loading.state && loading.type === "get" ? (
              <Skeleton height={40} />
            ) : (
              <input
                type="text"
                id="nameAr"
                name="nameAr"
                placeholder={t(
                  "dashboard.updateCategory.categoryNamePlaceholderAr"
                )}
                value={form.nameAr}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            )}

            {(errors.nameAr || isArabicNameNotUnique) && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {isArabicNameNotUnique ? errors.general : errors.nameAr}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="nameEn">
              {t("dashboard.updateCategory.categoryNameLabelEn")}
            </label>
            {loading.state && loading.type === "get" ? (
              <Skeleton height={40} />
            ) : (
              <input
                type="text"
                id="nameEn"
                name="nameEn"
                placeholder={t(
                  "dashboard.updateCategory.categoryNamePlaceholderEn"
                )}
                value={form.nameEn}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            )}

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
          {loading.state && loading.type === "get" ? (
            <div style={{ marginBottom: "20px" }}>
              <Skeleton height={200} />
            </div>
          ) : (
            <>
              {image && (
                <div className="image-preview">
                  <img
                    src={
                      image instanceof File ? URL.createObjectURL(image) : image
                    }
                    alt={image instanceof File ? image.name : "Category Image"}
                    className="preview-img"
                  />
                  {image && (
                    <div className="image-details">
                      {image instanceof File ? (
                        <>
                          <p>
                            <strong>
                              {t("dashboard.updateCategory.fileName")}:
                            </strong>{" "}
                            {image.name}
                          </p>
                          <p>
                            <strong>
                              {t("dashboard.updateCategory.size")}:
                            </strong>{" "}
                            {(image.size / 1024).toFixed(2)} KB
                          </p>
                        </>
                      ) : (
                        <p>
                          <strong className="image-label">
                            {t("dashboard.updateCategory.image")}:
                          </strong>{" "}
                          <a
                            href={image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="image-link"
                          >
                            {t("dashboard.updateCategory.viewImage")}
                          </a>
                        </p>
                      )}
                      <button
                        className="remove-btn"
                        onClick={() => setImage(null)}
                      >
                        ❌ {t("dashboard.updateCategory.deleteImageButton")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {!image && !loading.state && loading.type !== "get" && (
            <div className="upload-image-btn" onClick={handleOpenImage}>
              <img src="/images/upload.png" alt="" />
              <p>{t("dashboard.updateCategory.uploadImage")}</p>
            </div>
          )}
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
          <button
            type="submit"
            className="btn-submit"
            disabled={loading.state && loading.type === "put"}
          >
            {t("dashboard.updateCategory.submitButton")}{" "}
            {loading.state && loading.type === "put" && (
              <LoadingButton width="20px" height="20px" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpdateCategory;
