import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { BRANDS } from "../../../../Api/Api";
import { BsShop } from "react-icons/bs";
import { Axios } from "../../../../Api/axios";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import LoadingButton from "../../../../components/LoadingButton/LoadingButton";
import "./UpdateBrand.scss";

function UpdateBrand() {
  // State to manage the form inputs (brand names in English and Arabic)
  const [form, setForm] = useState({
    nameEn: "",
    nameAr: "",
  });

  // State to manage the selected image for the brand
  const [image, setImage] = useState<File | string | null>(null);

  // Extracts the brand ID from the URL parameters
  const { id } = useParams();

  // Loading state to handle form submission and data fetching
  const [loading, setLoading] = useState({
    state: false,
    type: "",
  });

  // Errors state for form validation messages
  const [errors, setErrors] = useState({
    nameEn: "",
    nameAr: "",
    image: "",
    general: "",
  });

  // Ref to open the image input when needed
  const openImage = useRef<HTMLInputElement | null>(null);

  // Track whether the form has been submitted to handle validation
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Access the current language setting from Redux store
  const { lang } = useAppSelector((state) => state.language);

  // Navigation function to redirect after form submission
  const navigate = useNavigate();

  // Translation hook for handling multi-language support
  const { t, i18n } = useTranslation();

  // Flags to check for unique name validation errors for Arabic and English names
  const isArabicNameNotUnique =
    errors.general === "The brand name in Arabic must be unique";
  const isEnglishNameNotUnique =
    errors.general === "The brand name in English must be unique";

  // Fetch brand data on initial render or when `id` changes
  useEffect(() => {
    const fetchBrand = async () => {
      setLoading({ state: true, type: "get" });

      try {
        const res = await Axios.get(`${BRANDS}/${id}`);
        if (res.status === 200) {
          setLoading({ state: false, type: "" });
          const data = res.data.data;
          setForm({ nameAr: data.nameAr, nameEn: data.nameEn });
          setImage(data.image); // Set the fetched image URL
        }
      } catch (error) {
        setLoading({ state: false, type: "" });
        console.error("Error fetching brand:", error);
      }
    };

    fetchBrand();
  }, [id]);

  // Revalidate the form when form data or language changes after submission
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

  // Handle changes to form input fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Validate the form fields and return validation status with errors
  const validateForm = () => {
    const newErrors: { msg: string; path?: string }[] = [];

    // Validate English brand name
    if (!form.nameEn.trim()) {
      newErrors.push({
        msg: t("dashboard.updateBrand.errors.nameEnRequired"),
        path: "nameEn",
      });
    } else if (form.nameEn.length < 3) {
      newErrors.push({
        msg: t("dashboard.updateBrand.errors.nameEnMin"),
        path: "nameEn",
      });
    } else if (form.nameEn.length > 32) {
      newErrors.push({
        msg: t("dashboard.updateBrand.errors.nameEnMax"),
        path: "nameEn",
      });
    }

    // Validate Arabic brand name
    if (!form.nameAr.trim()) {
      newErrors.push({
        msg: t("dashboard.updateBrand.errors.nameArRequired"),
        path: "nameAr",
      });
    } else if (form.nameAr.length < 3) {
      newErrors.push({
        msg: t("dashboard.updateBrand.errors.nameArMin"),
        path: "nameAr",
      });
    } else if (form.nameAr.length > 32) {
      newErrors.push({
        msg: t("dashboard.updateBrand.errors.nameArMax"),
        path: "nameAr",
      });
    }

    // Validate image selection
    if (!image) {
      newErrors.push({
        msg: t("dashboard.updateBrand.errors.imageRequired"),
        path: "image",
      });
    }

    // Map errors to field names
    const errorsMap = newErrors.reduce<Record<string, string>>((acc, error) => {
      if (error.path) {
        acc[error.path] = error.msg;
      } else {
        acc.general = error.msg;
      }
      return acc;
    }, {});

    // Update the error state with the new errors
    setErrors((prevErrors) => ({
      ...prevErrors,
      ...errorsMap,
    }));

    return { isValid: newErrors.length === 0, errors: errorsMap };
  };

  // Open the file input for image selection
  function handleOpenImage() {
    if (openImage.current !== null) {
      openImage.current.click();
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading({ state: true, type: "put" });

    // Reset the error state before revalidating
    setErrors({
      nameEn: "",
      nameAr: "",
      image: "",
      general: "",
    });

    setIsSubmitted(true);

    // If validation fails, stop the form submission
    if (!validateForm().isValid) {
      setLoading({ state: false, type: "" });
      return;
    }

    // Prepare form data to be submitted (including the image)
    const formData = new FormData();
    formData.append("nameEn", form.nameEn);
    formData.append("nameAr", form.nameAr);
    if (image instanceof File) {
      formData.append("image", image);
    }

    try {
      // Send PUT request to update the brand
      const res = await Axios.put(`${BRANDS}/${id}`, formData);
      if (res.status === 200) {
        setLoading({ state: false, type: "" });
        navigate(`/${lang}/dashboard/brands`); // Redirect after success
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
    <div className="update-brand">
      <div className="form-container">
        <h2>
          {t("dashboard.updateBrand.title")} <BsShop />
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Input for Arabic brand name */}
          <div className="form-group">
            <label htmlFor="nameAr">
              {t("dashboard.updateBrand.brandNameLabelAr")}
            </label>
            {loading.state && loading.type === "get" ? (
              <Skeleton height={40} />
            ) : (
              <input
                type="text"
                id="nameAr"
                name="nameAr"
                placeholder={t(
                  "dashboard.updateBrand.brandNamePlaceholderAr"
                )}
                value={form.nameAr}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e); // Submit form on Enter key
                  }
                }}
              />
            )}

            {/* Display error for Arabic brand name */}
            {(errors.nameAr || isArabicNameNotUnique) && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {isArabicNameNotUnique ? errors.general : errors.nameAr}
              </p>
            )}
          </div>

          {/* Input for English brand name */}
          <div className="form-group">
            <label htmlFor="nameEn">
              {t("dashboard.updateBrand.brandNameLabelEn")}
            </label>
            {loading.state && loading.type === "get" ? (
              <Skeleton height={40} />
            ) : (
              <input
                type="text"
                id="nameEn"
                name="nameEn"
                placeholder={t(
                  "dashboard.updateBrand.brandNamePlaceholderEn"
                )}
                value={form.nameEn}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e); // Submit form on Enter key
                  }
                }}
              />
            )}

            {/* Display error for English brand name */}
            {(errors.nameEn || isEnglishNameNotUnique) && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {isEnglishNameNotUnique ? errors.general : errors.nameEn}
              </p>
            )}
          </div>

          {/* Image upload */}
          <div className="file-wrapper">
            <input
              type="file"
              accept="image/*"
              ref={openImage}
              onChange={(e) => {
                const file = e.target.files?.item(0);
                if (file) setImage(file); // Set the selected image file
              }}
            />
          </div>

          {/* Image preview and delete */}
          {loading.state && loading.type === "get" ? (
            <div style={{ marginBottom: "20px" }}>
              <Skeleton height={200} />
            </div>
          ) : (
            <>
              {image && (
                <div className="image-preview">
                  <img
                    src={image instanceof File ? URL.createObjectURL(image) : image}
                    alt={image instanceof File ? image.name : "Brand Image"}
                    className="preview-img"
                  />
                  {image && (
                    <div className="image-details">
                      {image instanceof File ? (
                        <>
                          <p>
                            <strong>
                              {t("dashboard.updateBrand.fileName")}:
                            </strong>{" "}
                            {image.name}
                          </p>
                          <p>
                            <strong>
                              {t("dashboard.updateBrand.size")}:
                            </strong>{" "}
                            {(image.size / 1024).toFixed(2)} KB
                          </p>
                        </>
                      ) : (
                        <p>
                          <strong className="image-label">
                            {t("dashboard.updateBrand.image")}:
                          </strong>{" "}
                          <a
                            href={image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="image-link"
                          >
                            {t("dashboard.updateBrand.viewImage")}
                          </a>
                        </p>
                      )}
                      <button
                        className="remove-btn"
                        onClick={() => setImage(null)}
                      >
                        ❌ {t("dashboard.updateBrand.deleteImageButton")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Image upload prompt */}
          {!image && !loading.state && loading.type !== "get" && (
            <div className="upload-image-btn" onClick={handleOpenImage}>
              <img src="/images/upload.png" alt="" />
              <p>{t("dashboard.updateBrand.uploadImage")}</p>
            </div>
          )}

          {/* Display error if no image is selected */}
          {errors.image && (
            <p className="error-text image-err">
              <span className="error-star">*</span> {errors.image}
            </p>
          )}

          {/* General error message */}
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
            {t("dashboard.updateBrand.submitButton")}{" "}
            {loading.state && loading.type === "put" && (
              <LoadingButton width="20px" height="20px" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpdateBrand;
