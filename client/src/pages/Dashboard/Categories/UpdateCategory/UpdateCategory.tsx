import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { useAppSelector } from "../../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { CATEGORIES } from "../../../../Api/Api";
import { Axios } from "../../../../Api/axios";
import LoadingButton from "../../../../components/LoadingButton/LoadingButton";
import Skeleton from "react-loading-skeleton";
import axios from "axios";
import "./UpdateCategory.scss";

function UpdateCategory() {
  // Form state for English and Arabic category names
  const [form, setForm] = useState({
    nameEn: "",
    nameAr: "",
  });

  // Image state (can be a File or URL string)
  const [image, setImage] = useState<File | string | null>(null);

  // Get category ID from URL params
  const { id } = useParams();

  // Loading state for both get and put operations
  const [loading, setLoading] = useState({
    state: false,
    type: "",
  });

  // Validation error messages for form fields
  const [errors, setErrors] = useState({
    nameEn: "",
    nameAr: "",
    image: "",
    general: "",
  });

  // File input reference to trigger file picker
  const openImage = useRef<HTMLInputElement | null>(null);

  // Track whether the form has been submitted to trigger validation
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Get selected language from Redux store
  const { lang } = useAppSelector((state) => state.language);

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Boolean flags for specific error types (uniqueness)
  const isArabicNameNotUnique =
    errors.general === "The category name in Arabic must be unique";
  const isEnglishNameNotUnique =
    errors.general === "The category name in English must be unique";

  // Fetch existing category data on mount (for editing)
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

  // Re-validate inputs after submission and on change
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
  }, [form, image, i18n.language]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Validate form inputs and return error object
  const validateForm = () => {
    const newErrors: { msg: string; path?: string }[] = [];

    // English name validation
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

    // Arabic name validation
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

    // Image required
    if (!image) {
      newErrors.push({
        msg: t("dashboard.updateCategory.errors.imageRequired"),
        path: "image",
      });
    }

    // Convert array to object keyed by path
    const errorsMap = newErrors.reduce<Record<string, string>>((acc, error) => {
      if (error.path) {
        acc[error.path] = error.msg;
      } else {
        acc.general = error.msg;
      }
      return acc;
    }, {});

    // Update error state
    setErrors((prevErrors) => ({
      ...prevErrors,
      ...errorsMap,
    }));

    return { isValid: newErrors.length === 0, errors: errorsMap };
  };

  // Trigger file input click
  function handleOpenImage() {
    if (openImage.current !== null) {
      openImage.current.click();
    }
  }

  // Form submission handler
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

    // Build form data for API call
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
      }
    } catch (err) {
      setLoading({ state: false, type: "" });

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
        {/* Title */}
        <h2>
          {t("dashboard.updateCategory.title")} <BiSolidCategoryAlt />
        </h2>

        {/* Form start */}
        <form onSubmit={handleSubmit}>
          {/* Arabic name input */}
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

          {/* English name input */}
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

          {/* Hidden file input */}
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

          {/* Image preview */}
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
                          <strong>{t("dashboard.updateCategory.size")}:</strong>{" "}
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
                </div>
              )}
            </>
          )}

          {/* Upload image button if image is not present */}
          {!image && !loading.state && loading.type !== "get" && (
            <div className="upload-image-btn" onClick={handleOpenImage}>
              <img src="/images/upload.png" alt="" />
              <p>{t("dashboard.updateCategory.uploadImage")}</p>
            </div>
          )}

          {/* Error messages */}
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

          {/* Submit button */}
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
