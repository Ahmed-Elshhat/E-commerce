import { useEffect, useState } from "react";
import "./Cart.scss";
import { useTranslation } from "react-i18next";
import { BsCart4, BsTrash3 } from "react-icons/bs";
import { Link } from "react-router-dom";
import { Axios } from "../../Api/axios";
import { CART } from "../../Api/Api";
import { CartState } from "../../Types/app";
import { FaMinus, FaPlus } from "react-icons/fa";
import LoadingButton from "../../components/LoadingButton/LoadingButton";
import Loading from "../../components/Loading/Loading";

function Cart() {
  const [cart, setCart] = useState<CartState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingButton, setLoadingButton] = useState({
    isLoading: false,
    type: "",
    id: "",
  });
  const { t, i18n } = useTranslation();
  useEffect(() => {
    async function getCart() {
      setLoading(true);
      try {
        const res = await Axios.get(`${CART}`);
        if (res.status === 200) {
          console.log(res.data);
          setCart(res.data);
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
        console.log(err);
      }
    }

    getCart();
  }, []);

  const handleIncrementAndDecrementQuantity = async (
    itemId: string,
    q: number,
    type: string
  ) => {
    if (q === 1 && type === "decrement") return;
    setLoadingButton({ isLoading: true, type, id: itemId });
    const quantity = type === "increment" ? q + 1 : q - 1;
    try {
      const res = await Axios.put(`${CART}/${itemId}`, {
        quantity,
      });
      if (res.status === 200) {
        setLoadingButton({ isLoading: false, type: "", id: "" });
        setCart(res.data);
      }
    } catch (err) {
      setLoadingButton({ isLoading: false, type: "", id: "" });
      console.log(err);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const res = await Axios.delete(`${CART}/${itemId}`);
      if (res.status === 200) {
        setCart(res.data);
      }
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <>
      {loading && <Loading transparent={false} />}
      <div className="cart">
        <div className="container-box">
          {!cart || cart.numOfCartItems <= 0 ? (
            <div className="cart-is-empty">
              <div className="cart-icon">
                <BsCart4 />
              </div>
              <h3>{t("cart.cartIsEmpty.title")}</h3>
              <p>{t("cart.cartIsEmpty.message")}</p>
              <Link to="/">{t("cart.cartIsEmpty.continueShoppingButton")}</Link>
            </div>
          ) : (
            <div className="cart-content">
              <div className="cart-items">
                <header>
                  {t("cart.cartContent.cartItems.header")} (
                  {cart.numOfCartItems})
                </header>
                <div className="items">
                  {cart.data.cartItems.map((item) => (
                    <div className="item" key={item._id}>
                      <div className="info">
                        <div className="image">
                          {item.product != null && (
                            <img src={item.product.coverImageFull} alt="" />
                          )}
                        </div>
                        <div className="details">
                          <p className="description">
                            {item.product != null && (
                              <>{i18n.language == "ar"? item.product.titleAr : item.product.titleEn}</>
                            )}
                            Iku S3 Dual SIM Mobile Phone – BLACK
                          </p>
                          <div className="price">
                            {t("cart.cartContent.currency")} {item.price}
                          </div>
                        </div>
                      </div>
                      <div className="actions">
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveItem(item._id)}
                        >
                          <BsTrash3 />{" "}
                          {t("cart.cartContent.cartItems.removeButton")}
                        </button>

                        <div className="increment-and-decrement">
                          <button
                            className="decrement"
                            onClick={() =>
                              handleIncrementAndDecrementQuantity(
                                item._id,
                                item.quantity,
                                "decrement"
                              )
                            }
                            style={{
                              backgroundColor:
                                item.quantity === 1 ? "gray" : "",
                            }}
                          >
                            {loadingButton.isLoading &&
                            loadingButton.type === "decrement" &&
                            loadingButton.id === item._id ? (
                              <LoadingButton width="15px" height="15px" />
                            ) : (
                              <FaMinus />
                            )}
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button
                            className="increment"
                            onClick={() =>
                              handleIncrementAndDecrementQuantity(
                                item._id,
                                item.quantity,
                                "increment"
                              )
                            }
                          >
                            {loadingButton.isLoading &&
                            loadingButton.type === "increment" &&
                            loadingButton.id === item._id ? (
                              <LoadingButton width="15px" height="15px" />
                            ) : (
                              <FaPlus />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="check-out">
                <header>{t("cart.cartContent.checkOut.header")}</header>

                <div className="total-price-section">
                  <div className="title">
                    {t("cart.cartContent.checkOut.title")}
                  </div>
                  <div className="total-price">
                    {t("cart.cartContent.currency")} {cart.data.totalCartPrice}
                  </div>
                </div>

                <button>
                  {t("cart.cartContent.checkOut.checkOutButton")}(
                  {t("cart.cartContent.currency")} {cart.data.totalCartPrice})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Cart;
