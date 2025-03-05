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

type searchResultsType = { _id: number; title: string }[];

function Header() {
  const [searchText, setSearchText] = useState<string>("");
  const [searchResults, setSearchResults] = useState<searchResultsType>([]);
  const { data, loading } = useAppSelector((state) => state.user);
  const [focused, setFocused] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const { windowSize } = useWindow();
  const searchRef = useRef<HTMLDivElement>(null);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showUserName, setShowUserName] = useState<boolean>(false);
  const navigate = useNavigate();
  const userName = useRef<string>("");

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
        setSelectedIndex(-1);
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
        navigate(`/search-results?s=${encodeURIComponent(query)}`);
      }, 0);
    }
  };

  const handleSearchChange = async (searchTxt: string) => {
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
    <header className="Header">
      <div className="container">
        <nav>
          <div className="logo">Logo</div>
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
                    placeholder="search"
                    value={searchText}
                    onChange={handleChange}
                    onFocus={handleFocusedInput}
                    onBlur={() => focused && setFocused(false)}
                    onKeyDown={handleKeyDown}
                  />
                  <button type="button" onClick={handleSearchButtonClick}>
                    Search
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
                          `/search-results?s=${encodeURIComponent(
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
            <div className="user-options">
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
                        `Hi, ${userName.current}`
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <LuUserRound />
                    <span className="text">
                      {loading ? (
                        <Skeleton
                          width={50}
                          height={20}
                          style={{ marginTop: "10px" }}
                        />
                      ) : (
                        "Sign in"
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
                {data === null && (
                  <li className="login-option">
                    <Link to="/login">Sign in</Link>
                  </li>
                )}

                <li>
                  <LuUserRound />
                  <Link to="/customer/account">My Account</Link>
                </li>

                <li>
                  <BsBox2 />
                  <Link to="/customer/order">Orders</Link>
                </li>
              </ul>
            </div>

            <Link to="/cart" className="cart">
              <HiOutlineShoppingCart /> <span className="text">Cart</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
