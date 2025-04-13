// React hooks and dependencies
import { useEffect, useRef, useState } from "react";
import { BASE_URL, COUPONS } from "../../../../Api/Api";
import { useTranslation } from "react-i18next";
import { RiCoupon3Fill } from "react-icons/ri";
import { CouponSchema } from "../../../../Types/app";
import { useParams } from "react-router-dom";
import { Axios } from "../../../../Api/axios";
import "./ShowCoupon.scss";

function ShowCoupon() {
  const { id } = useParams(); // Get coupon ID from URL params
  const [status, setStatus] = useState(""); // State to store coupon expiration status
  const [coupon, setCoupon] = useState<CouponSchema | null>(null); // State to store coupon details
  const { t, i18n } = useTranslation(); // i18next translation hook
  const countRef = useRef(0); // Used to prevent multiple initial status setting

  // Fetch coupon details from API on mount
  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const { data } = await Axios.get(`${BASE_URL}${COUPONS}/${id}`);
        setCoupon(data.data); // Store coupon data in state
      } catch (error) {
        console.error("Error fetching coupon:", error);
      }
    };

    fetchCoupon();
  }, [id]);

  // Update coupon expiration status every second
  useEffect(() => {
    if (!coupon) return;

    if (countRef.current === 0) {
      setStatus(getCouponStatus(coupon.expire)); // Set initial status
      countRef.current = 1;
    }

    const interval = setInterval(() => {
      const newStatus = getCouponStatus(coupon.expire); // Update status every second
      setStatus(newStatus);
    }, 1000);

    return () => {
      clearInterval(interval); // Clear interval on component unmount
    };
  }, [coupon]);

  // Format ISO date string to readable format with AM/PM
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

  // Determine coupon expiration status (remaining time or expired)
  const getCouponStatus = (expireDate: string): string => {
    const expirationTime = new Date(expireDate).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = expirationTime - currentTime;

    if (timeDiff <= 0) {
      return t("dashboard.showCoupon.remaining.expired"); // Coupon expired
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    // Build a human-readable string in the appropriate language
    let resultAr = "";

    // Handle days display
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

    // Handle hours display
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

    // Handle minutes display
    if (minutes > 0) {
      if (minutes === 1) {
        resultAr += `${t("dashboard.showCoupon.remaining.minute")} `;
      } else if (minutes === 2) {
        resultAr += `${t("dashboard.showCoupon.remaining.twoMinutes")} `;
      } else if (minutes >= 3 && minutes <= 10) {
        resultAr += `${minutes} ${t("dashboard.showCoupon.remaining.minutes")} `;
      } else {
        resultAr += `${minutes} ${t("dashboard.showCoupon.remaining.minute")} `;
      }
    }

    // Handle seconds display
    if (days !== 0 || hours !== 0 || minutes !== 0 || seconds > -1) {
      if (seconds === 1) {
        resultAr += `${t("dashboard.showCoupon.remaining.second")} `;
      } else if (seconds === 2) {
        resultAr += `${t("dashboard.showCoupon.remaining.twoSeconds")} `;
      } else if (seconds >= 3 && seconds <= 10) {
        resultAr += `${seconds} ${t("dashboard.showCoupon.remaining.seconds")} `;
      } else {
        resultAr += `${seconds} ${t("dashboard.showCoupon.remaining.second")} `;
      }
    }

    return resultAr.trim().replace(/ (و|and)$/, ""); // Remove trailing 'and' if exists
  };

  // Show loading while coupon data is being fetched
  if (!coupon)
    return <div className="loading">{t("dashboard.showCoupon.loading")}</div>;

  return (
    <div className="show-coupon">
      {/* عنوان الصفحة مع أيقونة الكوبون */}
      <h2>
        {t("dashboard.showCoupon.couponDetails")} <RiCoupon3Fill />
      </h2>
  
      {/* جدول يعرض تفاصيل الكوبون */}
      <table
        className="coupon-table"
        // يدعم اللغة العربية من خلال محاذاة النص لليمين عند الحاجة
        style={{ textAlign: i18n.language === "ar" ? "right" : "left" }}
      >
        <thead>
          <tr>
            {/* رأس الجدول: أسماء الأعمدة */}
            <th>{t("dashboard.showCoupon.field")}</th>
            <th>{t("dashboard.showCoupon.details")}</th>
          </tr>
        </thead>
        <tbody>
          {/* صف رقم التعريف (ID) */}
          <tr>
            <td>{t("dashboard.showCoupon.id")}</td>
            <td data-label={t("dashboard.showCoupon.id")}>{coupon._id}</td>
          </tr>
  
          {/* صف اسم الكوبون */}
          <tr>
            <td>{t("dashboard.showCoupon.name")}</td>
            <td data-label={t("dashboard.showCoupon.name")}>{coupon.name}</td>
          </tr>
  
          {/* صف نسبة الخصم */}
          <tr>
            <td>{t("dashboard.showCoupon.discount")}</td>
            <td data-label={t("dashboard.showCoupon.discount")}>
              {coupon.discount}%
            </td>
          </tr>
  
          {/* صف تاريخ الانتهاء */}
          <tr>
            <td>{t("dashboard.showCoupon.expire")}</td>
            <td data-label={t("dashboard.showCoupon.expire")}>
              {formatDateTime(coupon.expire)}
            </td>
          </tr>
  
          {/* صف الوقت المتبقي قبل انتهاء الكوبون */}
          <tr>
            <td>{t("dashboard.showCoupon.remaining.remaining")}</td>
            <td data-label={t("dashboard.showCoupon.remaining.remaining")}>
              {status}
            </td>
          </tr>
  
          {/* صف تاريخ الإنشاء */}
          <tr>
            <td>{t("dashboard.showCoupon.createdAt")}</td>
            <td data-label={t("dashboard.showCoupon.createdAt")}>
              {coupon.createdAt
                ? new Date(coupon.createdAt).toLocaleDateString()
                : t("dashboard.showCoupon.notAvailable")}
            </td>
          </tr>
  
          {/* صف تاريخ آخر تحديث */}
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
