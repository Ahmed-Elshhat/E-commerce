import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ShowEmployee.scss";
import { Axios } from "../../../../Api/axios";
import { BASE_URL, USERS } from "../../../../Api/Api";
import { FaUser } from "react-icons/fa";
import { useTranslation } from "react-i18next";

function ShowEmployee() {
  const { id } = useParams();
  const [user, setUser] = useState({
    _id: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    active: false,
    startShift: {
      hour: 0,
      minutes: 0,
    },
    endShift: {
      hour: 0,
      minutes: 0,
    },
    createdAt: null,
    updatedAt: null,
  });

  const { t, i18n } = useTranslation(); // إضافة الترجمة

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await Axios.get(`${BASE_URL}${USERS}/${id}`);
        setUser(data.data);
        console.log("User fetched successfully:", data.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [id]);

  const formatTime = (hour: number, minutes: number) => {
    const period =
      hour >= 12
        ? t("dashboard.showEmployee.PM")
        : t("dashboard.showEmployee.AM");
    const adjustedHour = hour % 12 || 12;
    const paddedMinutes = minutes.toString().padStart(2, "0");
    return `${adjustedHour}:${paddedMinutes} ${period}`;
  };

  const calculateShiftHours = (
    start: { hour: number; minutes: number },
    end: { hour: number; minutes: number }
  ): string => {
    const startMinutes = start.hour * 60 + start.minutes;
    const endMinutes = end.hour * 60 + end.minutes;

    let diff = endMinutes - startMinutes;
    if (diff < 0) {
      diff += 24 * 60;
    }

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    return `${hours} ${t("dashboard.showEmployee.hour")} ${minutes} ${t(
      "dashboard.showEmployee.minute"
    )}`;
  };

  if (!user)
    return <div className="loading">{t("dashboard.showEmployee.loading")}</div>;

  return (
    <div className="show-employee">
      <h2>
        {t("dashboard.showEmployee.userDetails")} <FaUser />
      </h2>
      <table
        className="user-table"
        style={{ textAlign: i18n.language === "ar" ? "right" : "left" }}
      >
        <thead>
          <tr>
            <th>{t("dashboard.showEmployee.field")}</th>
            <th>{t("dashboard.showEmployee.details")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t("dashboard.showEmployee.id")}</td>
            <td data-label="ID">{user._id}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showEmployee.name")}</td>
            <td data-label="Name">{user.name}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showEmployee.email")}</td>
            <td data-label="Email">{user.email}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showEmployee.phone")}</td>
            <td data-label="Phone">
              {user.phone || t("dashboard.showEmployee.notProvided")}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showEmployee.role")}</td>
            <td data-label="Role">{user.role}</td>
          </tr>
          <tr>
            <td>{t("dashboard.showEmployee.active")}</td>
            <td data-label="Active">
              {user.active
                ? t("dashboard.showEmployee.yes")
                : t("dashboard.showEmployee.no")}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showEmployee.shiftStart")}</td>
            <td data-label="Shift Start Time">
              {formatTime(user.startShift.hour, user.startShift.minutes)}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showEmployee.shiftEnd")}</td>
            <td data-label="Shift End Time">
              {formatTime(user.endShift.hour, user.endShift.minutes)}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showEmployee.workingHours")}</td>
            <td data-label="Working Hours">
              {calculateShiftHours(user.startShift, user.endShift)}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showEmployee.createdAt")}</td>
            <td data-label="Created At">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : t("dashboard.showEmployee.notAvailable")}
            </td>
          </tr>
          <tr>
            <td>{t("dashboard.showEmployee.updatedAt")}</td>
            <td data-label="Updated At">
              {user.updatedAt
                ? new Date(user.updatedAt).toLocaleDateString()
                : t("dashboard.showEmployee.notAvailable")}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ShowEmployee;
