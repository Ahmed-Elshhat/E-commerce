const { check, param } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Review = require("../../models/reviewModel");
const { validateExactFields } = require("../validateFields");
const Product = require("../../models/productModel");
const ApiError = require("../apiError");

exports.createReviewValidator = [
  validateExactFields(["title", "ratings", "user", "product"], ["productId"]),
  check("title").optional(),
  check("ratings")
    .notEmpty()
    .withMessage("ratings value required")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Ratings value must be between 1 to 5"),
  check("user").isMongoId().withMessage("Invalid Review id format"),
  check("product")
    .notEmpty()
    .withMessage("Product id is required")
    .isMongoId()
    .withMessage("Invalid Review id format")
    .custom(async (val, { req }) => {
      // Check if the product is already existed
      let product = await Product.findById(val);

      if (!product) {
        return Promise.reject(
          new Error(`No product for this id ${val}`, 404)
        );
      }

      // Check if logged user create review
      return await Review.findOne({
        user: req.user.id,
        product: req.body.product,
      }).then((review) => {
        if (review) {
          return Promise.reject(
            new Error("You already created a review before")
          );
        }
      });
    }),
  validatorMiddleware,
];

exports.getReviewValidator = [
  validateExactFields([],["id"]),
  check("id").isMongoId().withMessage("Invalid Review id format"),
  validatorMiddleware,
];

exports.updateReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid Review id format")
    .custom((val, { req }) =>
      // Check review ownership before update
      Review.findById(val).then((review) => {
        if (!review) {
          return Promise.reject(new Error(`There is no review with id ${val}`));
        }

        if (review.user._id.toString() !== req.user.id.toString()) {
          return Promise.reject(
            new Error(`Your are not allowed to perform this action`)
          );
        }
      })
    ),
  validatorMiddleware,
];

exports.deleteReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid Review id format")
    .custom((val, { req }) => {
      // Check review ownership before update
      if (req.user.role === "user") {
        return Review.findById(val).then((review) => {
          if (!review) {
            return Promise.reject(
              new Error(`There is no review with id ${val}`)
            );
          }

          if (review.user._id.toString() !== req.user.id.toString()) {
            return Promise.reject(
              new Error(`Your are not allowed to perform this action`)
            );
          }
        });
      }
      return true;
    }),
  validatorMiddleware,
];
