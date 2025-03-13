import { useEffect, useRef, useState } from "react";
import "./Header.scss";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../Redux/app/hooks";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { LuUserRound, LuUserRoundCheck } from "react-icons/lu";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { BsBox2 } from "react-icons/bs";
import { useWindow } from "../../context/windowContext";
import { AiOutlineSearch } from "react-icons/ai";
import axios, { CancelTokenSource } from "axios";
import { BASE_URL, PRODUCT_SEARCH } from "../../Api/Api";
import Skeleton from "react-loading-skeleton";
import { useTranslation } from "react-i18next";
import Cookie from "cookie-universal";
import { MdDashboard } from "react-icons/md";
type searchResultsType = { _id: number; title: string }[];

function Header() {
  const [searchText, setSearchText] = useState<string>("");
  const [searchResults, setSearchResults] = useState<searchResultsType>([]);
  const { data, loading } = useAppSelector((state) => state.user);
  const { lang } = useAppSelector((state) => state.language);
  const [focused, setFocused] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const { windowSize } = useWindow() || { windowSize: 1024 };
  const searchRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showUserName, setShowUserName] = useState<boolean>(false);
  const navigate = useNavigate();
  const userName = useRef<string>("");
  const { t, i18n } = useTranslation();
  const cookies = Cookie();

  useEffect(() => {
    if (data) {
      userName.current = data.name.split(" ")[0];
      setShowUserName(true);
    }
  }, [data]);

  useEffect(() => {
    if (searchText.trim() === "") {
      setSearchResults([]);
      setSelectedIndex(-1);
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel();
      }
    }
  }, [searchText]);

  // useEffect(() => {
  //   function handleClickOutside(event: MouseEvent) {
  //     if (
  //       searchRef.current &&
  //       !searchRef.current.contains(event.target as Node)
  //     ) {
  //       setSearchResults([]);
  //       setSelectedIndex(-1);
  //     }
  //   }

  //   document.addEventListener("click", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("click", handleClickOutside);
  //   };
  // }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
        setSelectedIndex(-1);
      }

      if (
        optionsRef.current &&
        !optionsRef.current.contains(event.target as Node)
      ) {
        setShowOptions(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    setSelectedIndex(-1);
    if (value.trim() === "") {
      setSearchResults([]);
      return;
    }
    handleSearchChange(value);
  };

  const handleFocusedInput = () => {
    if (!focused) setFocused(true);
    if (searchText.trim() !== "") {
      handleSearchChange(searchText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prevIndex) => {
        const newIndex =
          prevIndex < searchResults.length - 1 ? prevIndex + 1 : 0;
        setSearchText(searchResults[newIndex].title); // تحديث الـ input عند التنقل
        return newIndex;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prevIndex) => {
        const newIndex =
          prevIndex > 0 ? prevIndex - 1 : searchResults.length - 1;
        setSearchText(searchResults[newIndex].title); // تحديث الـ input عند التنقل
        return newIndex;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSearchButtonClick();
    }
  };

  const handleSearchButtonClick = () => {
    const query = searchText.trim(); // استخدام النص المكتوب في الـ input فقط
    if (query !== "") {
      setSearchResults([]); // إخفاء النتائج
      setTimeout(() => {
        navigate(`/${lang}/search-results?s=${encodeURIComponent(query)}`);
      }, 0);
    }
  };

  const handleLogout = () => {
    cookies.remove("ECT");
    window.location.href = "/";
  };

  const handleSearchChange = async (searchTxt: string) => {
    console.log(window.location);
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel();
    }

    cancelTokenRef.current = axios.CancelToken.source();

    try {
      const res = await axios.get(
        `${BASE_URL}${PRODUCT_SEARCH}?s=${searchTxt.trim()}`,
        {
          cancelToken: cancelTokenRef.current.token,
        }
      );
      if (res.status === 200) {
        setSearchResults(res.data.products);
        setSelectedIndex(-1);
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        return;
      } else {
        console.error("خطأ في البحث:", err);
        setSearchResults([]);
      }
    }
  };

  return (
    <header
      className="Header"
      style={{
        position: window.location.pathname.includes("dashboard")
          ? "relative"
          : "sticky",
      }}
    >
      <div className="container">
        <nav>
          <Link to="/" className="logo">
            {t("header.logo")}
          </Link>
          <div className="search" ref={searchRef}>
            {windowSize >= 460 && (
              <>
                <form
                  style={{
                    borderColor: focused ? "blue" : "rgb(189, 189, 189)",
                  }}
                >
                  <input
                    type="text"
                    placeholder={t("header.inputPlaceholder")}
                    value={searchText}
                    onChange={handleChange}
                    onFocus={handleFocusedInput}
                    onBlur={() => focused && setFocused(false)}
                    onKeyDown={handleKeyDown}
                    style={{
                      paddingLeft: i18n.language === "ar" ? "68px" : "20px",
                      paddingRight: i18n.language === "en" ? "87px" : "20px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchButtonClick}
                    style={{
                      left: i18n.language === "ar" ? "0" : "",
                      right: i18n.language === "en" ? "0" : "",
                    }}
                  >
                    {t("header.searchButton")}
                  </button>
                </form>

                <ul
                  className="search-results"
                  style={{
                    display: searchResults.length !== 0 ? "block" : "none",
                  }}
                >
                  {searchResults.map((result, index) => (
                    <li
                      key={result._id}
                      style={{
                        backgroundColor:
                          index === selectedIndex ? "#eee" : "white",
                      }}
                      onClick={() =>
                        navigate(
                          `/${lang}/search-results?s=${encodeURIComponent(
                            result.title
                          )}`
                        )
                      }
                      title={result.title}
                    >
                      {result.title}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="cart-and-user-options">
            {windowSize <= 460 && (
              <Link to="/search" className="search-link">
                <AiOutlineSearch />
              </Link>
            )}
            <div className="user-options" ref={optionsRef}>
              <span
                className="hi-btn"
                style={{ background: showOptions ? "#ddd" : "white" }}
                onClick={() => {
                  if (windowSize >= 830) {
                    setShowOptions(!showOptions);
                  }
                }}
              >
                {data !== null ? (
                  <>
                    <LuUserRoundCheck />
                    <span className="text">
                      {loading && showUserName ? (
                        <Skeleton
                          width={50}
                          height={20}
                          style={{ marginTop: "10px" }}
                        />
                      ) : (
                        `${t("header.hiButton.hi")}, ${userName.current}`
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <LuUserRound />
                    <span
                      className="text"
                      style={{
                        fontSize:
                          data === null && i18n.language === "ar"
                            ? "16px"
                            : "17px",
                      }}
                    >
                      {loading ? (
                        <Skeleton
                          width={50}
                          height={20}
                          style={{ marginTop: "10px" }}
                        />
                      ) : (
                        t("header.hiButton.signin")
                      )}
                    </span>
                  </>
                )}

                {showOptions ? <IoIosArrowUp /> : <IoIosArrowDown />}
              </span>

              <ul
                className="option-list"
                style={{ display: showOptions ? "block" : "none" }}
              >
                {data === null && !loading && (
                  <li className="login-option">
                    <Link to={`/${lang}/login`}>
                      {t("header.signinButton")}
                    </Link>
                  </li>
                )}

                {data?.role === "admin" || data?.role === "employee" ? (
                  <li>
                    <MdDashboard />
                    <Link to={`/${lang}/dashboard`}>
                      {t("header.dashboardButton")}
                    </Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <LuUserRound />
                      <Link to={`/${lang}/customer/account`}>
                        {t("header.MyAccountButton")}
                      </Link>
                    </li>
                    <li>
                      <BsBox2 />
                      <Link to={`/${lang}/customer/order`}>
                        {t("header.ordersButton")}
                      </Link>
                    </li>
                  </>
                )}

                {data !== null && !loading && (
                  <li className="logout-option">
                    <button type="button" onClick={handleLogout}>
                      {t("header.logoutButton")}
                    </button>
                  </li>
                )}
              </ul>
            </div>

            <Link to={`/${lang}/cart`} className="shopping-cart">
              <HiOutlineShoppingCart />{" "}
              <span className="text">{t("header.cart")}</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
