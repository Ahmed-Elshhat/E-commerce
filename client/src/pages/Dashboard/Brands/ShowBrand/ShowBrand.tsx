import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Axios } from "../../../../Api/axios";
import { BASE_URL, BRANDS } from "../../../../Api/Api";
import { useTranslation } from "react-i18next";
import { BsShop } from "react-icons/bs";
import "./ShowBrand.scss";
import { BrandSchema } from "../../../../Types/app";
import Loading from "../../../../components/Loading/Loading";
import RedirectPage from "../../../../components/RedirectPage/RedirectPage";
import { AxiosError } from "axios";

function ShowBrand() {
  const { id } = useParams();
  const [brand, setBrand] = useState<BrandSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t, i18n } = useTranslation();
  const dir = document.location.pathname.split("/").slice(0, -2).join("/");
  const pageName = document.location.pathname
  .split("/")
  .slice(-3, -2)
  .join("/");


  useEffect(() => {
    const fetchBrand = async () => {
      setLoading(true);
      try {
        const { data } = await Axios.get(`${BASE_URL}${BRANDS}/${id}`);
        setLoading(false);
        setBrand(data.data);
        console.log("Brand fetched successfully:", data.data);
      } catch (err) {
        setLoading(false);
        if (err instanceof AxiosError) {
          setError(err.response?.data.message);
        } else {
          setError("An unexpected error occurred");
        }
        console.error("Error fetching brand:", err);
      }
    };

    fetchBrand();
  }, [id]);

  if (!brand) return <RedirectPage message={error} dir={dir} pageName={pageName} />;

  return (
    <>
      {loading && <Loading transparent={false} />}
      <div className="show-brand">
        <h2>
          {t("dashboard.showBrand.brandDetails")} <BsShop />
        </h2>
        <table
          className="brand-table"
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
              <td data-label={t("dashboard.showBrand.id")}>{brand._id}</td>
            </tr>
            <tr>
              <td>{t("dashboard.showBrand.nameAr")}</td>
              <td data-label={t("dashboard.showBrand.nameAr")}>
                {brand.nameAr}
              </td>
            </tr>
            <tr>
              <td>{t("dashboard.showBrand.nameEn")}</td>
              <td data-label={t("dashboard.showBrand.nameEn")}>
                {brand.nameEn}
              </td>
            </tr>
            <tr>
              <td>{t("dashboard.showBrand.image")}</td>
              <td data-label={t("dashboard.showBrand.image")}>
                <img src={brand.image || undefined} alt="brand image" />
              </td>
            </tr>
            <tr>
              <td>{t("dashboard.showBrand.createdAt")}</td>
              <td data-label={t("dashboard.showBrand.createdAt")}>
                {brand.createdAt
                  ? new Date(brand.createdAt).toLocaleDateString()
                  : t("dashboard.showBrand.notAvailable")}
              </td>
            </tr>
            <tr>
              <td>{t("dashboard.showBrand.updatedAt")}</td>
              <td data-label={t("dashboard.showBrand.updatedAt")}>
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
