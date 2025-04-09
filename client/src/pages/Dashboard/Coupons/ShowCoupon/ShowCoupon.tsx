// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { Axios } from "../../../../Api/axios";
// import { BASE_URL, COUPONS } from "../../../../Api/Api";
// import { useTranslation } from "react-i18next";
// import "./ShowCoupon.scss";
// import { CouponSchema } from "../../../../Types/app";
// import { RiCoupon3Fill } from "react-icons/ri";

// function ShowCoupon() {
//   const { id } = useParams();
//   const [coupon, setCoupon] = useState<CouponSchema | null>(null);
//   const { t, i18n } = useTranslation();

//   useEffect(() => {
//     const fetchCoupon = async () => {
//       try {
//         const { data } = await Axios.get(`${BASE_URL}${COUPONS}/${id}`);
//         setCoupon(data.data);
//         console.log("Coupon fetched successfully:", data.data);
//       } catch (error) {
//         console.error("Error fetching coupon:", error);
//       }
//     };

//     fetchCoupon();
//   }, [id]);

//     const formatDateTime = (isoString: string) => {
//     const date = new Date(isoString);

//     const formattedDate = isoString.split("T")[0];

//     let hours = date.getHours();
//     const minutes = date.getMinutes().toString().padStart(2, "0");
//     const period =
//       hours >= 12 ? t("dashboard.showCoupon.PM") : t("dashboard.showCoupon.AM");

//     hours = hours % 12 || 12;

//     return `${formattedDate} (${hours}:${minutes} ${period})`;
//   };

//   const getCouponStatus = (expireDate: string): string => {
//     const expirationTime = new Date(expireDate).getTime(); // تحويل تاريخ الانتهاء إلى Milliseconds
//     const currentTime = new Date().getTime(); // الوقت الحالي
//     const timeDiff = expirationTime - currentTime; // الفرق بين التاريخين بالميلي ثانية

//     if (timeDiff <= 0) {
//       return t("dashboard.showCoupon.remaining.expired");
//     }

//     const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
//     const hours = Math.floor(
//       (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
//     );
//     const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

//     let resultAr = "";

//     if (days > 0) {
//       if (days === 1) {
//         resultAr += `${t("dashboard.showCoupon.remaining.day")} `;
//       } else if (days === 2) {
//         resultAr += `${t("dashboard.showCoupon.remaining.twoDays")} `;
//       } else if (days >= 3 && days <= 10) {
//         resultAr += `${days} ${t("dashboard.showCoupon.remaining.days")} `;
//       } else {
//         resultAr += `${days} ${t("dashboard.showCoupon.remaining.day")} `;
//       }
//     }
//     if (hours > 0) {
//       if (hours === 1) {
//         resultAr += `${t("dashboard.showCoupon.remaining.hour")} `;
//       } else if (hours === 2) {
//         resultAr += `${t("dashboard.showCoupon.remaining.twoHours")} `;
//       } else if (hours >= 3 && hours <= 10) {
//         resultAr += `${hours} ${t("dashboard.showCoupon.remaining.hours")} `;
//       } else {
//         resultAr += `${hours} ${t("dashboard.showCoupon.remaining.hour")} `;
//       }
//     }
//     if (minutes > 0) {
//       if (minutes === 1) {
//         resultAr += `${t("dashboard.showCoupon.remaining.minute")} `;
//       } else if (minutes === 2) {
//         resultAr += `${t("dashboard.showCoupon.remaining.twoMinutes")} `;
//       } else if (minutes >= 3 && minutes <= 10) {
//         resultAr += `${minutes} ${t("dashboard.showCoupon.remaining.minutes")}  `;
//       } else {
//         resultAr += `${minutes} ${t("dashboard.showCoupon.remaining.minute")}  `;
//       }
//     }

//     return resultAr.trim().replace(/ (و|and) $/, "");
//   };

//   if (!coupon)
//     return <div className="loading">{t("dashboard.showCoupon.loading")}</div>;

