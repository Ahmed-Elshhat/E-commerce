import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Axios } from "../../../../Api/axios";
import { BASE_URL, BRANDS } from "../../../../Api/Api";
import { useTranslation } from "react-i18next";
import { BsShop } from "react-icons/bs";
import "./ShowBrand.scss";

function ShowBrand() {
  const { id } = useParams();
  const [brand, setBrand] = useState({
    _id: "",
    nameAr: "",
    nameEn: "",
    image: "",
    createdAt: null,
    updatedAt: null,
  });

  const { t, i18n } = useTranslation(); // إضافة الترجمة

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const { data } = await Axios.get(`${BASE_URL}${BRANDS}/${id}`);
        setBrand(data.data);
        console.log("Brand fetched successfully:", data.data);
      } catch (error) {
        console.error("Error fetching brand:", error);
      }
    };

    fetchBrand();
  }, [id]);

  if (!brand)
    return <div className="loading">{t("dashboard.showBrand.loading")}</div>;

  return (
    <div className="show-brand">
      <h2>
        {t("dashboard.showBrand.brandDetails")} <BsShop />
      </h2>
      <table
        className="user-table"
        style={{ textAlign: i18n.language === "ar" ? "right" : "left" }}
      >
        <thead>
          <tr>
            <th>{t("dashboard.showBrand.field")}</th>
            <th>{t("dashboard.showBrand.details")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t("dashboard.showBrand.id")}</td>
            <td data-label="ID">{brand._id}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showBrand.nameAr")}</td>
            <td data-label="Name">{brand.nameAr}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showBrand.nameEn")}</td>
            <td data-label="Name">{brand.nameEn}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showBrand.image")}</td>
            <td data-label="Name">
              <img src={brand.image || undefined} alt="brand image" />
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showBrand.createdAt")}</td>
            <td data-label="Created At">
              {brand.createdAt
                ? new Date(brand.createdAt).toLocaleDateString()
                : t("dashboard.showBrand.notAvailable")}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showBrand.updatedAt")}</td>
            <td data-label="Updated At">
              {brand.updatedAt
                ? new Date(brand.updatedAt).toLocaleDateString()
                : t("dashboard.showBrand.notAvailable")}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ShowBrand;
