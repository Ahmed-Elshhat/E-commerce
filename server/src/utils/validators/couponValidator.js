// const { param } = require("express-validator");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const { validateExactFields } = require("../validateFields");

exports.getCouponsValidator = [
  validateExactFields(
    [],
    [],
    [
      "sort",
      "limit",
      "page",
      "fields",
      "keyword",
      "name",
      "expire",
      "discount",
      "discount[gt]",
      "discount[gte]",
      "discount[lt]",
      "discount[lte]",
    ]
  ),
  validatorMiddleware,
];

exports.getCouponValidator = [
  validateExactFields([], ["id"]),
  check("id")
    .notEmpty()
    .withMessage("Id is required")
    .isMongoId()
    .withMessage("Invalid coupon id format"),
  validatorMiddleware,
];

exports.createCouponValidator = [
  validateExactFields(["name", "expire", "discount"], [], []),
  check("name")
    .notEmpty()
    .withMessage("Coupon name is required")
    .isLength({ min: 8 })
    .withMessage("Too short coupon name")
    .isLength({ max: 10 })
    .withMessage("Too long coupon name"),
  check("expire")
    .notEmpty()
    .withMessage("Coupon expire is required")
    .isInt({ min: 1000000000000, max: 9999999999999 })
    .withMessage("Coupon expire must be a valid timestamp in milliseconds")
    .custom((value) => {
      const date = new Date(Number(value));
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
      return true;
    }),
  check("discount")
    .notEmpty()
    .withMessage("Coupon discount is required")
    .isNumeric()
    .withMessage("discount must be a number"),
  validatorMiddleware,
];

exports.updateCouponValidator = [
  validateExactFields(["name", "expire", "discount"], ["id"], []),
  check("id")
    .notEmpty()
    .withMessage("Id is required")
    .isMongoId()
    .withMessage("Invalid coupon id format"),
  body("name")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Too short coupon name")
    .isLength({ max: 10 })
    .withMessage("Too long coupon name"),
  body("expire")
    .optional()
    .isInt({ min: 1000000000000, max: 9999999999999 })
    .withMessage("Coupon expire must be a valid timestamp in milliseconds")
    .custom((value) => {
      const date = new Date(Number(value));
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
      return true;
    }),
  body("discount")
    .optional()
    .isNumeric()
    .withMessage("discount must be a number"),
  validatorMiddleware,
];

exports.deleteCouponValidator = [
  validateExactFields([], ["id"], []),
  check("id")
    .notEmpty()
    .withMessage("Id is required")
    .isMongoId()
    .withMessage("Invalid coupon id format"),
  validatorMiddleware,
];
