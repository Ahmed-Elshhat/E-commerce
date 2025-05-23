import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { BRANDS } from "../../../../Api/Api";
import { Axios } from "../../../../Api/axios";
import { BsShop } from "react-icons/bs";
import LoadingButton from "../../../../components/LoadingButton/LoadingButton";
import axios from "axios";
import "./AddBrand.scss";

function AddBrand() {
  // Initialize form state to hold brand names in both languages
  const [form, setForm] = useState({
    nameEn: "",
    nameAr: "",
  });

  // Initialize state for image, loading state, and form errors
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState({
    nameEn: "",
    nameAr: "",
    image: "",
    general: "",
  });

  // Reference to open the file input when the user wants to upload an image
  const openImage = useRef<HTMLInputElement | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const { lang } = useAppSelector((state) => state.language);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Check if errors are related to unique name in Arabic or English
  const isArabicNameNotUnique =
    errors.general === "The brand name in Arabic must be unique";
  const isEnglishNameNotUnique =
    errors.general === "The brand name in English must be unique";

  // Effect hook to clear errors once user starts typing or language changes
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

  // Handle input changes for both brand names
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Form validation function
  const validateForm = () => {
    const newErrors: { msg: string; path?: string }[] = [];

    // Validation for nameEn (English name)
    if (!form.nameEn.trim()) {
      newErrors.push({
        msg: t("dashboard.addBrand.errors.nameEnRequired"),
        path: "nameEn",
      });
    } else if (form.nameEn.length < 2) {
      newErrors.push({
        msg: t("dashboard.addBrand.errors.nameEnMin"),
        path: "nameEn",
      });
    } else if (form.nameEn.length > 32) {
      newErrors.push({
        msg: t("dashboard.addBrand.errors.nameEnMax"),
        path: "nameEn",
      });
    }

    // Validation for nameAr (Arabic name)
    if (!form.nameAr.trim()) {
      newErrors.push({
        msg: t("dashboard.addBrand.errors.nameArRequired"),
        path: "nameAr",
      });
    } else if (form.nameAr.length < 2) {
      newErrors.push({
        msg: t("dashboard.addBrand.errors.nameArMin"),
        path: "nameAr",
      });
    } else if (form.nameAr.length > 32) {
      newErrors.push({
        msg: t("dashboard.addBrand.errors.nameArMax"),
        path: "nameAr",
      });
    }

    // Image validation (make sure an image is uploaded)
    if (!image) {
      newErrors.push({
        msg: t("dashboard.addBrand.errors.imageRequired"),
        path: "image",
      });
    }

    // Create errors map to update errors state
    const errorsMap = newErrors.reduce<Record<string, string>>((acc, error) => {
      if (error.path) {
        acc[error.path] = error.msg;
      } else {
        acc.general = error.msg;
      }
      return acc;
    }, {});

    // Set errors to be displayed
    setErrors((prevErrors) => ({
      ...prevErrors,
      ...errorsMap,
    }));

    // Return validation status and errors
    return { isValid: newErrors.length === 0, errors: errorsMap };
  };

  // Open file input dialog when user clicks the button to upload image
  function handleOpenImage() {
    if (openImage.current !== null) {
      openImage.current.click();
    }
  }

  // Handle form submission (send the data to API)
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

    // Check if the form is valid before submitting
    if (!validateForm().isValid) {
      setLoading(false);
      return;
    }

    // Prepare form data to be sent in the request
    const formData = new FormData();
    formData.append("nameEn", form.nameEn);
    formData.append("nameAr", form.nameAr);
    if (image) {
      formData.append("image", image);
    }

    try {
      // Make API request to add the brand
      const res = await Axios.post(`${BRANDS}`, formData);
      if (res.status === 201) {
        setLoading(false);
        navigate(`/${lang}/dashboard/brands`); // Redirect to brands list after successful submission
      }
    } catch (err) {
      setLoading(false);
      console.log(err);
      if (axios.isAxiosError(err) && err.response) {
        // Handle API errors and set appropriate error messages
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
        // Display generic error message for unexpected errors
        setErrors((prevErrors) => ({
          ...prevErrors,
          general: "An unexpected error occurred. Please try again later.",
        }));
      }
    }
  };

  return (
    <div className="add-brand">
      <div className="form-container">
        <h2>
          {t("dashboard.addBrand.title")} <BsShop />
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Arabic name input */}
          <div className="form-group">
            <label htmlFor="nameAr">
              {t("dashboard.addBrand.brandNameLabelAr")}
            </label>
            <input
              type="text"
              id="nameAr"
              name="nameAr"
              placeholder={t("dashboard.addBrand.brandNamePlaceholderAr")}
              value={form.nameAr}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(e); // Submit the form if Enter is pressed
                }
              }}
            />

            {/* Show error for Arabic name */}
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
              {t("dashboard.addBrand.brandNameLabelEn")}
            </label>
            <input
              type="text"
              id="nameEn"
              name="nameEn"
              placeholder={t("dashboard.addBrand.brandNamePlaceholderEn")}
              value={form.nameEn}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(e); // Submit the form if Enter is pressed
                }
              }}
            />

            {/* Show error for English name */}
            {(errors.nameEn || isEnglishNameNotUnique) && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {isEnglishNameNotUnique ? errors.general : errors.nameEn}
              </p>
            )}
          </div>

          {/* File input for image upload */}
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

          {/* Show image preview after uploading */}
          {image && (
            <div className="image-preview">
              <img
                src={URL.createObjectURL(image)}
                alt={image.name}
                className="preview-img"
              />
              <div className="image-details">
                <p>
                  <strong>{t("dashboard.addBrand.fileName")} : </strong>{" "}
                  {image.name}
                </p>
                <p>
                  <strong>{t("dashboard.addBrand.size")} :</strong>{" "}
                  {(image.size / 1024).toFixed(2)} KB
                </p>
                <button className="remove-btn" onClick={() => setImage(null)}>
                  ❌ {t("dashboard.addBrand.deleteImageButton")}
                </button>
              </div>
            </div>
          )}

          {/* Upload button when no image is uploaded */}
          <div
            className="upload-image-btn"
            onClick={handleOpenImage}
            style={{ display: image ? "none" : "block" }}
          >
            <img src="/images/upload.png" alt="" />
            <p>{t("dashboard.addBrand.uploadImage")}</p>
          </div>

          {/* Show error for image validation */}
          {errors.image && (
            <p className="error-text image-err">
              <span className="error-star">*</span> {errors.image}
            </p>
          )}

          {/* Show general error message */}
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
          <button type="submit" className="btn-submit" disabled={loading}>
            {t("dashboard.addBrand.submitButton")}{" "}
            {loading && <LoadingButton width="20px" height="20px" />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddBrand;
