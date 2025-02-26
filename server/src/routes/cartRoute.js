const express = require("express");

const router = express.Router();

const {
  addProductToCart,
  getLoggedUserCart,
  clearCart,
  updateCartItemQuantity,
  removeSpecificCartItem,
  applyCoupon,
} = require("../controllers/cartController");
const authService = require("../controllers/authController");
const {
  createCartValidator,
  getCartValidator,
  clearCategoryValidator,
  updateCartItemQuantityValidator,
  removeSpecificCartItemValidator,
  applyCouponValidator,
} = require("../utils/validators/cartValidator");

router.use(authService.protect, authService.allowedTo("user"));

router
  .route("/")
  .post(createCartValidator, addProductToCart)
  .get(getCartValidator, getLoggedUserCart)
  .delete(clearCategoryValidator, clearCart);

router.put("/applyCoupon", applyCouponValidator, applyCoupon);

router
  .route("/:itemId")
  .put(updateCartItemQuantityValidator, updateCartItemQuantity)
  .delete(removeSpecificCartItemValidator, removeSpecificCartItem);

module.exports = router;
