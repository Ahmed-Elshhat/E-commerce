import { useCallback, useEffect, useState } from "react";
import "./Coupons.scss";
import { Axios } from "../../../Api/axios";
import { COUPONS } from "../../../Api/Api";
import { CouponSchema } from "../../../Types/app";
import { FaCheck, FaEye, FaTrash } from "react-icons/fa";
import Loading from "../../../components/Loading/Loading";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import { MdEditSquare } from "react-icons/md";
import { GoCopy } from "react-icons/go";

function Coupons() {
  const [paginationResults, setPaginationResults] = useState({
    next: 1,
    numberOfPages: 1,
  });
  const [coupons, setCoupons] = useState<CouponSchema[]>([]);
  const { lang } = useAppSelector((state) => state.language);
  const [loading, setLoading] = useState({
    status: true,
    type: "normal",
  });
  const { t } = useTranslation();
  const [copied, setCopied] = useState({
    status: false,
    id: "",
  });

  useEffect(() => {
    const getCoupons = async () => {
      setLoading({ status: true, type: "normal" });

      try {
        const res = await Axios.get(`${COUPONS}?page=1&limit=10`);
        if (res.status === 200) {
          setLoading({ status: false, type: "normal" });
          setCoupons(res.data.data);
          setPaginationResults(res.data.paginationResults);
          console.log(res.data);
        }
      } catch (err) {
        setLoading({ status: false, type: "normal" });
        console.log(err);
      }
    };
    getCoupons();
  }, []);

  const fetchMoreCoupons = useCallback(async () => {
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
          `${COUPONS}?page=${paginationResults.next}&limit=10`
        );
        if (res.status === 200) {
          setLoading({ status: false, type: "bottom" });
          setCoupons((prev) => [...prev, ...res.data.data]);
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
    window.addEventListener("scroll", fetchMoreCoupons);
    return () => window.removeEventListener("scroll", fetchMoreCoupons);
  }, [fetchMoreCoupons]);

  // const formatDateTime = (isoString: string) => {
  //   const date = new Date(isoString);

  //   const formattedDate = isoString.split("T")[0];

  //   let hours = date.getHours();
  //   const minutes = date.getMinutes().toString().padStart(2, "0");
  //   const period =
  //     hours >= 12 ? t("dashboard.coupons.PM") : t("dashboard.coupons.AM");

  //   hours = hours % 12 || 12;

  //   return `${formattedDate} (${hours}:${minutes} ${period})`;
  // };

  const formatDateTime = (isoString: string) => {
    const formattedDate = isoString.split("T")[0];
    return `${formattedDate}`;
  };

  // const getCouponStatus = (expireDate: string): string => {
  //   const expirationTime = new Date(expireDate).getTime(); // تحويل تاريخ الانتهاء إلى Milliseconds
  //   const currentTime = new Date().getTime(); // الوقت الحالي
  //   const timeDiff = expirationTime - currentTime; // الفرق بين التاريخين بالميلي ثانية

  //   if (timeDiff <= 0) {
  //     return t("dashboard.coupons.remaining.expire");
  //   }

  //   const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  //   const hours = Math.floor(
  //     (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  //   );
  //   const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  //   let resultAr = `${t("dashboard.coupons.remaining.remaining")} `;

  //   if (days > 0) {
  //     if (days === 1) {
  //       resultAr += `${t("dashboard.coupons.remaining.day")} `;
  //     } else if (days === 2) {
  //       resultAr += `${t("dashboard.coupons.remaining.twoDays")} `;
  //     } else if (days >= 3 && days <= 10) {
  //       resultAr += `${days} ${t("dashboard.coupons.remaining.days")} `;
  //     } else {
  //       resultAr += `${days} ${t("dashboard.coupons.remaining.day")} `;
  //     }
  //   }
  //   if (hours > 0) {
  //     if (hours === 1) {
  //       resultAr += `${t("dashboard.coupons.remaining.hour")} `;
  //     } else if (hours === 2) {
  //       resultAr += `${t("dashboard.coupons.remaining.twoHours")} `;
  //     } else if (hours >= 3 && hours <= 10) {
  //       resultAr += `${hours} ${t("dashboard.coupons.remaining.hours")} `;
  //     } else {
  //       resultAr += `${hours} ${t("dashboard.coupons.remaining.hour")} `;
  //     }
  //   }
  //   if (minutes > 0) {
  //     if (minutes === 1) {
  //       resultAr += `${t("dashboard.coupons.remaining.minute")} `;
  //     } else if (minutes === 2) {
  //       resultAr += `${t("dashboard.coupons.remaining.twoMinutes")} `;
  //     } else if (minutes >= 3 && minutes <= 10) {
  //       resultAr += `${minutes} ${t("dashboard.coupons.remaining.minutes")}  `;
  //     } else {
  //       resultAr += `${minutes} ${t("dashboard.coupons.remaining.minute")}  `;
  //     }
  //   }

  //   return resultAr.trim().replace(/ (و|and) $/, "");
  // };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ status: true, id: text });
      setTimeout(() => setCopied({ status: false, id: text }), 1000);
    } catch (err) {
      console.error("فشل النسخ:", err);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading({ status: true, type: "normal" });
    try {
      const res = await Axios.delete(`${COUPONS}/${id}`);
      if (res.status === 204) {
        setCoupons(coupons.filter((coupon) => coupon._id !== id));
        setLoading({ status: false, type: "normal" });
        console.log(res.data);
      }
    } catch (err) {
      setLoading({ status: false, type: "normal" });
      console.error(err);
    }
  };

  return (
    <div className="coupons">
      {loading.status && loading.type === "normal" && (
        <Loading transparent={false} />
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
                      <button
                        onClick={() => copyToClipboard(coupon._id)}
                        className={`copy-btn ${
                          copied.status && copied.id === coupon._id
                            ? "copied"
                            : ""
                        }`}
                        title={`ID: ${coupon._id}`}
                      >
                        {copied.status && copied.id === coupon._id
                          ? t("dashboard.coupons.copiedButton")
                          : t("dashboard.coupons.copyButton")}
                        {copied.status && copied.id === coupon._id ? (
                          <FaCheck />
                        ) : (
                          <GoCopy />
                        )}
                      </button>{" "}
                    </td>

                    <td data-label={t("dashboard.coupons.name")}>
                      {coupon.name}
                    </td>
                    <td data-label={t("dashboard.coupons.discount")}>
                      {coupon.discount}%
                    </td>
                    <td data-label={t("dashboard.coupons.expire")}>
                      {formatDateTime(coupon.expire)}
                    </td>
                    {/* <td data-label={t("dashboard.coupons.TheRemainingTime")}>
                      {getCouponStatus(coupon.expire)}
                    </td> */}

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
                          onClick={() => handleDelete(coupon._id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data">
                  <td colSpan={5}>{t("dashboard.coupons.noCouponsFound")}</td>
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

export default Coupons;
