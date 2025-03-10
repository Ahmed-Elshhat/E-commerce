// import "./Home.scss";
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import { useEffect, useState } from "react";
// import { saveLang } from "../../Redux/feature/languageSlice/languageSlice";
// import { useAppDispatch } from "../../Redux/app/hooks";
// import Cards from "../../components/Cards/Cards";
// import axios from "axios";
// import { BASE_URL, PRODUCTS } from "../../Api/Api";
// function Home() {
//   const [lang, setLang] = useState<string>("");
//   const [pagination, setPagination] = useState<number>(1);
//   const [numberOfPages, setNumberOfPages] = useState<number>(1);
//   const { t, i18n } = useTranslation();
//   const navigate = useNavigate();
//   const dispatch = useAppDispatch();

//   useEffect(() => {
//     const localLang = localStorage.getItem("lang");
//     if (localLang) {
//       setLang(localLang);
//     } else {
//       setLang("en");
//     }
//   }, []);

//   useEffect(() => {
//     const getProducts = async () => {
//       const res = await axios.get(
//         `${BASE_URL}${PRODUCTS}?page=${pagination}&limit=5`
//       );
//       if (res.status === 200) {
//         setNumberOfPages(res.data.paginationResults.numberOfPages);
//         console.log(res.data.paginationResults.numberOfPages);
//       }
//     };
//     getProducts();
//   }, [pagination]);

//   const toggleLanguage = () => {
//     const newLang = i18n.language === "en" ? "ar" : "en";
//     i18n.changeLanguage(newLang);
//     document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr"; // دعم RTL
//     setLang(newLang);
//     dispatch(saveLang(newLang));
//     localStorage.setItem("lang", newLang);
//     navigate(`/${newLang}/`); // تحديث الـ Route بناءً على اللغة
//   };
//   return (
//     <>
//       <button onClick={toggleLanguage}>{t("home.change_language")}</button>
//       <div className="Home">
//         <div className="container">
//           <Cards />
//           <div className="pagination">
//             {[...Array(numberOfPages)].map((_, i) => (
//               <div
//                 className={`pagination-item ${
//                   pagination === i + 1 ? "active" : ""
//                 }`}
//                 key={i}
//                 onClick={() => setPagination(i + 1)}
//               >
//                 {i + 1}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default Home;

import "./Home.scss";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { saveLang } from "../../Redux/feature/languageSlice/languageSlice";
import { useAppDispatch } from "../../Redux/app/hooks";
import Cards from "../../components/Cards/Cards";
import axios from "axios";
import { BASE_URL, PRODUCTS } from "../../Api/Api";
import CardSkeleton from "../../components/Cards/Card/CardSkeleton/CardSkeleton";

function Home() {
  const [lang, setLang] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState<number>(1);
  const [numberOfPages, setNumberOfPages] = useState<number>(1);
  const [startIndex, setStartIndex] = useState<number>(0);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log(lang)
    const localLang = localStorage.getItem("lang");
    setLang(localLang || "en");
  }, []);

  useEffect(() => {
    const getProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${BASE_URL}${PRODUCTS}?page=${pagination}&limit=20`
        );
        if (res.status === 200) {
          setLoading(false);
          setNumberOfPages(res.data.paginationResults.numberOfPages);
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    getProducts();
  }, [pagination]);

  useEffect(() => {
    if (pagination > startIndex + 10) {
      setStartIndex(startIndex + 1);
    } else if (pagination < startIndex + 1) {
      setStartIndex(startIndex - 1);
    }
  }, [pagination]);

  const handlePaginationClick = (page: number) => {
    setPagination(page);
    window.scrollTo(0, 0);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    setLang(newLang);
    dispatch(saveLang(newLang));
    localStorage.setItem("lang", newLang);
    navigate(`/${newLang}/`);
  };

  return (
    <>
      <button onClick={toggleLanguage}>{t("home.change_language")}</button>
      <div className="Home">
        <div className="container">
          {!loading && products.length !== 0 ? (
            <Cards products={products} />
          ) : (
            <CardSkeleton countOfCards={20} />
          )}

          <div className="pagination">
            {startIndex > 0 && (
              <button
                className="pagination-arrow"
                onClick={() => setStartIndex(startIndex - 1)}
              >
                {"<"}
              </button>
            )}

            {[...Array(Math.min(10, numberOfPages - startIndex))].map(
              (_, i) => (
                <div
                  className={`pagination-item ${
                    pagination === startIndex + i + 1 ? "active" : ""
                  }`}
                  key={i}
                  onClick={() => handlePaginationClick(startIndex + i + 1)}
                >
                  {startIndex + i + 1}
                </div>
              )
            )}

            {startIndex + 10 < numberOfPages && (
              <button
                className="pagination-arrow"
                onClick={() => setStartIndex(startIndex + 1)}
              >
                {">"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
