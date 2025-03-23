import { useCallback, useEffect, useState } from "react";
import "./Employees.scss";
import { Axios } from "../../../Api/axios";
import { USERS } from "../../../Api/Api";
import { UserSchema } from "../../../Types/app";
import { FaEye, FaTrash } from "react-icons/fa";
import Loading from "../../../components/Loading/Loading";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import CopyButton from "../../../components/CopyButton/CopyButton";

function Employees() {
  const [paginationResults, setPaginationResults] = useState({
    next: 1,
    numberOfPages: 1,
  });
  const [employees, setEmployees] = useState<UserSchema[]>([]);
  const { lang } = useAppSelector((state) => state.language);
  const [loading, setLoading] = useState({
    status: true,
    type: "normal",
  });
  const { t } = useTranslation();
  useEffect(() => {
    const getEmployees = async () => {
      setLoading({ status: true, type: "normal" });

      try {
        const res = await Axios.get(`${USERS}?page=1&limit=10`);
        if (res.status === 200) {
          setLoading({ status: false, type: "normal" });
          setEmployees(res.data.data);
          setPaginationResults(res.data.paginationResults);
          console.log(res.data);
        }
      } catch (err) {
        setLoading({ status: false, type: "normal" });
        console.log(err);
      }
    };
    getEmployees();
  }, []);

  const fetchMoreEmployees = useCallback(async () => {
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
          `${USERS}?page=${paginationResults.next}&limit=10`
        );
        if (res.status === 200) {
          setLoading({ status: false, type: "bottom" });
          setEmployees((prev) => [...prev, ...res.data.data]);
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
    window.addEventListener("scroll", fetchMoreEmployees);
    return () => window.removeEventListener("scroll", fetchMoreEmployees);
  }, [fetchMoreEmployees]);

  function calculateShiftDuration(
    start: { hour: number; minutes: number },
    end: { hour: number; minutes: number }
  ): string {
    if (
      start.hour === null ||
      start.minutes === null ||
      end.hour === null ||
      end.minutes === null
    ) {
      return `0h 0m`;
    }

    const startTotalMinutes = start.hour * 60 + start.minutes;
    const endTotalMinutes = end.hour * 60 + end.minutes;

    let durationMinutes;
    if (endTotalMinutes >= startTotalMinutes) {
      durationMinutes = endTotalMinutes - startTotalMinutes;
    } else {
      durationMinutes = 24 * 60 - startTotalMinutes + endTotalMinutes;
    }

    // تحويل المدة إلى ساعات ودقائق
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return `${hours}${t("dashboard.employees.hour")} ${minutes}${t(
      "dashboard.employees.minute"
    )}`;
  }

  const handleDelete = async (id: string) => {
    setLoading({ status: true, type: "normal" });
    try {
      const res = await Axios.delete(`${USERS}/${id}`);
      if (res.status === 204) {
        setEmployees(employees.filter((emp) => emp._id !== id));
        setLoading({ status: false, type: "normal" });
        console.log(res.data);
      }
    } catch (err) {
      setLoading({ status: false, type: "normal" });
      console.error(err);
    }
  };

  return (
    <div className="employees">
      {loading.status && loading.type === "normal" && (
        <Loading transparent={false} />
      )}
      <div className="employees-container">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("dashboard.employees.name")}</th>
                <th>{t("dashboard.employees.role")}</th>
                <th>{t("dashboard.employees.shift")}</th>
                <th>{t("dashboard.employees.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees.map((emp, index) => (
                  <tr key={`${emp._id}-${index}`}>
                    <td data-label="ID">
                      {" "}
                      <CopyButton couponId={emp._id} />
                    </td>
                    <td data-label={t("dashboard.employees.name")}>
                      {emp.name}
                    </td>
                    <td data-label={t("dashboard.employees.role")}>
                      {emp.role === "employee" &&
                        t("dashboard.employees.employee")}
                    </td>
                    <td data-label={t("dashboard.employees.shift")}>
                      {calculateShiftDuration(emp.startShift, emp.endShift)}
                    </td>
                    <td data-label={t("dashboard.employees.actions")}>
                      <div className="action-buttons">
                        <Link
                          to={`/${lang}/dashboard/employees/show/${emp._id}`}
                          className="btn-view-link"
                        >
                          <button className="btn btn-view">
                            <FaEye />
                          </button>
                        </Link>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(emp._id)}
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
                    {t("dashboard.employees.noEmployeesFound")}
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

export default Employees;
