import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home/Home";
import NotFound from "./pages/Auth/NotFound/NotFound";
import Login from "./pages/Auth/Login/Login";
import Signup from "./pages/Auth/signup/signup";
import Forbidden from "./pages/Auth/Forbidden/Forbidden";
import RequireAuth from "./pages/Auth/RequireAuth";
import RequireBack from "./pages/Auth/RequireBack";
import Dashboard from "./pages/Dashboard/Dashboard";
import ForgotPassword from "./pages/Auth/ForgotPassword/ForgotPassword";
import VerifyPassResetCode from "./pages/Auth/VerifyPassResetCode/VerifyPassResetCode";
import ResetPassword from "./pages/Auth/ResetPassword/ResetPassword";
import Header from "./components/Header/Header";
import Cart from "./pages/Cart/Cart";
import { useAppDispatch, useAppSelector } from "./Redux/app/hooks";
import { fetchUsers } from "./Redux/feature/userSlice/userSlice";
import SearchResults from "./pages/SearchResults/SearchResults";
import "./i18n";
import LanguageWrapper from "./components/LanguageWrapper";
import { saveLang } from "./Redux/feature/languageSlice/languageSlice";
import Footer from "./components/Footer/Footer";
import ShowProduct from "./pages/ShowProduct/ShowProduct";

function App() {
  const { lang } = useAppSelector((state) => state.language);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const localLang = localStorage.getItem("lang");
    if (localLang) {
      dispatch(saveLang(localLang));
    } else {
      dispatch(saveLang("en"));
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  return (
    <div className="App">
      <Routes>
        <Route
          path="/"
          element={<Navigate replace to={`/${lang || "en"}/`} />}
        />

        <Route
          path="/:lang/*"
          element={
            <LanguageWrapper>
              <>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <>
                        <Header />
                        <Home />
                        <Footer />
                      </>
                    }
                  />
                  <Route path="/show-product/:productId" element={<ShowProduct />} />
                  <Route path="/forbidden" element={<Forbidden />} />
                  <Route element={<RequireBack />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route
                      path="/verify-reset-code"
                      element={<VerifyPassResetCode />}
                    />
                    <Route path="/reset-password" element={<ResetPassword />} />
                  </Route>
                  <Route
                    element={
                      <RequireAuth allowedRole={["admin", "employee"]} />
                    }
                  >
                    <Route path="/dashboard" element={<Dashboard />} />
                  </Route>
                  <Route element={<RequireAuth allowedRole={["user"]} />}>
                    <Route path="/cart" element={<Cart />} />
                  </Route>
                  <Route path="/search-results" element={<SearchResults />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </>
            </LanguageWrapper>
          }
        />

        <Route path="/not-found" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
