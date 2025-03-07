import Cookie from "cookie-universal";
import { Outlet, useNavigate } from "react-router-dom";
import RedirectPage from "../../components/RedirectPage/RedirectPage";
import { useEffect, useState } from "react";
import { GET_ME } from "../../Api/Api";
import { Axios } from "../../Api/axios";
function RequireBack() {
  const cookie = Cookie();
  const token = cookie.get("ECT");
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();
  // Language
  const [lang, setLang] = useState<string>("");

  useEffect(() => {
    const localLang = localStorage.getItem("lang");
    if (localLang) {
      setLang(localLang);
    } else {
      setLang("en");
    }
  }, []);

  useEffect(() => {
    if (token) {
      Axios.get(`${GET_ME}`)
        .then(() => {
          setIsValidToken(true);
          navigate(`/${lang}`, { replace: true });
        })
        .catch(() => {
          setIsValidToken(false);
        });
    } else {
      setIsValidToken(false);
    }
  }, [token]);

  if (isValidToken === null) {
    return <p>Loading...</p>;
  }

  if (isValidToken) {
    return (
      <RedirectPage
        message="You are already logged in"
        dir={`/${lang}`}
        pageName="Home"
      />
    );
  }
  return <Outlet />;
}

export default RequireBack;
