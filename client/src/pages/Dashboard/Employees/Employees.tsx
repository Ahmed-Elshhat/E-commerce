// import { useCallback, useEffect, useState } from "react";
// import { Axios } from "../../../Api/axios";
// import { USERS } from "../../../Api/Api";
// import { UserSchema } from "../../../Types/app";
// import { FaEye, FaTrash } from "react-icons/fa";
// import { Link } from "react-router-dom";
// import { useAppSelector } from "../../../Redux/app/hooks";
// import { useTranslation } from "react-i18next";
// import Loading from "../../../components/Loading/Loading";
// import CopyButton from "../../../components/CopyButton/CopyButton";
// import "./Employees.scss";

// function Employees() {
//   // Initialize state for employees and pagination results
//   const [employees, setEmployees] = useState<UserSchema[]>([]);
//   const { lang } = useAppSelector((state) => state.language);  // Get language from Redux
//   const { t } = useTranslation();  // Translation hook from i18next
//   const [paginationResults, setPaginationResults] = useState({
//     next: 1,
//     numberOfPages: 1,
//   });
//   const [loading, setLoading] = useState({
//     status: true,
//     type: "normal", // Normal loading state
//   });

//   // useEffect to load employees data when the component mounts
//   useEffect(() => {
//     const getEmployees = async () => {
//       setLoading({ status: true, type: "normal" });

//       try {
//         const res = await Axios.get(`${USERS}?page=1&limit=10`);
//         if (res.status === 200) {
//           // On success, set employees and pagination data
//           setLoading({ status: false, type: "normal" });
//           setEmployees(res.data.data);
//           setPaginationResults(res.data.paginationResults);
//         }
//       } catch (err) {
//         setLoading({ status: false, type: "normal" });
//         console.log(err); // Log error to console
//       }
//     };
//     getEmployees();
//   }, []);  // Empty dependency array ensures it runs once when the component mounts

//   // Callback function to load more employees when scrolling
//   const fetchMoreEmployees = useCallback(async () => {
//     if (
//       loading.status ||
//       paginationResults.next > paginationResults.numberOfPages ||
//       !paginationResults.next
//     )
//       return;  // Return early if there's ongoing loading or no more pages

//     // Check if scrolled to the bottom of the page
//     if (
//       window.innerHeight + window.scrollY >=
//       document.documentElement.scrollHeight - (window.scrollX <= 710 ? 500 : 300)
//     ) {
//       setLoading({ status: true, type: "bottom" });
//       try {
//         const res = await Axios.get(
//           `${USERS}?page=${paginationResults.next}&limit=10`
//         );
//         if (res.status === 200) {
//           // On success, append new employees to the existing list
//           setLoading({ status: false, type: "bottom" });
//           setEmployees((prev) => [...prev, ...res.data.data]);
//           setPaginationResults(res.data.paginationResults);
//         }
//       } catch (err) {
//         setLoading({ status: false, type: "bottom" });
//         console.log(err); // Log error to console
//       }
//     }
//   }, [loading, paginationResults]);

//   // Add scroll event listener to trigger fetchMoreEmployees when user scrolls
//   useEffect(() => {
//     window.addEventListener("scroll", fetchMoreEmployees);
//     return () => window.removeEventListener("scroll", fetchMoreEmployees);
//   }, [fetchMoreEmployees]);

//   // Function to calculate the shift duration
//   function calculateShiftDuration(
//     start: { hour: number; minutes: number },
//     end: { hour: number; minutes: number }
//   ): string {
//     // Return default value if any time data is missing
//     if (
//       start.hour === null ||
//       start.minutes === null ||
//       end.hour === null ||
//       end.minutes === null
//     ) {
//       return `0h 0m`;
//     }

//     // Convert start and end times to total minutes
//     const startTotalMinutes = start.hour * 60 + start.minutes;
//     const endTotalMinutes = end.hour * 60 + end.minutes;

//     let durationMinutes;
//     if (endTotalMinutes >= startTotalMinutes) {
//       // Normal case: end time is after start time
//       durationMinutes = endTotalMinutes - startTotalMinutes;
//     } else {
//       // Edge case: end time is on the next day (wrap around midnight)
//       durationMinutes = 24 * 60 - startTotalMinutes + endTotalMinutes;
//     }

