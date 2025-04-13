import { useCallback, useEffect, useState } from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import { useAppSelector } from "../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { MdEditSquare } from "react-icons/md";
import { CouponSchema } from "../../../Types/app";
import { COUPONS } from "../../../Api/Api";
import { Axios } from "../../../Api/axios";
import { Link } from "react-router-dom";
import Loading from "../../../components/Loading/Loading";
import CopyButton from "../../../components/CopyButton/CopyButton";
import "./Coupons.scss";

function Coupons() {
  // State to hold pagination results (page number and total pages)
  const [paginationResults, setPaginationResults] = useState({
    next: 1, // Current page
    numberOfPages: 1, // Total number of pages
  });

  // State to hold the coupon data
  const [coupons, setCoupons] = useState<CouponSchema[]>([]);

  // Accessing the language setting from the Redux store
  const { lang } = useAppSelector((state) => state.language);

  // State to manage loading status and type (normal or bottom of the page)
  const [loading, setLoading] = useState({
    status: true,
    type: "normal",
  });

  // Translation hook for localization
  const { t } = useTranslation();

  // useEffect to fetch coupons on component mount
  useEffect(() => {
    const getCoupons = async () => {
      setLoading({ status: true, type: "normal" });

      try {
        const res = await Axios.get(`${COUPONS}?page=1&limit=10`);
        if (res.status === 200) {
          setLoading({ status: false, type: "normal" });
          setCoupons(res.data.data); // Set the coupons data
          setPaginationResults(res.data.paginationResults); // Set pagination results
        }
      } catch (err) {
        setLoading({ status: false, type: "normal" });
        console.log(err); // Log error for debugging
      }
    };
    getCoupons(); // Call the function to fetch coupons
  }, []); // Empty dependency array to run on mount only

  // Function to fetch more coupons when scrolled to the bottom of the page
  const fetchMoreCoupons = useCallback(async () => {
    if (
      loading.status ||
      paginationResults.next > paginationResults.numberOfPages ||
      !paginationResults.next
    )
      return;

    // Check if the user has scrolled to the bottom of the page
    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 
        (window.scrollX <= 710 ? 500 : 300) // Adjust threshold based on window width
    ) {
      setLoading({ status: true, type: "bottom" }); // Set loading state for infinite scroll
      try {
        const res = await Axios.get(
          `${COUPONS}?page=${paginationResults.next}&limit=10`
        );
        if (res.status === 200) {
          setLoading({ status: false, type: "bottom" });
          setCoupons((prev) => [...prev, ...res.data.data]); // Append new coupons to the list
          setPaginationResults(res.data.paginationResults); // Update pagination
        }
      } catch (err) {
        setLoading({ status: false, type: "bottom" });
        console.log(err); // Log error for debugging
      }
    }
  }, [loading, paginationResults]); // Dependencies for the scroll fetching function

  // useEffect to add scroll event listener for infinite scroll functionality
  useEffect(() => {
    window.addEventListener("scroll", fetchMoreCoupons); // Add event listener for scroll
    return () => window.removeEventListener("scroll", fetchMoreCoupons); // Cleanup event listener on unmount
  }, [fetchMoreCoupons]); // Rerun this effect if fetchMoreCoupons changes

  // Function to format date string into a more readable format (YYYY-MM-DD)
  const formatDateTime = (isoString: string) => {
    const formattedDate = isoString.split("T")[0]; // Extract date part from ISO string
    return `${formattedDate}`; // Return formatted date
  };

  // Function to handle the deletion of a coupon
  const handleDelete = async (id: string) => {
    setLoading({ status: true, type: "normal" }); // Set loading state while deleting
    try {
      const res = await Axios.delete(`${COUPONS}/${id}`); // Send delete request
      if (res.status === 204) { // If deletion is successful
        setCoupons(coupons.filter((coupon) => coupon._id !== id)); // Remove the deleted coupon from state
        setLoading({ status: false, type: "normal" }); // Reset loading state
      }
    } catch (err) {
      setLoading({ status: false, type: "normal" });
      console.error(err); // Log error for debugging
    }
  };

  return (
    <div className="coupons">
      {loading.status && loading.type === "normal" && (
        <Loading transparent={false} /> // Display loading component when fetching data
      )}
      <div className="coupons-container">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("dashboard.coupons.name")}</th>
                <th>{t("dashboard.coupons.discount")}</th>
                <th>{t("dashboard.coupons.expire")}</th>
                {/* <th>{t("dashboard.coupons.TheRemainingTime")}</th> */}
                <th>{t("dashboard.coupons.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length > 0 ? (
                coupons.map((coupon, index) => (
                  <tr key={`${coupon._id}-${index}`}>
                    <td data-label="ID">
                      <CopyButton couponId={coupon._id} /> {/* Button to copy coupon ID */}
                    </td>
                    <td data-label={t("dashboard.coupons.name")}>
                      {coupon.name}
                    </td>
                    <td data-label={t("dashboard.coupons.discount")}>
                      {coupon.discount}%
                    </td>
                    <td data-label={t("dashboard.coupons.expire")} className="expire">
                      {formatDateTime(coupon.expire)} {/* Format and display expiration date */}
                    </td>
                    <td data-label={t("dashboard.coupons.actions")}>
                      <div className="action-buttons">
                        <Link
                          to={`/${lang}/dashboard/coupons/show/${coupon._id}`}
                          className="btn-view-link"
                        >
                          <button className="btn btn-view">
                            <FaEye />
                          </button>
                        </Link>

                        <Link
                          to={`/${lang}/dashboard/coupons/update/${coupon._id}`}
                          className="btn-edit-link"
                        >
                          <button className="btn btn-edit">
                            <MdEditSquare />
                          </button>
                        </Link>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(coupon._id)} // Call handleDelete on click
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data">
                  <td colSpan={5}>{t("dashboard.coupons.noCouponsFound")}</td> {/* No coupons found message */}
                </tr>
              )}

              {loading.status && loading.type === "bottom" && (
                <tr>
                  <td colSpan={3}>
                    <div className="loading-bottom"></div> {/* Loading indicator for infinite scroll */}
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

export default Coupons;
