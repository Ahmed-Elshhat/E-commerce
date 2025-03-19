import { useEffect, useRef, useState } from "react";
import "./AddBrand.scss";
import { useAppSelector } from "../../../../Redux/app/hooks";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BRANDS } from "../../../../Api/Api";
import { Axios } from "../../../../Api/axios";
import axios from "axios";

function AddBrand() {
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [errors, setErrors] = useState({
    name: "",
    image: "",
    general: "",
  });
  const openImage = useRef<HTMLInputElement | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const { lang } = useAppSelector((state) => state.language);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (isSubmitted) {
      const fields = ["name", "image", "general"];

      const newErrors = validateForm().errors;

      fields.forEach((field) => {
        if (!newErrors[field]) {
          setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
        }
      });
    }
  }, [name, image]);

  const validateForm = () => {
    const newErrors: { msg: string; path?: string }[] = [];

    if (!name.trim()) {
      newErrors.push({ msg: "Name is required", path: "name" });
    } else if (name.length < 2) {
      newErrors.push({
        msg: "Name must be at least 2 characters",
        path: "name",
      });
    }

    if (!image) {
      newErrors.push({ msg: "Image is required", path: "image" });
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

  function handleOpenImage() {
    if (openImage.current !== null) {
      openImage.current.click();
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({
      name: "",
      image: "",
      general: "",
    });

    setIsSubmitted(true);

    if (!validateForm().isValid) return;

    const form = new FormData();
    form.append("name", name);
    if (image) {
      form.append("image", image);
    }

    try {
      const res = await Axios.post(`${BRANDS}`, form);
      if (res.status === 201) {
        navigate(`/${lang}/dashboard/brands`);
        console.log(res.data);
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
    <div className="add-brand">
      <div className="form-container">
        <h2>{t("dashboard.addBrand.title")}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t("dashboard.addBrand.nameLabel")}</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder={t("dashboard.addBrand.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); 
                  handleSubmit(e);
                }
              }}
            />

            {errors.name && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.name}
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

          <div
            className="upload-image-btn"
            onClick={handleOpenImage}
            style={{ display: image ? "none" : "block" }}
          >
            <img src="/images/upload.png" alt="" />
            <p>{t("dashboard.addBrand.uploadImage")}</p>
          </div>

          {errors.image && (
            <p className="error-text image-err">
              <span className="error-star">*</span> {errors.image}
            </p>
          )}

          {errors.general && (
            <div className="error-box">
              <p className="error-text">
                <span className="error-star">*</span> {errors.general}
              </p>
            </div>
          )}

          <button type="submit" className="btn-submit">
            {t("dashboard.addBrand.submitButton")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddBrand;
