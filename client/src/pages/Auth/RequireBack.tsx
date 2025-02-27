import Cookie from "cookie-universal";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
function RequireBack() {
  const cookie = Cookie();
  const token = cookie.get("ECT");
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate(-1);
    }
  }, [token, navigate]);
  return token ? null : <Outlet />;
}

export default RequireBack;
