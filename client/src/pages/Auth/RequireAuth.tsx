import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Cookie from "cookie-universal";
import { GET_ME, USERS } from "../../Api/Api";
import Loading from "../../components/Loading/Loading";
import { Axios } from "../../Api/axios";
import { RequireAuthProps, UserSchema } from "../../Types/app";




function RequireAuth({ allowedRole }: RequireAuthProps) {
  // User
  const [user, setUser] = useState<UserSchema | null>(null);

  // Token & Cookie
  const cookie = Cookie();
  const token = cookie.get("ECT");
  const location = useLocation();

  // Navigate
  const navigate = useNavigate();

  useEffect(() => {
    Axios.get(`${USERS}${GET_ME}`)
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        navigate("/login", {
          replace: true,
          state: { path: location.pathname },
        });
      });
  }, []);
  return token ? (
    user === null ? (
      <Loading />
    ) : allowedRole.includes(user.role) ? (
      <Outlet />
    ) : (
      <Navigate to="/forbidden" replace={true} />
    )
  ) : (
    <Navigate to="/login" replace={true} state={{ path: location.pathname }} />
  );
}

export default RequireAuth;
