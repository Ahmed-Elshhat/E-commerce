import { useCallback, useEffect, useState } from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import { useAppSelector } from "../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { MdEditSquare } from "react-icons/md";
import { BrandSchema } from "../../../Types/app";
import { BRANDS } from "../../../Api/Api";
import { Axios } from "../../../Api/axios";
import { Link } from "react-router-dom";
import Loading from "../../../components/Loading/Loading";
import CopyButton from "../../../components/CopyButton/CopyButton";
import "./Brands.scss";

function Brands() {
  const [brands, setBrands] = useState<BrandSchema[]>([]);

  const { lang } = useAppSelector((state) => state.language);

  // Initial state for pagination and brands data
  const [paginationResults, setPaginationResults] = useState({
    next: 1,
    numberOfPages: 1,
  });

  const [loading, setLoading] = useState({
    status: true,
    type: "normal", // "normal" for full page, "bottom" for infinite scroll loading
  });

  const { t, i18n } = useTranslation();

  // Fetch initial brands on component mount
  useEffect(() => {
    const getBrands = async () => {
      setLoading({ status: true, type: "normal" });

      try {
        const res = await Axios.get(`${BRANDS}?page=1&limit=10`);
        if (res.status === 200) {
          setLoading({ status: false, type: "normal" });
          setBrands(res.data.data);
          setPaginationResults(res.data.paginationResults);
        }
      } catch (err) {
        setLoading({ status: false, type: "normal" });
        console.log(err);
      }
    };

    getBrands();
  }, []);

  // Load more brands when user scrolls to bottom (infinite scrolling)
  const fetchMoreBrands = useCallback(async () => {
    if (
      loading.status ||
      paginationResults.next > paginationResults.numberOfPages ||
      !paginationResults.next
    )
      return;

    // Check if the user has reached the bottom of the page
    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight -
        (window.scrollX <= 710 ? 500 : 300)
    ) {
      setLoading({ status: true, type: "bottom" });
      try {
        const res = await Axios.get(
          `${BRANDS}?page=${paginationResults.next}&limit=10`
        );
        if (res.status === 200) {
          setLoading({ status: false, type: "bottom" });
          setBrands((prev) => [...prev, ...res.data.data]);
          setPaginationResults(res.data.paginationResults);
        }
      } catch (err) {
        setLoading({ status: false, type: "bottom" });
        console.log(err);
      }
    }
  }, [loading, paginationResults]);

  // Attach scroll event to window for infinite loading
  useEffect(() => {
    window.addEventListener("scroll", fetchMoreBrands);
    return () => window.removeEventListener("scroll", fetchMoreBrands);
  }, [fetchMoreBrands]);

  // Handle brand deletion by ID
  const handleDelete = async (id: string) => {
    setLoading({ status: true, type: "normal" });
    try {
      const res = await Axios.delete(`${BRANDS}/${id}`);
      if (res.status === 204) {
        // Filter out deleted brand from state
        setBrands(brands.filter((brand) => brand._id !== id));
        setLoading({ status: false, type: "normal" });
      }
    } catch (err) {
      setLoading({ status: false, type: "normal" });
      console.error(err);
    }
  };

  return (
    <div className="brands">
      {/* Full-page loading */}
      {loading.status && loading.type === "normal" && (
        <Loading transparent={false} />
      )}

      <div className="brands-container">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("dashboard.brands.name")}</th>
                <th>{t("dashboard.brands.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {/* Render brands if available */}
              {brands.length > 0 ? (
                brands.map((brand, index) => (
                  <tr key={`${brand._id}-${index}`}>
                    <td data-label="ID">
                      <CopyButton couponId={brand._id} />
                    </td>
                    <td data-label={t("dashboard.brands.name")}>
                      {/* Display brand name in current language */}
                      {i18n.language === "ar" ? brand.nameAr : brand.nameEn}
                    </td>
                    <td data-label={t("dashboard.brands.actions")}>
                      <div className="action-buttons">
                        {/* View button */}
                        <Link
                          to={`/${lang}/dashboard/brands/show/${brand._id}`}
                          className="btn-view-link"
                        >
                          <button className="btn btn-view">
                            <FaEye />
                          </button>
                        </Link>

                        {/* Edit button */}
                        <Link
                          to={`/${lang}/dashboard/brands/update/${brand._id}`}
                          className="btn-edit-link"
                        >
                          <button className="btn btn-edit">
                            <MdEditSquare />
                          </button>
                        </Link>

                        {/* Delete button */}
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(brand._id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                // Show message if no brands found
                <tr className="no-data">
                  <td colSpan={5}>{t("dashboard.brands.noBrandsFound")}</td>
                </tr>
              )}

              {/* Bottom loading animation for infinite scroll */}
              {loading.status && loading.type === "bottom" && (
                <tr>
                  <td colSpan={3}>
                    <div className="loading-bottom"></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Brands;
