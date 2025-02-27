import Cookie from "cookie-universal";
import { Outlet } from "react-router-dom";
function RequireBack() {
  const cookie = Cookie();
  const token = cookie.get("ECT");

  if (token) {
    window.history.back();
    return null;
  }
  return <Outlet />;
}

export default RequireBack;
