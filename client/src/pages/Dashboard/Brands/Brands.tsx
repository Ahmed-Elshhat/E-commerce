import { useCallback, useEffect, useState } from "react";
import "./Brands.scss";
import { Axios } from "../../../Api/axios";
import { BRANDS } from "../../../Api/Api";
import { BrandSchema } from "../../../Types/app";
import { FaEye, FaTrash } from "react-icons/fa";
import Loading from "../../../components/Loading/Loading";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { MdEditSquare } from "react-icons/md";
import CopyButton from "../../../components/CopyButton/CopyButton";

function Brands() {
  const [paginationResults, setPaginationResults] = useState({
    next: 1,
    numberOfPages: 1,
  });
  const [brands, setBrands] = useState<BrandSchema[]>([]);
  const { lang } = useAppSelector((state) => state.language);
  const [loading, setLoading] = useState({
    status: true,
    type: "normal",
  });
  const { t, i18n } = useTranslation();
  useEffect(() => {
    const getBrands = async () => {
      setLoading({ status: true, type: "normal" });

      try {
        const res = await Axios.get(`${BRANDS}?page=1&limit=10`);
        if (res.status === 200) {
          setLoading({ status: false, type: "normal" });
          setBrands(res.data.data);
          setPaginationResults(res.data.paginationResults);
          console.log(res.data);
        }
      } catch (err) {
        setLoading({ status: false, type: "normal" });
        console.log(err);
      }
    };
    getBrands();
  }, []);

  const fetchMoreBrands = useCallback(async () => {
    if (
      loading.status ||
      paginationResults.next > paginationResults.numberOfPages ||
      !paginationResults.next
    )
      return;

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
          console.log(res.data);
        }
      } catch (err) {
        setLoading({ status: false, type: "bottom" });
        console.log(err);
      }
    }
  }, [loading, paginationResults]);

  useEffect(() => {
    window.addEventListener("scroll", fetchMoreBrands);
    return () => window.removeEventListener("scroll", fetchMoreBrands);
  }, [fetchMoreBrands]);

  const handleDelete = async (id: string) => {
    setLoading({ status: true, type: "normal" });
    try {
      const res = await Axios.delete(`${BRANDS}/${id}`);
      if (res.status === 204) {
        setBrands(brands.filter((brand) => brand._id !== id));
        setLoading({ status: false, type: "normal" });
        console.log(res.data);
      }
    } catch (err) {
      setLoading({ status: false, type: "normal" });
      console.error(err);
    }
  };

  return (
    <div className="brands">
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
              {brands.length > 0 ? (
                brands.map((brand, index) => (
                  <tr key={`${brand._id}-${index}`}>
                    <td data-label="ID">
                      <CopyButton couponId={brand._id} />
                    </td>
                    <td data-label={t("dashboard.brands.name")}>
                    {i18n.language === "ar" ? brand.nameAr : brand.nameEn}
                    </td>
                    <td data-label={t("dashboard.brands.actions")}>
                      <div className="action-buttons">
                        <Link
                          to={`/${lang}/dashboard/brands/show/${brand._id}`}
                          className="btn-view-link"
                        >
                          <button className="btn btn-view">
                            <FaEye />
                          </button>
                        </Link>

                        <Link
                          to={`/${lang}/dashboard/brands/update/${brand._id}`}
                          className="btn-edit-link"
                        >
                          <button className="btn btn-edit">
                            <MdEditSquare />
                          </button>
                        </Link>
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
                <tr className="no-data">
                  <td colSpan={5}>{t("dashboard.brands.noBrandsFound")}</td>
                </tr>
              )}

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
