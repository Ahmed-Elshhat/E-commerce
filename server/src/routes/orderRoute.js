const express = require("express");
const {
  createCashOrder,
  findAllOrders,
  findSpecificOrder,
  filterOrderForLoggedUser,
  updateOrderToPaid,
  updateOrderToDelivered,
  checkoutSession,
} = require("../controllers/orderController");

const router = express.Router();

const authService = require("../controllers/authController");

router.use(authService.protect);

router.get(
  "/checkout-session/:cartId",
  authService.allowedTo("user"),
  checkoutSession
);

router.route("/:cartId").post(authService.allowedTo("user"), createCashOrder); // ok
router.get(
  "/",
  authService.allowedTo("user", "admin", "employee"),
  filterOrderForLoggedUser,
  findAllOrders
); // ok

router.get("/:id", findSpecificOrder); // ok

router.use(authService.allowedTo("admin", "employee"));
router.put("/:id/pay", updateOrderToPaid);

router.put("/:id/deliver", updateOrderToDelivered);

module.exports = router;