//     const hours = Math.floor(durationMinutes / 60);  // Calculate hours
//     const minutes = durationMinutes % 60;  // Calculate remaining minutes

//     return `${hours}${t("dashboard.employees.hour")} ${minutes}${t(
//       "dashboard.employees.minute"
//     )}`;
//   }

//   // Function to delete an employee
//   const handleDelete = async (id: string) => {
//     setLoading({ status: true, type: "normal" });
//     try {
//       const res = await Axios.delete(`${USERS}/${id}`);
//       if (res.status === 204) {
//         // On success, remove employee from the list
//         setEmployees(employees.filter((emp) => emp._id !== id));
//         setLoading({ status: false, type: "normal" });
//       }
//     } catch (err) {
//       setLoading({ status: false, type: "normal" });
//       console.error(err); // Log error to console
//     }
//   };

//   return (
//     <div className="employees">
//       {loading.status && loading.type === "normal" && (
//         <Loading transparent={false} />  // Show loading spinner while fetching data
//       )}
//       <div className="employees-container">
//         <div className="table-wrapper">
//           <table className="custom-table">
//             <thead>
//               <tr>
//                 <th>ID</th>
//                 <th>{t("dashboard.employees.name")}</th>
//                 <th>{t("dashboard.employees.role")}</th>
//                 <th>{t("dashboard.employees.shift")}</th>
//                 <th>{t("dashboard.employees.actions")}</th>
//               </tr>
//             </thead>
//             <tbody>
//               {employees.length > 0 ? (
//                 employees.map((emp, index) => (
//                   <tr key={`${emp._id}-${index}`}>
//                     <td data-label="ID">
//                       {" "}
//                       <CopyButton couponId={emp._id} /> {/* Copy Button for Employee ID */}
//                     </td>
//                     <td data-label={t("dashboard.employees.name")}>
//                       {emp.name}
//                     </td>
//                     <td data-label={t("dashboard.employees.role")}>
//                       {emp.role === "employee" &&
//                         t("dashboard.employees.employee")}
//                     </td>
//                     <td data-label={t("dashboard.employees.shift")}>
//                       {calculateShiftDuration(emp.startShift, emp.endShift)}
//                     </td>
//                     <td data-label={t("dashboard.employees.actions")}>
//                       <div className="action-buttons">
//                         {/* Link to show employee details */}
//                         <Link
//                           to={`/${lang}/dashboard/employees/show/${emp._id}`}
//                           className="btn-view-link"
//                         >
//                           <button className="btn btn-view">
//                             <FaEye />
//                           </button>
//                         </Link>
//                         {/* Button to delete the employee */}
//                         <button
//                           className="btn btn-delete"
//                           onClick={() => handleDelete(emp._id)}
//                         >
//                           <FaTrash />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr className="no-data">
//                   <td colSpan={5}>
//                     {t("dashboard.employees.noEmployeesFound")}
//                   </td>
//                 </tr>
//               )}

//               {/* Loading spinner at the bottom when fetching more employees */}
//               {loading.status && loading.type === "bottom" && (
//                 <tr>
//                   <td colSpan={5}>
//                     <div className="loading-bottom"></div>
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Employees;


