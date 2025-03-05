// import { useEffect, useRef, useState } from "react";
// import "./Header.scss";
// import { Link } from "react-router-dom";
// import { useAppSelector } from "../../Redux/app/hooks";
// import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
// import { LuUserRound, LuUserRoundCheck } from "react-icons/lu";
// import { HiOutlineShoppingCart } from "react-icons/hi";
// import { BsBox2 } from "react-icons/bs";
// import { useWindow } from "../../context/windowContext";
// import { AiOutlineSearch } from "react-icons/ai";
// import axios from "axios";
// import { BASE_URL, PRODUCT_SEARCH } from "../../Api/Api";

// type searchResultsType = { _id: number; title: string }[];

// function Header() {
//   const [searchText, setSearchText] = useState<string>("");
//   const [searchResults, setSearchResults] = useState<searchResultsType>([]);
//   const { data } = useAppSelector((state) => state.user);
//   const [focused, setFocused] = useState<boolean>(false);
//   const [showOptions, setShowOptions] = useState<boolean>(false);
//   const { windowSize } = useWindow();
//   const searchRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     handleSearchChange();
//     const checkTime = setInterval(() => {
//       if (searchText === "") {
//         setSearchResults([]);
//       }
//     }, 300);

//     return () => clearInterval(checkTime);
//   }, [searchText]);

//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (
//         searchRef.current &&
//         !searchRef.current.contains(event.target as Node)
//       ) {
//         setSearchResults([]);
//       }
//     }

//     document.addEventListener("click", handleClickOutside);
//     return () => {
//       document.removeEventListener("click", handleClickOutside);
//     };
//   }, []);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setSearchText(value);
//     handleSearchChange();
//   };

//   const handleFocusedInput = () => {
//     if (!focused) setFocused(true);
//     handleSearchChange();
//   };

//   const handleSearchChange = async () => {
//     if (searchText.trim() === "") {
//       setSearchResults([]);
//       return;
//     }

//     try {
//       const res = await axios.get(
//         `${BASE_URL}${PRODUCT_SEARCH}?s=${searchText}`
//       );
//       if (res.status === 200) {
//         console.log(res.data.products);
//         setSearchResults(res.data.products);
//       }
//     } catch (err) {
//       setSearchResults([]);
//       console.log(err);
//     }
//   };

//   return (
//     <header className="Header">
//       <div className="container">
//         <nav>
//           <div className="logo">Logo</div>
//           <div className="search" ref={searchRef}>
//             {windowSize >= 460 && (
//               <>
//                 <form
//                   style={{
//                     borderColor: focused ? "blue" : "rgb(189, 189, 189)",
//                   }}
//                 >
//                   <input
//                     type="text"
//                     placeholder="search"
//                     value={searchText}
//                     onChange={handleChange}
//                     onFocus={handleFocusedInput}
//                     onBlur={() => focused && setFocused(false)}
//                   />
//                   <button type="button">Search</button>
//                 </form>

//                 <ul
//                   className="search-results"
//                   style={{
//                     display: searchResults.length !== 0 ? "block" : "none",
//                   }}
//                 >
//                   {searchResults.map((result) => (
//                     <li key={result._id}>{result.title}</li>
//                   ))}
//                 </ul>
//               </>
//             )}
//           </div>

//           <div className="cart-and-user-options">
//             {windowSize <= 460 && (
//               <Link to="/search" className="search-link">
//                 <AiOutlineSearch />
//               </Link>
//             )}
//             <div className="user-options">
//               <span
//                 className="hi-btn"
//                 style={{ background: showOptions ? "#ddd" : "white" }}
//                 onClick={() => setShowOptions(!showOptions)}
//               >
//                 {data !== null ? (
//                   <>
//                     <LuUserRoundCheck />
//                     <span className="text">Hi, {data.name.split(" ")[0]}</span>
//                   </>
//                 ) : (
//                   <>
//                     <LuUserRound />
//                     <span className="text">Sign in</span>
//                   </>
//                 )}

//                 {showOptions ? <IoIosArrowUp /> : <IoIosArrowDown />}
//               </span>

//               <ul
//                 className="option-list"
//                 style={{ display: showOptions ? "block" : "none" }}
//               >
//                 {data === null && (
//                   <li className="login-option">
//                     <Link to="/login">Sign in</Link>
//                   </li>
//                 )}

//                 <li>
//                   <LuUserRound />
//                   <Link to="/customer/account">My Account</Link>
//                 </li>

//                 <li>
//                   <BsBox2 />
//                   <Link to="/customer/order">Orders</Link>
//                 </li>
//               </ul>
//             </div>

//             <Link to="/cart" className="cart">
//               <HiOutlineShoppingCart /> <span className="text">Cart</span>
//             </Link>
//           </div>
//         </nav>
//       </div>
//     </header>
//   );
// }

// export default Header;

import { useEffect, useRef, useState } from "react";
import "./Header.scss";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../Redux/app/hooks";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { LuUserRound, LuUserRoundCheck } from "react-icons/lu";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { BsBox2 } from "react-icons/bs";
import { useWindow } from "../../context/windowContext";
import { AiOutlineSearch } from "react-icons/ai";
import axios, { CancelTokenSource } from "axios";
import { BASE_URL, PRODUCT_SEARCH } from "../../Api/Api";

type searchResultsType = { _id: number; title: string }[];

function Header() {
  const [searchText, setSearchText] = useState<string>("");
  const [searchResults, setSearchResults] = useState<searchResultsType>([]);
  const { data } = useAppSelector((state) => state.user);
  const [focused, setFocused] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const { windowSize } = useWindow();
  const searchRef = useRef<HTMLDivElement>(null);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);

  useEffect(() => {
    const checkTime = setInterval(() => {
      if (searchText === "") {
        setSearchResults([]);
      }
    }, 300);

    return () => clearInterval(checkTime);
  }, [searchText]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]); // إخفاء النتائج عند النقر خارج البحث
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

    if (value.trim() === "") {
      setSearchResults([]); // عند مسح النص، يتم مسح النتائج فورًا
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

  const handleSearchChange = async (searchTxt: string) => {
    // إلغاء الطلب السابق إذا كان موجودًا
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel("إلغاء البحث السابق");
    }

    // إنشاء توكين جديد للإلغاء
    cancelTokenRef.current = axios.CancelToken.source();

    try {
      const res = await axios.get(
        `${BASE_URL}${PRODUCT_SEARCH}?s=${searchTxt}`,
        {
          cancelToken: cancelTokenRef.current.token,
        }
      );

      if (res.status === 200) {
        setSearchResults(res.data.products);
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("تم إلغاء البحث السابق");
      } else {
        console.error("خطأ في البحث:", err);
        setSearchResults([]); // في حالة الخطأ، لا نريد إبقاء نتائج قديمة
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
                    onBlur={() => setFocused(false)}
                  />
                  <button type="button">Search</button>
                </form>

                <ul
                  className="search-results"
                  style={{
                    display: searchResults.length !== 0 ? "block" : "none",
                  }}
                >
                  {searchResults.map((result) => (
                    <li key={result._id}>{result.title}</li>
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
                onClick={() => setShowOptions(!showOptions)}
              >
                {data !== null ? (
                  <>
                    <LuUserRoundCheck />
                    <span className="text">Hi, {data.name.split(" ")[0]}</span>
                  </>
                ) : (
                  <>
                    <LuUserRound />
                    <span className="text">Sign in</span>
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
