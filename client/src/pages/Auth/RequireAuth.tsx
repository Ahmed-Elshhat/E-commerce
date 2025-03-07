import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Cookie from "cookie-universal";
import { GET_ME } from "../../Api/Api";
import Loading from "../../components/Loading/Loading";
import { Axios } from "../../Api/axios";
import { RequireAuthProps, UserSchema } from "../../Types/app";
import { useAppSelector } from "../../Redux/app/hooks";
function RequireAuth({ allowedRole }: RequireAuthProps) {
  // User
  const [user, setUser] = useState<UserSchema | null>(null);

  // Language
  const { lang } = useAppSelector((state) => state.language);

  // Token & Cookie
  const cookie = Cookie();
  const token = cookie.get("ECT");
  const location = useLocation();

  // Navigate
  const navigate = useNavigate();

  useEffect(() => {
    if (!lang) return;
    Axios.get(`${GET_ME}`)
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        navigate(`/${lang}/login`, {
          replace: true,
          state: { path: location.pathname },
        });
      });
  }, [lang]);
  return token ? (
    user === null ? (
      <Loading transparent={false} />
    ) : allowedRole.includes(user.role) ? (
      <Outlet />
    ) : (
      <Navigate to={`${lang ?? "en"}/forbidden`} replace={true} />
    )
  ) : (
    <Navigate
      to={`${lang ?? "en"}/login`}
      replace={true}
      state={{ path: location.pathname }}
    />
  );
}

export default RequireAuth;
