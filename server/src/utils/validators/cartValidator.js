const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const { validateExactFields } = require("../validateFields");
const Cart = require("../../models/cartModel");

exports.createCartValidator = [
  validateExactFields(["productId", "color", "size"], [], []),
  check("productId")
    .notEmpty()
    .withMessage("Product Id is required")
    .isMongoId()
    .withMessage("Invalid product id format"),
  validatorMiddleware,
];

exports.getCartValidator = [validateExactFields(), validatorMiddleware];

exports.updateCartItemQuantityValidator = [
  validateExactFields(["quantity"], ["itemId"]),
  check("itemId").isMongoId().withMessage("Invalid item ID format"),
  check("quantity")
    .notEmpty()
    .withMessage("Quantity must be not empty")
    .isInt({ gt: 0 })
    .withMessage("Quantity must be a positive integer"),
  validatorMiddleware,
];

exports.clearCategoryValidator = [validateExactFields(), validatorMiddleware];

exports.removeSpecificCartItemValidator = [
  validateExactFields([], ["itemId"], []),
  check("itemId")
    .notEmpty()
    .withMessage("Id is required")
    .isMongoId()
    .withMessage("Invalid category id format"),
  validatorMiddleware,
];

exports.applyCouponValidator = [
  validateExactFields(["coupon"]),
  body("coupon")
    .optional()
    .notEmpty()
    .withMessage("Coupon is required")
    .isLength({ min: 8 })
    .withMessage("Too short coupon")
    .isLength({ max: 10 })
    .withMessage("Too long coupon")
    .custom(async (val, { req }) => {
      const cart = await Cart.findOne({ user: req.user.id });
      if (!cart) {
        throw Error("User cart not found");
      }

      if (cart.cartItems.length === 0) {
        throw Error("Cart is empty");
      }
    }),
  validatorMiddleware,
];