//   return (
//     <div className="show-coupon">
//       <h2>
//         {t("dashboard.showCoupon.couponDetails")} <RiCoupon3Fill />
//       </h2>
//       <table
//         className="coupon-table"
//         style={{ textAlign: i18n.language === "ar" ? "right" : "left" }}
//       >
//         <thead>
//           <tr>
//             <th>{t("dashboard.showCoupon.field")}</th>
//             <th>{t("dashboard.showCoupon.details")}</th>
//           </tr>
//         </thead>
//         <tbody>
//           <tr>
//             <td>{t("dashboard.showCoupon.id")}</td>
//             <td data-label={t("dashboard.showCoupon.id")}>{coupon._id}</td>
//           </tr>
//           <tr>
//             <td>{t("dashboard.showCoupon.name")}</td>
//             <td data-label={t("dashboard.showCoupon.name")}>{coupon.name}</td>
//           </tr>
//           <tr>
//             <td>{t("dashboard.showCoupon.discount")}</td>
//             <td data-label={t("dashboard.showCoupon.discount")}>{coupon. discount}%</td>
//           </tr>
//           <tr>
//             <td>{t("dashboard.showCoupon.expire")}</td>
//             <td data-label={t("dashboard.showCoupon.expire")}>
//               {formatDateTime(coupon.expire)}
//             </td>
//           </tr>
//           <tr>
//             <td>{t("dashboard.showCoupon.remaining.remaining")}</td>
//             <td data-label={t("dashboard.showCoupon.remaining.remaining")}>
//               {getCouponStatus(coupon.expire)}
//             </td>
//           </tr>
//           <tr>
//             <td>{t("dashboard.showCoupon.createdAt")}</td>
//             <td data-label={t("dashboard.showCoupon.createdAt")}>
//               {coupon.createdAt
//                 ? new Date(coupon.createdAt).toLocaleDateString()
//                 : t("dashboard.showCoupon.notAvailable")}
//             </td>
//           </tr>
//           <tr>
//             <td>{t("dashboard.showCoupon.updatedAt")}</td>
//             <td data-label={t("dashboard.showCoupon.updatedAt")}>
//               {coupon.updatedAt
//                 ? new Date(coupon.updatedAt).toLocaleDateString()
//                 : t("dashboard.showCoupon.notAvailable")}
//             </td>
//           </tr>
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default ShowCoupon;
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Axios } from "../../../../Api/axios";
import { BASE_URL, COUPONS } from "../../../../Api/Api";
import { useTranslation } from "react-i18next";
import "./ShowCoupon.scss";
import { CouponSchema } from "../../../../Types/app";
import { RiCoupon3Fill } from "react-icons/ri";

