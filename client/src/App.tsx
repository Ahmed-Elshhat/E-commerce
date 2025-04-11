import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home/Home";
import NotFound from "./pages/Auth/NotFound/NotFound";
import Login from "./pages/Auth/Login/Login";
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
import Signup from "./pages/Auth/Signup/Signup";
import Employees from "./pages/Dashboard/Employees/Employees";
import AddEmployee from "./pages/Dashboard/Employees/AddEmployee/AddEmployee";
import Categories from "./pages/Dashboard/Categories/Categories";
import AddCategory from "./pages/Dashboard/Categories/AddCategory/AddCategory";
import Products from "./pages/Dashboard/Products/Products";
import AddProduct from "./pages/Dashboard/Products/AddProduct/AddProduct";
import UpdateCategory from "./pages/Dashboard/Categories/UpdateCategory/UpdateCategory";
import UpdateProduct from "./pages/Dashboard/Products/UpdateProduct/UpdateProduct";
import ShowEmployee from "./pages/Dashboard/Employees/ShowEmployee/ShowEmployee";
import ShowCategory from "./pages/Dashboard/Categories/ShowCategory/ShowCategory";
import ShowProductDetails from "./pages/Dashboard/Products/ShowProductDetails/ShowProductDetails";
import Brands from "./pages/Dashboard/Brands/Brands";
import ShowBrand from "./pages/Dashboard/Brands/ShowBrand/ShowBrand";
import AddBrand from "./pages/Dashboard/Brands/AddBrand/AddBrand";
import UpdateBrand from "./pages/Dashboard/Brands/UpdateBrand/UpdateBrand";
import Coupons from "./pages/Dashboard/Coupons/Coupons";
import ShowCoupon from "./pages/Dashboard/Coupons/ShowCoupon/ShowCoupon";
import AddCoupon from "./pages/Dashboard/Coupons/AddCoupon/AddCoupon";
import UpdateCoupon from "./pages/Dashboard/Coupons/UpdateCoupon/UpdateCoupon";

function App() {
  const { lang } = useAppSelector((state) => state.language);
  const { data } = useAppSelector((state) => state.user);
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
                  <Route
                    path="/show-product/:productId"
                    element={<ShowProduct />}
                  />
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
                    <Route
                      path="/dashboard"
                      element={
                        <>
                          <Dashboard />
                          <Footer />
                        </>
                      }
                    >
                      <Route element={<RequireAuth allowedRole={["admin"]} />}>
                        {data && data.role === "admin" && (
                          <Route index element={<Employees />} />
                        )}
                        <Route path="employees" element={<Employees />} />
                        <Route path="employees/add" element={<AddEmployee />} />
                        <Route
                          path="employees/show/:id"
                          element={<ShowEmployee />}
                        />
                      </Route>

                      {data && data.role === "employee" && (
                        <Route index element={<Categories />} />
                      )}
                      <Route path="categories" element={<Categories />} />
                      <Route
                        path="categories/show/:id"
                        element={<ShowCategory />}
                      />
                      <Route path="categories/add" element={<AddCategory />} />
                      <Route
                        path="categories/update/:id"
                        element={<UpdateCategory />}
                      />

                      <Route path="brands" element={<Brands />} />
                      <Route
                        path="brands/show/:id"
                        element={<ShowBrand />}
                      />
                      <Route path="brands/add" element={<AddBrand />} />
                      <Route
                        path="brands/update/:id"
                        element={<UpdateBrand />}
                      />

                      <Route path="coupons" element={<Coupons />} />
                      <Route
                        path="coupons/show/:id"
                        element={<ShowCoupon />}
                      />
                      <Route path="coupons/add" element={<AddCoupon />} />
                      <Route
                        path="coupons/update/:id"
                        element={<UpdateCoupon />}
                      />
                      
                      <Route path="products" element={<Products />} />
                      <Route
                        path="products/show/:id"
                        element={<ShowProductDetails />}
                      />
                      <Route path="products/add" element={<AddProduct />} />
                      <Route
                        path="products/update/:id"
                        element={<UpdateProduct />}
                      />
                    </Route>
                  </Route>
                  <Route element={<RequireAuth allowedRole={["user"]} />}>
                    <Route
                      path="/cart"
                      element={
                        <>
                          <Header />
                          <Cart />
                          <Footer />
                        </>
                      }
                    />
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
