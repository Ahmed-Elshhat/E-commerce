import { useEffect, useState } from "react";
import "./Cart.scss";
import { useTranslation } from "react-i18next";
import { BsCart4, BsTrash3 } from "react-icons/bs";
import { Link } from "react-router-dom";
import { Axios } from "../../Api/axios";
import { CART } from "../../Api/Api";
import { CartState } from "../../Types/app";
import { FaMinus, FaPlus } from "react-icons/fa";

function Cart() {
  const [cart, setCart] = useState<CartState | null>(null);
  const { t } = useTranslation();
  useEffect(() => {
    async function getCart() {
      try {
        const res = await Axios.get(`${CART}`);
        if (res.status === 200) {
          setCart(res.data);
          console.log(res);
        }
      } catch (err) {
        console.log(err);
      }
    }

    getCart();
  }, []);
  return (
    <div className="cart">
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
              {t("cart.cartContent.cartItems.header")} ({cart.numOfCartItems})
            </header>
            <div className="items">
              {cart.data.cartItems.map((item) => (
                <div className="item" key={item._id}>
                  <div className="info">
                    <div className="details">
                      <div className="image">
                        <img
                          src="https://cnn-arabic-images.cnn.io/cloudinary/image/upload/w_1920,c_scale,q_auto/cnnarabic/2023/08/20/images/247618.jpg"
                          alt=""
                        />
                      </div>
                      <p className="description">
                        fsdfsfsdfsdfsdfsdfsdfgdfgdfgasdfsdfadsf
                      </p>
                    </div>
                    <div className="price">
                      {t("cart.cartContent.currency")} {item.price}
                    </div>
                  </div>
                  <div className="actions">
                    <button className="remove-btn">
                      <BsTrash3 />{" "}
                      {t("cart.cartContent.cartItems.removeButton")}
                    </button>

                    <div className="increment-and-decrement">
                      <button className="decrement">
                        <FaMinus />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button className="increment">
                        <FaPlus />
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
  );
}

export default Cart;
