import "./Cart.scss";
import { useTranslation } from "react-i18next";
import { BsCart4 } from "react-icons/bs";
import { Link } from "react-router-dom";

function Cart() {
  const { t } = useTranslation();
  return (
    <div className="cart">
      <div className="container">
        <div className="cart-is-empty">
          <div className="cart-icon">
            <BsCart4 />
          </div>
          <h3>{t("cart.cartIsEmpty.title")}</h3>
          <p>{t("cart.cartIsEmpty.message")}</p>
          <Link to="/">{t("cart.cartIsEmpty.continueShoppingButton")}</Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;
