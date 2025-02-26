const express = require("express");

const {
  getCouponsValidator,
  getCouponValidator,
  createCouponValidator,
  updateCouponValidator,
  deleteCouponValidator,
} = require("../utils/validators/couponValidator");

const {
  getCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponController");

const authService = require("../controllers/authController");

const router = express.Router();

router.use(authService.protect, authService.allowedTo("admin"));

router
  .route("/")
  .get(getCouponsValidator, getCoupons)
  .post(createCouponValidator, createCoupon);
router
  .route("/:id")
  .get(getCouponValidator, getCoupon)
  .put(updateCouponValidator, updateCoupon)
  .delete(deleteCouponValidator, deleteCoupon);

module.exports = router;
