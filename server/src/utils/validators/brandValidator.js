const { check, body } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const { validateExactFields } = require("../validateFields");

exports.getBrandsValidator = [
  validateExactFields(
    [],
    [],
    ["sort", "limit", "page", "fields", "keyword", "name"]
  ),
  validatorMiddleware,
];

exports.getBrandValidator = [
  validateExactFields([], ["id"], []),
  check("id").isMongoId().withMessage("Invalid brand id format"),
  validatorMiddleware,
];

exports.createBrandValidator = [
  validateExactFields(["name", "image"]),
  check("name")
    .notEmpty()
    .withMessage("Brand name is required")
    .isLength({ min: 3 })
    .withMessage("Too short brand name")
    .isLength({ max: 32 })
    .withMessage("Too long brand name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

exports.updateBrandValidator = [
  validateExactFields(["name", "image"], ["id"]),
  check("id").isMongoId().withMessage("Invalid brand id format"),
  body("name")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

exports.deleteBrandValidator = [
  validateExactFields([], ["id"]),
  check("id").isMongoId().withMessage("Invalid brand id format"),
  validatorMiddleware,
];
