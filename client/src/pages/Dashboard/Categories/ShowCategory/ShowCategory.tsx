import { useEffect, useState } from "react";
import { BASE_URL, CATEGORIES } from "../../../../Api/Api";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { useTranslation } from "react-i18next";
import { CategorySchema } from "../../../../Types/app";
import { useParams } from "react-router-dom";
import { Axios } from "../../../../Api/axios";
import "./ShowCategory.scss";

function ShowCategory() {
  // Extract category ID from route parameters
  const { id } = useParams();

  // State to store the fetched category data
  const [category, setCategory] = useState<CategorySchema | null>(null);

  // Translation hook
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Fetch category details from the API
    const fetchCategory = async () => {
      try {
        const { data } = await Axios.get(`${BASE_URL}${CATEGORIES}/${id}`);
        setCategory(data.data); // Save the response data to state
      } catch (error) {
        console.error("Error fetching category:", error);
      }
    };

    fetchCategory();
  }, [id]); // Refetch if the category ID changes

  // Show loading state until category data is fetched
  if (!category)
    return <div className="loading">{t("dashboard.showCategory.loading")}</div>;

  return (
    <div className="show-category">
      {/* Page heading with icon */}
      <h2>
        {t("dashboard.showCategory.categoryDetails")} <BiSolidCategoryAlt />
      </h2>

      {/* Category details table */}
      <table
        className="category-table"
        style={{ textAlign: i18n.language === "ar" ? "right" : "left" }} // Handle RTL for Arabic
      >
        <thead>
          <tr>
            <th>{t("dashboard.showCategory.field")}</th>
            <th>{t("dashboard.showCategory.details")}</th>
          </tr>
        </thead>
        <tbody>
          {/* Category ID */}
          <tr>
            <td>{t("dashboard.showCategory.id")}</td>
            <td data-label={t("dashboard.showCategory.id")}>{category._id}</td>
          </tr>

          {/* Arabic name */}
          <tr>
            <td>{t("dashboard.showCategory.nameAr")}</td>
            <td data-label={t("dashboard.showCategory.nameAr")}>
              {category.nameAr}
            </td>
          </tr>

          {/* English name */}
          <tr>
            <td>{t("dashboard.showCategory.nameEn")}</td>
            <td data-label={t("dashboard.showCategory.nameEn")}>
              {category.nameEn}
            </td>
          </tr>

          {/* Category image */}
          <tr>
            <td>{t("dashboard.showCategory.image")}</td>
            <td data-label={t("dashboard.showCategory.image")}>
              <img src={category.image || undefined} alt="category image" />
            </td>
          </tr>

          {/* Created date */}
          <tr>
            <td>{t("dashboard.showCategory.createdAt")}</td>
            <td data-label={t("dashboard.showCategory.createdAt")}>
              {category.createdAt
                ? new Date(category.createdAt).toLocaleDateString()
                : t("dashboard.showCategory.notAvailable")}
            </td>
          </tr>

          {/* Last updated date */}
          <tr>
            <td>{t("dashboard.showCategory.updatedAt")}</td>
            <td data-label={t("dashboard.showCategory.updatedAt")}>
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
