import { useEffect, useState } from "react";
import "./Employees.scss";
import { Axios } from "../../../Api/axios";
import { USERS } from "../../../Api/Api";
import { UserSchema } from "../../../Types/app";
import { FaEye, FaTrash } from "react-icons/fa";
import Loading from "../../../components/Loading/Loading";

function Employees() {
  const [employees, setEmployees] = useState<UserSchema[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const getEmployees = async () => {
      try {
        const res = await Axios.get(`${USERS}`);
        if (res.status === 200) {
          setEmployees(res.data.data);
          console.log(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    getEmployees();
  }, []);

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const res = await Axios.delete(`${USERS}/${id}`);
      if (res.status === 204) {
        setEmployees(employees.filter((emp) => emp._id !== id));
        setLoading(false);
        console.log(res.data);
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
    }
  };

  const handleView = (id: string) => {
    console.log(`عرض التفاصيل للموظف: ${id}`);
  };
  return (
    <>
      {loading && <Loading transparent={true} />}
      <div className="employee">
        <div className="employee-container">
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>اسم الموظف</th>
                  <th>الوظيفة</th>
                  <th>الوردية</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr key={emp._id}>
                      <td data-label="ID">{emp._id}</td>
                      <td data-label="Name">{emp.name}</td>
                      <td data-label="Role">{emp.role}</td>
                      <td data-label="Shift">{emp.startShift}</td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          <button
                            className="btn btn-view"
                            onClick={() => handleView(emp._id)}
                          >
                            <FaEye />
                          </button>
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
                    <td colSpan={5}>No Employees Found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default Employees;
