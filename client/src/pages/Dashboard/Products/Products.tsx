import { useCallback, useEffect, useState } from "react";
import { ProductSchema } from "../../../Types/app";
import "./Products.scss";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../../Redux/app/hooks";
import { PRODUCTS } from "../../../Api/Api";
import { Axios } from "../../../Api/axios";
import CopyButton from "../../../components/CopyButton/CopyButton";
import { FaEye, FaTrash } from "react-icons/fa";
import Loading from "../../../components/Loading/Loading";
import { Link } from "react-router-dom";
import { MdEditSquare } from "react-icons/md";

function Products() {
  const [paginationResults, setPaginationResults] = useState({
    next: 1,
    numberOfPages: 1,
  });
  const [products, setProducts] = useState<ProductSchema[]>([]);
  const { lang } = useAppSelector((state) => state.language);
  const [loading, setLoading] = useState({
    status: true,
    type: "normal",
  });
  const { t, i18n } = useTranslation();
  useEffect(() => {
    const getProducts = async () => {
      setLoading({ status: true, type: "normal" });

      try {
        const res = await Axios.get(`${PRODUCTS}?page=1&limit=10`);
        if (res.status === 200) {
          setLoading({ status: false, type: "normal" });
          setProducts(res.data.data);
          setPaginationResults(res.data.paginationResults);
          console.log(res.data);
        }
      } catch (err) {
        setLoading({ status: false, type: "normal" });
        console.log(err);
      }
    };
    getProducts();
  }, []);

  const fetchMoreProducts = useCallback(async () => {
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
          `${PRODUCTS}?page=${paginationResults.next}&limit=10`
        );
        if (res.status === 200) {
          setLoading({ status: false, type: "bottom" });
          setProducts((prev) => [...prev, ...res.data.data]);
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
    window.addEventListener("scroll", fetchMoreProducts);
    return () => window.removeEventListener("scroll", fetchMoreProducts);
  }, [fetchMoreProducts]);

  const handleDelete = async (id: string) => {
    setLoading({ status: true, type: "normal" });
    try {
      const res = await Axios.delete(`${PRODUCTS}/${id}`);
      if (res.status === 204) {
        setProducts(products.filter((product) => product._id !== id));
        setLoading({ status: false, type: "normal" });
        console.log(res.data);
      }
    } catch (err) {
      setLoading({ status: false, type: "normal" });
      console.error(err);
    }
  };

  return (
    <div className="products">
      {loading.status && loading.type === "normal" && (
        <Loading transparent={false} />
      )}
      <div className="products-container">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("dashboard.products.title")}</th>
                <th>{t("dashboard.products.price")}</th>
                <th>{t("dashboard.products.quantity")}</th>
                <th>{t("dashboard.products.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product, index) => (
                  <tr key={`${product._id}-${index}`}>
                    <td data-label="ID">
                      {" "}
                      <CopyButton couponId={product._id} />
                    </td>
                    <td data-label={t("dashboard.products.title")}>
                      {i18n.language === "ar" ? product.titleAr : product.titleEn}
                    </td>

                    <td data-label={t("dashboard.products.price")}>
                      {product.price}
                    </td>

                    <td data-label={t("dashboard.products.quantity")}>
                      {product.quantity}
                    </td>

                    <td data-label={t("dashboard.products.actions")}>
                      <div className="action-buttons">
                        <Link
                          to={`/${lang}/dashboard/products/show/${product._id}`}
                          className="btn-view-link"
                        >
                          <button className="btn btn-view">
                            <FaEye />
                          </button>
                        </Link>

                        <Link
                          to={`/${lang}/dashboard/products/update/${product._id}`}
                          className="btn-edit-link"
                        >
                          <button className="btn btn-edit">
                            <MdEditSquare />
                          </button>
                        </Link>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(product._id)}
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
                    {t("dashboard.products.noProductsFound")}
                  </td>
                </tr>
              )}

              {loading.status && loading.type === "bottom" && (
                <tr>
                  <td colSpan={5}>
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

export default Products;
