import { Outlet } from "react-router-dom";
import "./Dashboard.scss";
import SideBar from "../../components/Dashboard/SideBar/SideBar";
function Dashboard() {
  return (
    <div className="dashboard">
      <SideBar />
      <Outlet />
    </div>
  );
}

export default Dashboard;
