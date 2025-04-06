import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Axios } from "../../../../Api/axios";
import { BASE_URL, CATEGORIES } from "../../../../Api/Api";
import { useTranslation } from "react-i18next";
import "./ShowCategory.scss";
import { BiSolidCategoryAlt } from "react-icons/bi";

function ShowCategory() {
  const { id } = useParams();
  const [category, setCategory] = useState({
    _id: "",
    nameAr: "",
    nameEn: "",
    image: "",
    createdAt: null,
    updatedAt: null,
  });

  const { t, i18n } = useTranslation(); // إضافة الترجمة

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const { data } = await Axios.get(`${BASE_URL}${CATEGORIES}/${id}`);
        setCategory(data.data);
        console.log("Category fetched successfully:", data.data);
      } catch (error) {
        console.error("Error fetching category:", error);
      }
    };

    fetchCategory();
  }, [id]);

  if (!category)
    return <div className="loading">{t("dashboard.showCategory.loading")}</div>;

  return (
    <div className="show-category">
      <h2>
        {t("dashboard.showCategory.categoryDetails")}  <BiSolidCategoryAlt />
      </h2>
      <table
        className="user-table"
        style={{ textAlign: i18n.language === "ar" ? "right" : "left" }}
      >
        <thead>
          <tr>
            <th>{t("dashboard.showCategory.field")}</th>
            <th>{t("dashboard.showCategory.details")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t("dashboard.showCategory.id")}</td>
            <td data-label="ID">{category._id}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showCategory.nameAr")}</td>
            <td data-label="Name">{category.nameAr}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showCategory.nameEn")}</td>
            <td data-label="Name">{category.nameEn}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showCategory.image")}</td>
            <td data-label="Name">
              <img src={category.image || undefined} alt="category image" />
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showCategory.createdAt")}</td>
            <td data-label="Created At">
              {category.createdAt
                ? new Date(category.createdAt).toLocaleDateString()
                : t("dashboard.showCategory.notAvailable")}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showCategory.updatedAt")}</td>
            <td data-label="Updated At">
              {category.updatedAt
                ? new Date(category.updatedAt).toLocaleDateString()
                : t("dashboard.showCategory.notAvailable")}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ShowCategory;
