import { useEffect, useState } from "react";
import { useAppSelector } from "../../../../Redux/app/hooks";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Axios } from "../../../../Api/axios";
import { BRANDS, CATEGORIES, PRODUCTS } from "../../../../Api/Api";
import axios from "axios";
import { BrandSchema, CategorySchema } from "../../../../Types/app";
import { IoClose } from "react-icons/io5";
import { FaImage, FaImages, FaProductHunt } from "react-icons/fa";
import "./UpdateProduct.scss";

type Size = {
  size: string;
  quantity: number;
  price: number;
};

interface Image {
  url: string;
}


function UpdateProduct() {
  const [form, setForm] = useState({
    titleEn: "",
    titleAr: "",
    descriptionEn: "",
    descriptionAr: "",
    quantity: 1,
    price: 10,
    priceAfterDiscount: 0,
    sizes: [] as Size[],
    colors: [] as string[],
    coverImage: null as File | null,
    images: [] as File[],
    category: "",
    brand: "",
  });

  const { id } = useParams();
  const [categories, setCategories] = useState<CategorySchema[]>([]);
  const [brands, setBrands] = useState<BrandSchema[]>([]);
  const [previewCover, setPreviewCover] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("#0000ff");
  const [sizeInputs, setSizeInputs] = useState({
    size: "",
    quantity: "",
    price: "",
  });

  const [errors, setErrors] = useState({
    titleEn: "",
    titleAr: "",
    descriptionEn: "",
    descriptionAr: "",
    quantity: "",
    price: "",
    priceAfterDiscount: "",
    coverImage: "",
    sizes: "",
    sizeName: "",
    sizePrice: "",
    sizeQuantity: "",
    images: "",
    category: "",
    brand: "",
    general: "",
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [sizeSubmitted, setSizeSubmitted] = useState<boolean>(false);
  const { lang } = useAppSelector((state) => state.language);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isDisabled = !form.category;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await Axios.get(`${PRODUCTS}/${id}`);
        if (res.status === 200) {
          const data = res.data.data;
          setForm({
            ...form,
            titleEn: data.titleEn,
            titleAr: data.titleAr,
            descriptionEn: data.descriptionEn,
            descriptionAr: data.descriptionAr,
            quantity: data.quantity,
            price: data.price,
            priceAfterDiscount: data.priceAfterDiscount,
            sizes: data.sizes,
            colors: data.colors,
            category: data.category._id,
            brand: data.brand._id,
          })
          setPreviewCover(data.coverImage)
          setPreviewImages(data.images.map((img: Image) => img.url));
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          Axios.get(`${CATEGORIES}?page=1&limit=1000000`),
          Axios.get(`${BRANDS}?page=1&limit=1000000`),
        ]);

        setCategories(categoriesRes.data.data);
        setBrands(brandsRes.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      const fields = [
        "titleEn",
        "titleAr",
        "descriptionEn",
        "descriptionAr",
        "quantity",
        "price",
        "priceAfterDiscount",
        "sizes",
        "coverImage",
        "images",
        "category",
        "brand",
      ];

      const newErrors = validateForm().errors;

      fields.forEach((field) => {
        if (!newErrors[field]) {
          setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
        }
      });
    } else if (errors.category !== "" && form.category !== "") {
      setErrors({
        titleEn: "",
        titleAr: "",
        descriptionEn: "",
        descriptionAr: "",
        quantity: "",
        price: "",
        priceAfterDiscount: "",
        coverImage: "",
        sizes: "",
        sizeName: "",
        sizePrice: "",
        sizeQuantity: "",
        images: "",
        category: "",
        brand: "",
        general: "",
      });
    }
  }, [form, i18n.language, sizeInputs]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "quantity") {
      if (!isNaN(Number(value)) && Number(value) % 1 === 0) {
        setForm((prevForm) => ({
          ...prevForm,
          [name]: Number(value),
        }));
      }
      return;
    }

    if (["price", "priceAfterDiscount"].includes(name)) {
      console.log(value);
      if (isNaN(Number(value))) return;
    }

    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const validateForm = () => {
    let newErrors: { msg: string; path?: string }[] = [];
    const zeroPaddingRegex = /^0\d/;

    if (!form.titleEn.trim()) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.titleEnRequired"),
        path: "titleEn",
      });
    } else if (form.titleEn.length < 4) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.titleEnMin"),
        path: "titleEn",
      });
    } else if (form.titleEn.length > 100) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.titleEnMax"),
        path: "titleEn",
      });
    }

    if (!form.titleAr.trim()) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.titleArRequired"),
        path: "titleAr",
      });
    } else if (form.titleAr.length < 4) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.titleArMin"),
        path: "titleAr",
      });
    } else if (form.titleAr.length > 100) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.titleArMax"),
        path: "titleAr",
      });
    }

    if (!form.descriptionEn.trim()) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.descriptionEnRequired"),
        path: "descriptionEn",
      });
    } else if (form.descriptionEn.length < 20) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.descriptionEnMin"),
        path: "descriptionEn",
      });
    } else if (form.descriptionEn.length > 2000) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.descriptionEnMax"),
        path: "descriptionEn",
      });
    }

    if (!form.descriptionAr.trim()) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.descriptionArRequired"),
        path: "descriptionAr",
      });
    } else if (form.descriptionAr.length < 20) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.descriptionArMin"),
        path: "descriptionAr",
      });
    } else if (form.descriptionAr.length > 2000) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.descriptionArMax"),
        path: "descriptionAr",
      });
    }

    if (form.quantity < 1) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.quantityMin"),
        path: "quantity",
      });
    }

    if (form.price <= 0) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.priceMin"),
        path: "price",
      });
    }

    if (zeroPaddingRegex.test(form.price.toString())) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.priceZeroPadding"),
        path: "price",
      });
    }

    if (+form.priceAfterDiscount >= +form.price) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.discountPriceTooHigh"),
        path: "priceAfterDiscount",
      });
    }

    if (zeroPaddingRegex.test(form.priceAfterDiscount.toString())) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.priceAfterDiscountZeroPadding"),
        path: "priceAfterDiscount",
      });
    }

    if (form.images.length > 10) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.imagesMax"),
        path: "images",
      });
    }

    if (form.coverImage === null) {
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.coverImageRequired"),
        path: "coverImage",
      });
    }

    if (!form.category.trim()) {
      newErrors = [];
      setIsSubmitted(false);
      newErrors.push({
        msg: t("dashboard.updateProduct.errors.categoryRequired"),
        path: "category",
      });
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

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, coverImage: file });
      setPreviewCover(URL.createObjectURL(file));
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && !(files.length + form.images.length > 11)) {
      const newImages = Array.from(files);
      setForm({ ...form, images: [...form.images, ...newImages] });

      const newPreviews = newImages.map((file) => URL.createObjectURL(file));
      setPreviewImages([...previewImages, ...newPreviews]);
    }
  };

  const handleRemoveCoverImage = () => {
    setForm({ ...form, coverImage: null });
    setPreviewCover(null);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...form.images];
    newImages.splice(index, 1);

    const newPreviews = [...previewImages];
    newPreviews.splice(index, 1);

    setForm({ ...form, images: newImages });
    setPreviewImages(newPreviews);
  };

  const handleAddColor = () => {
    if (!colorInput.trim()) return;

    // التأكد من عدم تكرار اللون
    if (form.colors.includes(colorInput)) {
      // استخدام includes بدلاً من التحقق من كود الكائن
      setColorInput("#0000ff"); // تصفير الإدخال
      return;
    }

    setForm((prevForm) => ({
      ...prevForm,
      colors: [...prevForm.colors, colorInput], // إضافة النص فقط
    }));

    setColorInput("#0000ff"); // تصفير الإدخال
  };

  const handleRemoveColor = (index: number) => {
    setForm((prevForm) => ({
      ...prevForm,
      colors: prevForm.colors.filter((_, i) => i !== index),
    }));
  };

  const handleSizeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "size") {
      setSizeInputs((prevForm) => ({
        ...prevForm,
        [name]: value,
      }));
      return;
    }

    if (name === "quantity") {
      if (value === "" || (!isNaN(Number(value)) && Number(value) % 1 === 0)) {
        setSizeInputs((prevForm) => ({
          ...prevForm,
          [name]: value === "" ? "" : String(Number(value)), // تحويل القيمة إلى string
        }));
      }
      return;
    }

    if (name === "price") {
      if (
        value === "" ||
        (!isNaN(Number(value)) && /^(\d+(\.\d*)?|\.\d+)$/.test(value))
      ) {
        setSizeInputs((prevForm) => ({
          ...prevForm,
          [name]: value === "" ? "" : String(value), // تحويل القيمة إلى string
        }));
      }
      return;
    }

    setSizeInputs((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  useEffect(() => {
    // تحقق من الأخطاء عند تغيير قيمة sizeInputs
    const sizeErrors: { [key: string]: string } = {};

    if (!sizeInputs.size.trim()) {
      sizeErrors.size = t("dashboard.updateProduct.errors.sizeRequired");
    }

    const sizeQuantity = Number(sizeInputs.quantity);
    if (
      !sizeInputs.quantity ||
      isNaN(sizeQuantity) ||
      sizeQuantity <= 0 ||
      !Number.isInteger(sizeQuantity)
    ) {
      sizeErrors.quantity = t("dashboard.updateProduct.errors.sizeQuantityMin");
    }

    const sizePrice = Number(sizeInputs.price);
    if (!sizeInputs.price || isNaN(sizePrice) || sizePrice <= 0) {
      sizeErrors.price = t("dashboard.updateProduct.errors.sizePriceMin");
    }

    // تحديث حالة errors بناءً على الأخطاء
    setErrors((prevErrors) => ({
      ...prevErrors,
      sizeName: sizeErrors.size || "",
      sizeQuantity: sizeErrors.quantity || "",
      sizePrice: sizeErrors.price || "",
    }));
  }, [sizeInputs]);

  const handleAddSize = () => {
    setSizeSubmitted(true);

    // التحقق من الأخطاء قبل إضافة الحجم
    const sizeErrors: { [key: string]: string } = {};

    if (!sizeInputs.size.trim()) {
      sizeErrors.size = t("dashboard.updateProduct.errors.sizeRequired");
    }

    const sizeQuantity = Number(sizeInputs.quantity);
    if (
      !sizeInputs.quantity ||
      isNaN(sizeQuantity) ||
      sizeQuantity <= 0 ||
      !Number.isInteger(sizeQuantity)
    ) {
      sizeErrors.quantity = t("dashboard.updateProduct.errors.sizeQuantityMin");
    }

    const sizePrice = Number(sizeInputs.price);
    if (!sizeInputs.price || isNaN(sizePrice) || sizePrice <= 0) {
      sizeErrors.price = t("dashboard.updateProduct.errors.sizePriceMin");
    }

    // إذا كان هناك أخطاء، فلا تتم إضافة الحجم
    if (Object.keys(sizeErrors).length > 0) {
      console.log(sizeErrors);
      setErrors((prevErrors) => ({
        ...prevErrors,
        sizeName: sizeErrors.size,
        sizeQuantity: sizeErrors.quantity,
        sizePrice: sizeErrors.price,
      }));
      return;
    }

    // إذا كانت المدخلات صحيحة، أضف الحجم إلى القائمة
    setSizeSubmitted(false);
    const quantity = Number(sizeInputs.quantity);
    const price = Number(sizeInputs.price);
    setForm((prevForm) => ({
      ...prevForm,
      sizes: [
        ...prevForm.sizes,
        {
          size: sizeInputs.size,
          quantity,
          price,
        },
      ],
    }));

    // إعادة تعيين المدخلات بعد إضافة الحجم
    setSizeInputs({
      size: "",
      quantity: "",
      price: "",
    });
  };

  const handleRemoveSize = (index: number) => {
    setForm((prevForm) => ({
      ...prevForm,
      sizes: prevForm.sizes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({
      titleEn: "",
      titleAr: "",
      descriptionEn: "",
      descriptionAr: "",
      quantity: "",
      price: "",
      priceAfterDiscount: "",
      sizes: "",
      sizeName: "",
      sizePrice: "",
      sizeQuantity: "",
      coverImage: "",
      images: "",
      category: "",
      brand: "",
      general: "",
    });

    setIsSubmitted(true);

    if (!validateForm().isValid) return;

    const formData = new FormData();
    formData.append("titleEn", form.titleEn);
    formData.append("titleAr", form.titleAr);
    formData.append("descriptionEn", form.descriptionEn);
    formData.append("descriptionAr", form.descriptionAr);
    formData.append("quantity", form.quantity.toString());
    formData.append("price", form.price.toString());
    formData.append("category", form.category);
    formData.append("brand", form.brand);
    if (!(form.priceAfterDiscount <= 0)) {
      formData.append("priceAfterDiscount", form.priceAfterDiscount.toString());
    }
    if (form.coverImage) {
      formData.append("coverImage", form.coverImage);
    }

    form.images.forEach((image) => {
      formData.append("images", image);
    });

    form.colors.forEach((color) => {
      formData.append(`colors[]`, color);
    });

    formData.append("sizes", JSON.stringify(form.sizes));

    try {
      const res = await Axios.put(`${PRODUCTS}`, formData);
      if (res.status === 200) {
        console.log(res.data);
        navigate(`/${lang}/dashboard/products`);
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
    <div className="add-product">
      <div className="form-container">
        <h2>
          {t("dashboard.updateProduct.title")} <FaProductHunt />
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="category">
              {t("dashboard.updateProduct.categoryLabel")}
            </label>

            <select
              name="category"
              id="category"
              value={form.category}
              onChange={handleChange}
              dir={lang === "ar" ? "rtl" : "ltr"} // تحديد اتجاه النص
            >
              <option value="" disabled>
                {t("dashboard.updateProduct.choseCategory")}
              </option>{" "}
              {/* خيار افتراضي */}
              {categories.map((category, index) => (
                <option value={category._id} key={category._id + index}>
                  {i18n.language === "ar" ? category.nameAr : category.nameEn}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.category}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="brand">
              {t("dashboard.updateProduct.brandLabel")}
            </label>

            <select
              name="brand"
              id="brand"
              value={form.brand}
              onChange={handleChange}
              disabled={isDisabled}
              dir={lang === "ar" ? "rtl" : "ltr"} // تحديد اتجاه النص
            >
              <option value="">
                {t("dashboard.updateProduct.choseBrand")}
              </option>{" "}
              {brands.map((brand, index) => (
                <option value={brand._id} key={brand._id + index}>
                  {i18n.language === "ar" ? brand.nameAr : brand.nameEn}
                </option>
              ))}
            </select>
            {errors.brand && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.brand}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="titleEn">
              {t("dashboard.updateProduct.productTitleLabelEn")}
            </label>
            <input
              type="text"
              id="titleEn"
              name="titleEn"
              placeholder={t(
                "dashboard.updateProduct.productTitlePlaceholderEn"
              )}
              value={form.titleEn}
              onChange={handleChange}
              disabled={isDisabled}
            />

            {errors.titleEn && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.titleEn}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="titleAr">
              {t("dashboard.updateProduct.productTitleLabelAr")}
            </label>
            <input
              type="text"
              id="titleAr"
              name="titleAr"
              placeholder={t(
                "dashboard.updateProduct.productTitlePlaceholderAr"
              )}
              value={form.titleAr}
              onChange={handleChange}
              disabled={isDisabled}
            />

            {errors.titleAr && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.titleAr}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="descriptionEn">
              {t("dashboard.updateProduct.productDescriptionLabelEn")}
            </label>
            <textarea
              id="descriptionEn"
              name="descriptionEn"
              placeholder={t(
                "dashboard.updateProduct.productDescriptionLabelEn"
              )}
              value={form.descriptionEn}
              onChange={handleChange}
              disabled={isDisabled}
            ></textarea>
            {errors.descriptionEn && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.descriptionEn}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="descriptionAr">
              {t("dashboard.updateProduct.productDescriptionLabelAr")}
            </label>
            <textarea
              id="descriptionAr"
              name="descriptionAr"
              placeholder={t(
                "dashboard.updateProduct.productDescriptionLabelAr"
              )}
              value={form.descriptionAr}
              onChange={handleChange}
              disabled={isDisabled}
            ></textarea>
            {errors.descriptionAr && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.descriptionAr}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="quantity">
              {t("dashboard.updateProduct.quantityLabel")}
            </label>
            <input
              type="text"
              id="quantity"
              name="quantity"
              placeholder={t("dashboard.updateProduct.quantityPlaceholder")}
              value={form.quantity}
              onChange={handleChange}
              disabled={isDisabled}
            />
            {errors.quantity && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.quantity}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="price">
              {t("dashboard.updateProduct.priceLabel")}
            </label>
            <input
              type="text"
              id="price"
              name="price"
              placeholder={t("dashboard.updateProduct.pricePlaceholder")}
              value={form.price}
              onChange={handleChange}
              disabled={isDisabled}
            />
            {errors.price && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.price}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="priceAfterDiscount">
              {t("dashboard.updateProduct.priceAfterDiscountLabel")}
            </label>
            <input
              type="text"
              id="priceAfterDiscount"
              name="priceAfterDiscount"
              placeholder={t(
                "dashboard.updateProduct.priceAfterDiscountPlaceholder"
              )}
              value={form.priceAfterDiscount}
              onChange={handleChange}
              disabled={isDisabled}
            />
            {errors.priceAfterDiscount && (
              <p className="error-text">
                <span className="error-star">*</span>{" "}
                {errors.priceAfterDiscount}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="colors">
              {t("dashboard.updateProduct.colorsLabel")}
            </label>
            <div className="color-input-container">
              <input
                type="color"
                id="colors"
                name="colors"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                disabled={isDisabled}
              />
              <button
                type="button"
                className="add-color-btn"
                onClick={handleAddColor}
                disabled={isDisabled}
              >
                {t("dashboard.updateProduct.addColor")}
              </button>
            </div>

            <div className="color-list">
              {form.colors.map((color, index) => (
                <div key={index} className="color-item">
                  <span
                    className="color-box"
                    style={{ backgroundColor: color }}
                  ></span>
                  <span>{color}</span>
                  <button
                    type="button"
                    className="remove-color-btn"
                    onClick={() => handleRemoveColor(index)}
                  >
                    <IoClose />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="sizes">
              {t("dashboard.updateProduct.sizesLabel")}
            </label>
            <div className="size-input-container">
              <div className="size-input-group">
                <input
                  type="text"
                  id="size"
                  name="size"
                  placeholder={t("dashboard.updateProduct.sizePlaceholder")}
                  value={sizeInputs.size}
                  onChange={handleSizeInputChange}
                  className="size-input"
                  disabled={isDisabled}
                />
                {errors.sizeName && sizeSubmitted && (
                  <p className="error-text">
                    <span className="error-star">*</span> {errors.sizeName}
                  </p>
                )}
                <input
                  type="text"
                  id="quantity"
                  name="quantity"
                  placeholder={t(
                    "dashboard.updateProduct.sizeQuantityPlaceholder"
                  )}
                  value={sizeInputs.quantity}
                  onChange={handleSizeInputChange}
                  className="size-input"
                  disabled={isDisabled}
                />
                {errors.sizeQuantity && sizeSubmitted && (
                  <p className="error-text">
                    <span className="error-star">*</span> {errors.sizeQuantity}
                  </p>
                )}
                <input
                  type="text"
                  id="price"
                  name="price"
                  placeholder={t(
                    "dashboard.updateProduct.sizePricePlaceholder"
                  )}
                  value={sizeInputs.price}
                  onChange={handleSizeInputChange}
                  className="size-input"
                  disabled={isDisabled}
                />
                {errors.sizePrice && sizeSubmitted && (
                  <p className="error-text">
                    <span className="error-star">*</span> {errors.sizePrice}
                  </p>
                )}
                {errors.sizes && (
                  <p className="error-text">
                    <span className="error-star">*</span> {errors.sizes}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="add-size-btn"
                onClick={handleAddSize}
                disabled={isDisabled}
              >
                {t("dashboard.updateProduct.addSize")}
              </button>

              <div className="size-list">
                {form.sizes.map((size, index) => (
                  <div key={index} className="size-item">
                    <span>
                      {size.size} - {size.quantity} units - {size.price} EGP
                    </span>
                    <button
                      type="button"
                      className="remove-size-btn"
                      onClick={() => handleRemoveSize(index)}
                    >
                      <IoClose />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <div className="file-upload">
              <label className="custom-upload-btn">
                <FaImage /> {t("dashboard.updateProduct.choseCoverImage")}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  disabled={isDisabled}
                />
              </label>
            </div>
            {previewCover && (
              <div className="cover-preview-container">
                <img
                  src={previewCover}
                  alt="Cover Preview"
                  className="image-preview"
                />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={handleRemoveCoverImage}
                >
                  <IoClose />
                </button>
              </div>
            )}

            {errors.coverImage && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.coverImage}
              </p>
            )}
          </div>
          <div className="form-group">
            <div className="file-upload">
              <label className="custom-upload-btn">
                <FaImages /> {t("dashboard.updateProduct.choseImages")}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  disabled={isDisabled}
                />
              </label>
            </div>
            <div className="image-grid">
              {previewImages.map((src, index) => (
                <div key={index} className="image-container">
                  <img
                    src={src}
                    alt={`Preview ${index}`}
                    className="image-preview"
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <IoClose />
                  </button>
                </div>
              ))}
            </div>
            {errors.images && (
              <p className="error-text">
                <span className="error-star">*</span> {errors.images}
              </p>
            )}
          </div>
          {errors.general && (
            <div className="error-box">
              <p className="error-text">
                <span className="error-star">*</span> {errors.general}
              </p>
            </div>
          )}
          <button type="submit" className="btn-submit">
            {t("dashboard.updateProduct.submitButton")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpdateProduct;