import { useCallback, useEffect, useState, useMemo } from "react";
import { Axios } from "../../../Api/axios";
import { USERS } from "../../../Api/Api";
import { UserSchema } from "../../../Types/app";
import { FaEye, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../../Redux/app/hooks";
import { useTranslation } from "react-i18next";
import Loading from "../../../components/Loading/Loading";
import CopyButton from "../../../components/CopyButton/CopyButton";
import "./Employees.scss";

// Define a type for the loading state to improve TypeScript safety
type LoadingState = {
  status: boolean;
  type: "normal" | "bottom";
};

function Employees() {
  const [employees, setEmployees] = useState<UserSchema[]>([]);
  const { lang } = useAppSelector((state) => state.language); // Get language from Redux
  const { t } = useTranslation(); // Translation hook from i18next
  const [paginationResults, setPaginationResults] = useState({
    next: 1,
    numberOfPages: 1,
  });
  const [loading, setLoading] = useState<LoadingState>({
    status: true,
    type: "normal", // Normal loading state
  });
  const [error, setError] = useState<string | null>(null); // State to handle errors

  // useEffect to load employees data when the component mounts
  useEffect(() => {
    const getEmployees = async () => {
      setLoading({ status: true, type: "normal" });
      setError(null); // Clear any previous errors
      try {
        const res = await Axios.get(`${USERS}?page=1&limit=10`);
        if (res.status === 200) {
          // On success, set employees and pagination data
          setLoading({ status: false, type: "normal" });
          setEmployees(res.data.data);
          setPaginationResults(res.data.paginationResults);
        }
      } catch (err) {
        setLoading({ status: false, type: "normal" });
        console.error(err);
        setError(t("dashboard.employees.errorLoadingData")); // Display user-friendly error message
      }
    };
    getEmployees();
  }, [t]); // Adding t in dependency array to ensure translations are updated

  // Callback function to load more employees when scrolling
  const fetchMoreEmployees = useCallback(async () => {
    if (
      loading.status ||
      paginationResults.next > paginationResults.numberOfPages ||
      !paginationResults.next
    )
      return; // Return early if there's ongoing loading or no more pages

    // Check if scrolled to the bottom of the page
    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - (window.scrollX <= 710 ? 500 : 300)
    ) {
      setLoading({ status: true, type: "bottom" });
      try {
        const res = await Axios.get(
          `${USERS}?page=${paginationResults.next}&limit=10`
        );
        if (res.status === 200) {
          // On success, append new employees to the existing list
          setLoading({ status: false, type: "bottom" });
          setEmployees((prev) => [...prev, ...res.data.data]);
          setPaginationResults(res.data.paginationResults);
        }
      } catch (err) {
        setLoading({ status: false, type: "bottom" });
        console.error(err);
        setError(t("dashboard.employees.errorLoadingData")); // Display error message
      }
    }
  }, [loading, paginationResults, t]); // Adding t to the dependency array to ensure it updates correctly

  // Add scroll event listener to trigger fetchMoreEmployees when user scrolls
  useEffect(() => {
    window.addEventListener("scroll", fetchMoreEmployees);
    return () => window.removeEventListener("scroll", fetchMoreEmployees);
  }, [fetchMoreEmployees]);

  // Function to calculate the shift duration using useMemo to avoid recalculating unnecessarily
  const calculateShiftDuration = useMemo(
    () => (start: { hour: number; minutes: number }, end: { hour: number; minutes: number }) => {
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

      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      return `${hours}${t("dashboard.employees.hour")} ${minutes}${t("dashboard.employees.minute")}`;
    },
    [t] // Recalculate only when translation changes
  );

  // Function to delete an employee
  const handleDelete = async (id: string) => {
    setLoading({ status: true, type: "normal" });
    try {
      const res = await Axios.delete(`${USERS}/${id}`);
      if (res.status === 204) {
        // On success, remove employee from the list
        setEmployees(employees.filter((emp) => emp._id !== id));
        setLoading({ status: false, type: "normal" });
      }
    } catch (err) {
      setLoading({ status: false, type: "normal" });
      console.error(err);
      setError(t("dashboard.employees.errorDeletingEmployee")); // Display error message
    }
  };

  return (
    <div className="employees">
      {loading.status && loading.type === "normal" && (
        <Loading transparent={false} /> // Show loading spinner while fetching data
      )}
      <div className="employees-container">
        {error && <div className="error-message">{error}</div>} {/* Display error message */}
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
                      <CopyButton couponId={emp._id} /> {/* Copy Button for Employee ID */}
                    </td>
                    <td data-label={t("dashboard.employees.name")}>{emp.name}</td>
                    <td data-label={t("dashboard.employees.role")}>
                      {emp.role === "employee" && t("dashboard.employees.employee")}
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
                          <button className="btn btn-view" aria-label="View Employee Details">
                            <FaEye />
                          </button>
                        </Link>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(emp._id)}
                          aria-label="Delete Employee"
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

              {/* Loading spinner at the bottom when fetching more employees */}
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