function ShowCoupon() {
  const { id } = useParams();
  const [status, setStatus] = useState("");
  const [coupon, setCoupon] = useState<CouponSchema | null>(null);
  const { t, i18n } = useTranslation();
  const countRef = useRef(0);

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const { data } = await Axios.get(`${BASE_URL}${COUPONS}/${id}`);
        setCoupon(data.data);
        console.log("Coupon fetched successfully:", data.data);
      } catch (error) {
        console.error("Error fetching coupon:", error);
      }
    };

    fetchCoupon();
  }, [id]);

  useEffect(() => {
    if (!coupon) return;

    if (countRef.current === 0) {
      setStatus(getCouponStatus(coupon.expire));
      countRef.current = 1;
    }

    const interval = setInterval(() => {
      const newStatus = getCouponStatus(coupon.expire);
      setStatus(newStatus);
    }, 1000); // تحديث كل ثانية

    return () => {
      clearInterval(interval); // تنظيف عند التفكيك
    };
  }, [coupon]);

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);

    const formattedDate = isoString.split("T")[0];

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const period =
      hours >= 12 ? t("dashboard.showCoupon.PM") : t("dashboard.showCoupon.AM");

    hours = hours % 12 || 12;

    return `${formattedDate} (${hours}:${minutes} ${period})`;
  };

  const getCouponStatus = (expireDate: string): string => {
    const expirationTime = new Date(expireDate).getTime(); // تحويل تاريخ الانتهاء إلى Milliseconds
    const currentTime = new Date().getTime(); // الوقت الحالي
    const timeDiff = expirationTime - currentTime; // الفرق بين التاريخين بالميلي ثانية

    if (timeDiff <= 0) {
      return t("dashboard.showCoupon.remaining.expired");
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    let resultAr = "";

    if (days > 0) {
      if (days === 1) {
        resultAr += `${t("dashboard.showCoupon.remaining.day")} `;
      } else if (days === 2) {
        resultAr += `${t("dashboard.showCoupon.remaining.twoDays")} `;
      } else if (days >= 3 && days <= 10) {
        resultAr += `${days} ${t("dashboard.showCoupon.remaining.days")} `;
      } else {
        resultAr += `${days} ${t("dashboard.showCoupon.remaining.day")} `;
      }
    }

    if (hours > 0) {
      if (hours === 1) {
        resultAr += `${t("dashboard.showCoupon.remaining.hour")} `;
      } else if (hours === 2) {
        resultAr += `${t("dashboard.showCoupon.remaining.twoHours")} `;
      } else if (hours >= 3 && hours <= 10) {
        resultAr += `${hours} ${t("dashboard.showCoupon.remaining.hours")} `;
      } else {
        resultAr += `${hours} ${t("dashboard.showCoupon.remaining.hour")} `;
      }
    }

    if (minutes > 0) {
      if (minutes === 1) {
        resultAr += `${t("dashboard.showCoupon.remaining.minute")} `;
      } else if (minutes === 2) {
        resultAr += `${t("dashboard.showCoupon.remaining.twoMinutes")} `;
      } else if (minutes >= 3 && minutes <= 10) {
        resultAr += `${minutes} ${t(
          "dashboard.showCoupon.remaining.minutes"
        )} `;
      } else {
        resultAr += `${minutes} ${t("dashboard.showCoupon.remaining.minute")} `;
      }
    }

    if (days !== 0 || hours !== 0 || minutes !== 0 || seconds > -1) {
      if (seconds === 1) {
        resultAr += `${t("dashboard.showCoupon.remaining.second")} `;
      } else if (seconds === 2) {
        resultAr += `${t("dashboard.showCoupon.remaining.twoSeconds")} `;
      } else if (seconds >= 3 && seconds <= 10) {
        resultAr += `${seconds} ${t(
          "dashboard.showCoupon.remaining.seconds"
        )} `;
      } else {
        resultAr += `${seconds} ${t("dashboard.showCoupon.remaining.second")} `;
      }
    }

    return resultAr.trim().replace(/ (و|and)$/, "");
  };

  if (!coupon)
    return <div className="loading">{t("dashboard.showCoupon.loading")}</div>;

  return (
    <div className="show-coupon">
      <h2>
        {t("dashboard.showCoupon.couponDetails")} <RiCoupon3Fill />
      </h2>
      <table
        className="coupon-table"
        style={{ textAlign: i18n.language === "ar" ? "right" : "left" }}
      >
        <thead>
          <tr>
            <th>{t("dashboard.showCoupon.field")}</th>
            <th>{t("dashboard.showCoupon.details")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t("dashboard.showCoupon.id")}</td>
            <td data-label={t("dashboard.showCoupon.id")}>{coupon._id}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showCoupon.name")}</td>
            <td data-label={t("dashboard.showCoupon.name")}>{coupon.name}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showCoupon.discount")}</td>
            <td data-label={t("dashboard.showCoupon.discount")}>
              {coupon.discount}%
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showCoupon.expire")}</td>
            <td data-label={t("dashboard.showCoupon.expire")}>
              {formatDateTime(coupon.expire)}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showCoupon.remaining.remaining")}</td>
            <td data-label={t("dashboard.showCoupon.remaining.remaining")}>
              {status}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showCoupon.createdAt")}</td>
            <td data-label={t("dashboard.showCoupon.createdAt")}>
              {coupon.createdAt
                ? new Date(coupon.createdAt).toLocaleDateString()
                : t("dashboard.showCoupon.notAvailable")}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showCoupon.updatedAt")}</td>
            <td data-label={t("dashboard.showCoupon.updatedAt")}>
              {coupon.updatedAt
                ? new Date(coupon.updatedAt).toLocaleDateString()
                : t("dashboard.showCoupon.notAvailable")}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ShowCoupon;
