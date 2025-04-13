import { useCallback, useEffect, useState } from "react";
import { Axios } from "../../../Api/axios";
import { CATEGORIES } from "../../../Api/Api";
import { CategorySchema } from "../../../Types/app";
import { FaEye, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { MdEditSquare } from "react-icons/md";
import Loading from "../../../components/Loading/Loading";
import CopyButton from "../../../components/CopyButton/CopyButton";
import "./Categories.scss";

function Categories() {
  // Local state for fetched categories
  const [categories, setCategories] = useState<CategorySchema[]>([]);

  // Get selected language from Redux
  const { lang } = useAppSelector((state) => state.language);

  // i18next translation hook
  const { t, i18n } = useTranslation();

  // State to hold pagination metadata
  const [paginationResults, setPaginationResults] = useState({
    next: 1,
    numberOfPages: 1,
  });

  // Loading state to show either full screen or bottom loader
  const [loading, setLoading] = useState({
    status: true,
    type: "normal", // "normal" for initial, "bottom" for infinite scroll
  });

  // Fetch initial categories on component mount
  useEffect(() => {
    const getCategories = async () => {
      setLoading({ status: true, type: "normal" });

      try {
        const res = await Axios.get(`${CATEGORIES}?page=1&limit=10`);
        if (res.status === 200) {
          setLoading({ status: false, type: "normal" });
          setCategories(res.data.data);
          setPaginationResults(res.data.paginationResults);
        }
      } catch (err) {
        setLoading({ status: false, type: "normal" });
        console.log(err);
      }
    };
    getCategories();
  }, []);

  // Infinite scroll fetch logic using scroll position
  const fetchMoreCategories = useCallback(async () => {
    if (
      loading.status ||
      paginationResults.next > paginationResults.numberOfPages ||
      !paginationResults.next
    )
      return;

    // Trigger loading if near bottom of page (with different padding for mobile)
    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - (window.scrollX <= 710 ? 500 : 300)
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
        }
      } catch (err) {
        setLoading({ status: false, type: "bottom" });
        console.log(err);
      }
    }
  }, [loading, paginationResults]);

  // Attach scroll event listener to trigger fetchMoreCategories
  useEffect(() => {
    window.addEventListener("scroll", fetchMoreCategories);
    return () => window.removeEventListener("scroll", fetchMoreCategories);
  }, [fetchMoreCategories]);

  // Delete handler for removing a category
  const handleDelete = async (id: string) => {
    setLoading({ status: true, type: "normal" });
    try {
      const res = await Axios.delete(`${CATEGORIES}/${id}`);
      if (res.status === 204) {
        // Update UI after successful deletion
        setCategories(categories.filter((category) => category._id !== id));
        setLoading({ status: false, type: "normal" });
      }
    } catch (err) {
      setLoading({ status: false, type: "normal" });
      console.error(err);
    }
  };

  return (
    <div className="categories">
      {/* Main loading spinner */}
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
              {/* Render categories or fallback message if empty */}
              {categories.length > 0 ? (
                categories.map((category, index) => (
                  <tr key={`${category._id}-${index}`}>
                    <td data-label="ID">
                      {/* Copyable ID */}
                      <CopyButton couponId={category._id} />
                    </td>
                    <td data-label={t("dashboard.categories.name")}>
                      {/* Show name based on selected language */}
                      {i18n.language === "ar"
                        ? category.nameAr
                        : category.nameEn}
                    </td>
                    <td data-label={t("dashboard.categories.actions")}>
                      <div className="action-buttons">
                        {/* View category button */}
                        <Link
                          to={`/${lang}/dashboard/categories/show/${category._id}`}
                          className="btn-view-link"
                        >
                          <button className="btn btn-view">
                            <FaEye />
                          </button>
                        </Link>

                        {/* Edit category button */}
                        <Link
                          to={`/${lang}/dashboard/categories/update/${category._id}`}
                          className="btn-edit-link"
                        >
                          <button className="btn btn-edit">
                            <MdEditSquare />
                          </button>
                        </Link>

                        {/* Delete category button */}
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
                // Show message if no categories found
                <tr className="no-data">
                  <td colSpan={5}>
                    {t("dashboard.categories.noCategoriesFound")}
                  </td>
                </tr>
              )}

              {/* Bottom loading indicator for infinite scroll */}
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
