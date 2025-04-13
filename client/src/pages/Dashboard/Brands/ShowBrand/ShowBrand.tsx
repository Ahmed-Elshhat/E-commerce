import { useEffect, useState } from "react";
import { BASE_URL, BRANDS } from "../../../../Api/Api";
import { useTranslation } from "react-i18next";
import { BrandSchema } from "../../../../Types/app";
import { AxiosError } from "axios";
import { useParams } from "react-router-dom";
import { BsShop } from "react-icons/bs";
import { Axios } from "../../../../Api/axios";
import Loading from "../../../../components/Loading/Loading";
import RedirectPage from "../../../../components/RedirectPage/RedirectPage";
import "./ShowBrand.scss";

function ShowBrand() {
  const { id } = useParams(); // Fetch brand ID from URL parameters
  const [brand, setBrand] = useState<BrandSchema | null>(null); // State to store the brand data
  const [loading, setLoading] = useState(false); // State to track loading status
  const [error, setError] = useState(""); // State to store error messages
  const { t, i18n } = useTranslation(); // i18n translation functions for multi-language support
  const dir = document.location.pathname.split("/").slice(0, -2).join("/"); // Directory for redirection if error occurs
  const pageName = document.location.pathname
    .split("/")
    .slice(-3, -2)
    .join("/"); // Extracts the page name for redirecting (e.g., "brands")

  // useEffect hook to fetch brand details when the component mounts or when 'id' changes
  useEffect(() => {
    const fetchBrand = async () => {
      setLoading(true); // Set loading to true before starting the request
      try {
        const { data } = await Axios.get(`${BASE_URL}${BRANDS}/${id}`); // Fetch brand data from API
        setLoading(false); // Set loading to false once data is fetched
        setBrand(data.data); // Store brand data in state
      } catch (err) {
        setLoading(false); // Stop loading in case of error
        if (err instanceof AxiosError) {
          setError(err.response?.data.message); // Handle specific Axios errors
        } else {
          setError("An unexpected error occurred"); // Fallback error message
        }
        console.error("Error fetching brand:", err); // Log error for debugging
      }
    };

    fetchBrand(); // Call fetch function to load brand data
  }, [id]); // Dependency array ensures fetch is triggered when 'id' changes

  // Redirect to error page if brand data is not available or if there's an error
  if (!brand) return <RedirectPage message={error} dir={dir} pageName={pageName} />;

  return (
    <>
      {loading && <Loading transparent={false} />} {/* Show loading indicator while fetching */}
      <div className="show-brand">
        <h2>
          {t("dashboard.showBrand.brandDetails")} <BsShop />
        </h2>
        {/* Table displaying the brand details */}
        <table
          className="brand-table"
          style={{ textAlign: i18n.language === "ar" ? "right" : "left" }} // Dynamically set alignment based on language (RTL or LTR)
        >
          <thead>
            <tr>
              <th>{t("dashboard.showBrand.field")}</th> {/* Field name column */}
              <th>{t("dashboard.showBrand.details")}</th> {/* Field value column */}
            </tr>
          </thead>
          <tbody>
            {/* Display brand details dynamically */}
            <tr>
              <td>{t("dashboard.showBrand.id")}</td>
              <td data-label={t("dashboard.showBrand.id")}>{brand._id}</td>
            </tr>
            <tr>
              <td>{t("dashboard.showBrand.nameAr")}</td>
              <td data-label={t("dashboard.showBrand.nameAr")}>{brand.nameAr}</td>
            </tr>
            <tr>
              <td>{t("dashboard.showBrand.nameEn")}</td>
              <td data-label={t("dashboard.showBrand.nameEn")}>{brand.nameEn}</td>
            </tr>
            <tr>
              <td>{t("dashboard.showBrand.image")}</td>
              <td data-label={t("dashboard.showBrand.image")}>
                {/* Display image, if available */}
                <img src={brand.image || undefined} alt="brand image" />
              </td>
            </tr>
            <tr>
              <td>{t("dashboard.showBrand.createdAt")}</td>
              <td data-label={t("dashboard.showBrand.createdAt")}>
                {/* Format and display the creation date */}
                {brand.createdAt
                  ? new Date(brand.createdAt).toLocaleDateString()
                  : t("dashboard.showBrand.notAvailable")}
              </td>
            </tr>
            <tr>
              <td>{t("dashboard.showBrand.updatedAt")}</td>
              <td data-label={t("dashboard.showBrand.updatedAt")}>
                {/* Format and display the last update date */}
                {brand.updatedAt
                  ? new Date(brand.updatedAt).toLocaleDateString()
                  : t("dashboard.showBrand.notAvailable")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ShowBrand;
