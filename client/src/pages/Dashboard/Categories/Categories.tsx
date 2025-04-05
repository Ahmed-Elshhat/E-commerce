import { useCallback, useEffect, useState } from "react";
import "./Categories.scss";
import { Axios } from "../../../Api/axios";
import { CATEGORIES } from "../../../Api/Api";
import { CategorySchema } from "../../../Types/app";
import { FaEye, FaTrash } from "react-icons/fa";
import Loading from "../../../components/Loading/Loading";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { MdEditSquare } from "react-icons/md";
import CopyButton from "../../../components/CopyButton/CopyButton";

function Categories() {
  const [paginationResults, setPaginationResults] = useState({
    next: 1,
    numberOfPages: 1,
  });
  const [categories, setCategories] = useState<CategorySchema[]>([]);
  const { lang } = useAppSelector((state) => state.language);
  const [loading, setLoading] = useState({
    status: true,
    type: "normal",
  });
  const { t, i18n } = useTranslation();
  useEffect(() => {
    const getCategories = async () => {
      setLoading({ status: true, type: "normal" });

      try {
        const res = await Axios.get(`${CATEGORIES}?page=1&limit=10`);
        if (res.status === 200) {
          setLoading({ status: false, type: "normal" });
          setCategories(res.data.data);
          setPaginationResults(res.data.paginationResults);
          console.log(res.data);
        }
      } catch (err) {
        setLoading({ status: false, type: "normal" });
        console.log(err);
      }
    };
    getCategories();
  }, []);

  const fetchMoreCategories = useCallback(async () => {
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
          `${CATEGORIES}?page=${paginationResults.next}&limit=10`
        );
        if (res.status === 200) {
          setLoading({ status: false, type: "bottom" });
          setCategories((prev) => [...prev, ...res.data.data]);
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
    window.addEventListener("scroll", fetchMoreCategories);
    return () => window.removeEventListener("scroll", fetchMoreCategories);
  }, [fetchMoreCategories]);

  const handleDelete = async (id: string) => {
    setLoading({ status: true, type: "normal" });
    try {
      const res = await Axios.delete(`${CATEGORIES}/${id}`);
      if (res.status === 204) {
        setCategories(categories.filter((category) => category._id !== id));
        setLoading({ status: false, type: "normal" });
        console.log(res.data);
      }
    } catch (err) {
      setLoading({ status: false, type: "normal" });
      console.error(err);
    }
  };

  return (
    <div className="categories">
      {loading.status && loading.type === "normal" && (
        <Loading transparent={false} />
      )}
      <div className="categories-container">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("dashboard.categories.name")}</th>
                <th>{t("dashboard.categories.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map((category, index) => (
                  <tr key={`${category._id}-${index}`}>
                    <td data-label="ID">
                      <CopyButton couponId={category._id} />
                    </td>
                    <td data-label={t("dashboard.categories.name")}>
                    {i18n.language === "ar" ? category.nameAr : category.nameEn}
                    </td>
                    <td data-label={t("dashboard.categories.actions")}>
                      <div className="action-buttons">
                        <Link
                          to={`/${lang}/dashboard/categories/show/${category._id}`}
                          className="btn-view-link"
                        >
                          <button className="btn btn-view">
                            <FaEye />
                          </button>
                        </Link>

                        <Link
                          to={`/${lang}/dashboard/categories/update/${category._id}`}
                          className="btn-edit-link"
                        >
                          <button className="btn btn-edit">
                            <MdEditSquare />
                          </button>
                        </Link>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(category._id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data">
                  <td colSpan={5}>
                    {t("dashboard.categories.noCategoriesFound")}
                  </td>
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

export default Categories;
