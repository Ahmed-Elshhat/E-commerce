import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Axios } from "../../../../Api/axios";
import { BASE_URL, USERS } from "../../../../Api/Api";
import { FaUser } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { UserSchema } from "../../../../Types/app";
import "./ShowEmployee.scss";

function ShowEmployee() {
  const { id } = useParams(); // Get the user ID from URL parameters
  const [user, setUser] = useState<UserSchema | null>(null); // Local state to store the user data
  const { t, i18n } = useTranslation(); // Translation hook for i18n support

  useEffect(() => {
    // Fetch user data from API on component mount
    const fetchUser = async () => {
      try {
        const { data } = await Axios.get(`${BASE_URL}${USERS}/${id}`);
        setUser(data.data); // Store user data in state
      } catch (error) {
        console.error("Error fetching user:", error); // Log any error in fetching
      }
    };

    fetchUser(); // Trigger fetch
  }, [id]); // Rerun if ID changes

  // Format time into 12-hour format with AM/PM and leading zero for minutes
  const formatTime = (hour: number, minutes: number) => {
    const period =
      hour >= 12
        ? t("dashboard.showEmployee.PM")
        : t("dashboard.showEmployee.AM");
    const adjustedHour = hour % 12 || 12;
    const paddedMinutes = minutes.toString().padStart(2, "0");
    return `${adjustedHour}:${paddedMinutes} ${period}`;
  };

  // Calculate the difference between start and end shift times
  const calculateShiftHours = (
    start: { hour: number; minutes: number },
    end: { hour: number; minutes: number }
  ): string => {
    const startMinutes = start.hour * 60 + start.minutes;
    const endMinutes = end.hour * 60 + end.minutes;

    let diff = endMinutes - startMinutes;
    if (diff < 0) {
      diff += 24 * 60; // Handle shifts that cross midnight
    }

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    return `${hours} ${t("dashboard.showEmployee.hour")} ${minutes} ${t(
      "dashboard.showEmployee.minute"
    )}`;
  };

  // Show loading state if user data is not available yet
  if (!user)
    return <div className="loading">{t("dashboard.showEmployee.loading")}</div>;

  return (
    <div className="show-employee">
      <h2>
        {t("dashboard.showEmployee.userDetails")} <FaUser />
      </h2>
      <table
        className="user-table"
        style={{ textAlign: i18n.language === "ar" ? "right" : "left" }} // Change text alignment based on language direction
      >
        <thead>
          <tr>
            <th>{t("dashboard.showEmployee.field")}</th>
            <th>{t("dashboard.showEmployee.details")}</th>
          </tr>
        </thead>
        <tbody>
          {/* Display User ID */}
          <tr>
            <td>{t("dashboard.showEmployee.id")}</td>
            <td data-label={t("dashboard.showEmployee.id")}>{user._id}</td>
          </tr>

          {/* Display User Name */}
          <tr>
            <td>{t("dashboard.showEmployee.name")}</td>
            <td data-label={t("dashboard.showEmployee.name")}>{user.name}</td>
          </tr>

          {/* Display User Email */}
          <tr>
            <td>{t("dashboard.showEmployee.email")}</td>
            <td data-label={t("dashboard.showEmployee.email")}>{user.email}</td>
          </tr>

          {/* Display User Phone or fallback text */}
          <tr>
            <td>{t("dashboard.showEmployee.phone")}</td>
            <td data-label={t("dashboard.showEmployee.phone")}>
              {user.phone || t("dashboard.showEmployee.notProvided")}
            </td>
          </tr>

          {/* Display User Role */}
          <tr>
            <td>{t("dashboard.showEmployee.role")}</td>
            <td data-label={t("dashboard.showEmployee.role")}>{user.role}</td>
          </tr>

          {/* Show whether user is active */}
          <tr>
            <td>{t("dashboard.showEmployee.active")}</td>
            <td data-label={t("dashboard.showEmployee.active")}>
              {user.active
                ? t("dashboard.showEmployee.yes")
                : t("dashboard.showEmployee.no")}
            </td>
          </tr>

          {/* Show shift start time formatted */}
          <tr>
            <td>{t("dashboard.showEmployee.shiftStart")}</td>
            <td data-label={t("dashboard.showEmployee.shiftStart")}>
              {formatTime(user.startShift.hour, user.startShift.minutes)}
            </td>
          </tr>

          {/* Show shift end time formatted */}
          <tr>
            <td>{t("dashboard.showEmployee.shiftEnd")}</td>
            <td data-label={t("dashboard.showEmployee.shiftEnd")}>
              {formatTime(user.endShift.hour, user.endShift.minutes)}
            </td>
          </tr>

          {/* Show calculated working hours from shift times */}
          <tr>
            <td>{t("dashboard.showEmployee.workingHours")}</td>
            <td data-label={t("dashboard.showEmployee.workingHours")}>
              {calculateShiftHours(user.startShift, user.endShift)}
            </td>
          </tr>

          {/* Show account creation date if available */}
          <tr>
            <td>{t("dashboard.showEmployee.createdAt")}</td>
            <td data-label={t("dashboard.showEmployee.createdAt")}>
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : t("dashboard.showEmployee.notAvailable")}
            </td>
          </tr>

          {/* Show last updated date if available */}
          <tr>
            <td>{t("dashboard.showEmployee.updatedAt")}</td>
            <td data-label={t("dashboard.showEmployee.updatedAt")}>
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
