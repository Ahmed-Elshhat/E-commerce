import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Axios } from "../../../../Api/axios";
import { BASE_URL, PRODUCTS } from "../../../../Api/Api";
import { useTranslation } from "react-i18next";
import { FaProductHunt } from "react-icons/fa";
import "./ShowProductDetails.scss";
import { ProductSchema } from "../../../../Types/app";
import { useAppSelector } from "../../../../Redux/app/hooks";

function ShowProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<ProductSchema | null>(null);
  const { lang } = useAppSelector((state) => state.language);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await Axios.get(`${BASE_URL}${PRODUCTS}/${id}`);
        setProduct(data.data);
        console.log("Product fetched successfully:", data.data);
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };

    fetchProduct();
  }, [id]);

  if (!product)
    return <div className="loading">{t("dashboard.showProduct.loading")}</div>;

  return (
    <div className="show-product">
      <h2>
        {t("dashboard.showProduct.productDetails")} <FaProductHunt />
      </h2>
      <table
        className="product-table"
        style={{ textAlign: i18n.language === "ar" ? "right" : "left" }}
      >
        <thead>
          <tr>
            <th>{t("dashboard.showProduct.field")}</th>
            <th>{t("dashboard.showProduct.details")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t("dashboard.showProduct.id")}</td>
            <td data-label={t("dashboard.showProduct.id")}>{product._id}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.nameAr")}</td>
            <td data-label={t("dashboard.showProduct.nameAr")}>
              {product.titleAr}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.nameEn")}</td>
            <td data-label={t("dashboard.showProduct.nameEn")}>
              {product.titleAr}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.descriptionAr")}</td>
            <td data-label={t("dashboard.showProduct.descriptionAr")}>
              {product.descriptionAr}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.descriptionEn")}</td>
            <td data-label={t("dashboard.showProduct.descriptionEn")}>
              {product.descriptionEn}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.quantity")}</td>
            <td data-label={t("dashboard.showProduct.quantity")}>
              {product.quantity}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.price")}</td>
            <td data-label={t("dashboard.showProduct.price")}>
              {product.price}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.priceAfterDiscount")}</td>
            <td data-label={t("dashboard.showProduct.priceAfterDiscount")}>
              {product?.priceAfterDiscount || 0}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.sold")}</td>
            <td data-label={t("dashboard.showProduct.sold")}>{product.sold}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.ratingsAverage")}</td>
            <td data-label={t("dashboard.showProduct.ratingsAverage")}>
              {product?.ratingsAverage || 0}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.ratingsQuantity")}</td>
            <td data-label={t("dashboard.showProduct.ratingsQuantity")}>
              <Link to={`/${lang}/reviews/show/${id}`}>
                {t("dashboard.showProduct.showReviewsButton")}
                <span>({product.ratingsQuantity})</span>
              </Link>
            </td>
          </tr>
          {product.category && (
            <>
              <tr>
                <td>{t("dashboard.showProduct.categoryId")}</td>
                <td data-label={t("dashboard.showProduct.categoryId")}>
                  {product?._id || t("dashboard.showProduct.notAvailable")}
                </td>
              </tr>
              <tr>
                <td>{t("dashboard.showProduct.categoryNameAr")}</td>
                <td data-label={t("dashboard.showProduct.categoryNameAr")}>
                  {product.category.nameAr}
                </td>
              </tr>

              <tr>
                <td>{t("dashboard.showProduct.categoryNameEn")}</td>
                <td data-label={t("dashboard.showProduct.categoryNameEn")}>
                  {product.category.nameEn}
                </td>
              </tr>
            </>
          )}

          {product.brand && (
            <>
              <tr>
                <td>{t("dashboard.showProduct.brandId")}</td>
                <td data-label={t("dashboard.showProduct.brandId")}>
                  {product.brand._id}
                </td>
              </tr>
              <tr>
                <td>{t("dashboard.showProduct.brandNameAr")}</td>
                <td data-label={t("dashboard.showProduct.brandNameAr")}>
                  {product.brand.nameAr}
                </td>
              </tr>
              <tr>
                <td>{t("dashboard.showProduct.brandNameEn")}</td>
                <td data-label={t("dashboard.showProduct.brandNameEn")}>
                  {product.brand.nameEn}
                </td>
              </tr>
            </>
          )}
          <tr>
            <td>{t("dashboard.showProduct.colors")}</td>
            <td data-label={t("dashboard.showProduct.colors")}>
              <div className="color-container">
                {product.colors.map((color, index) => (
                  <div key={index} className="color-item">
                    <span
                      className="color-box"
                      style={{ backgroundColor: color }}
                      title={color}
                    ></span>
                    <span className="color-code">{color}</span>
                  </div>
                ))}
              </div>
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.coverImage")}</td>
            <td data-label={t("dashboard.showProduct.coverImage")}>
              <img src={product.coverImage || undefined} alt="product image" />
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.images")}</td>
            <td data-label={t("dashboard.showProduct.images")}>
              <div className="images-wrapper">
                {product.images.map((img, index) => (
                  <img
                    key={index}
                    src={img.url || undefined}
                    alt="product image"
                    className="product-image"
                  />
                ))}
              </div>
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.createdAt")}</td>
            <td data-label={t("dashboard.showProduct.createdAt")}>
              {product.createdAt
                ? new Date(product.createdAt).toLocaleDateString()
                : t("dashboard.showProduct.notAvailable")}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showProduct.updatedAt")}</td>
            <td data-label={t("dashboard.showProduct.updatedAt")}>
              {product.updatedAt
                ? new Date(product.updatedAt).toLocaleDateString()
                : t("dashboard.showProduct.notAvailable")}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ShowProductDetails;
