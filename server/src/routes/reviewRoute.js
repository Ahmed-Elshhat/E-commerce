const express = require("express");

const router = express.Router({ mergeParams: true });

const {
  getReviewValidator,
  createReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
} = require("../utils/validators/reviewValidator");

const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  createFilterObj,
  setProductIdAndUserIdToBody,
} = require("../controllers/reviewController");

const AuthService = require("../controllers/authController");

router
  .route("")
  .get(createFilterObj, getReviews)
  .post(
    AuthService.protect,
    AuthService.allowedTo("user"),
    setProductIdAndUserIdToBody,
    createReviewValidator,
    createReview
  );

router
  .route("/:id")
  .get(getReviewValidator, getReview)
  .put(
    AuthService.protect,
    AuthService.allowedTo("user", "admin"),
    updateReviewValidator,
    updateReview
  )
  .delete(
    AuthService.protect,
    AuthService.allowedTo("user", "admin"),
    deleteReviewValidator,
    deleteReview
  );

module.exports = router;
