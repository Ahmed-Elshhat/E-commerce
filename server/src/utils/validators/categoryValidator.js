// const { param } = require("express-validator");
const { check, body } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const { validateExactFields } = require("../validateFields");

exports.getCategoriesValidator = [
  validateExactFields(
    [],
    [],
    ["sort", "limit", "page", "fields", "keyword", "name"]
  ),
  validatorMiddleware,
];

exports.getCategoryValidator = [
  validateExactFields([], ["id"]),
  check("id")
    .notEmpty()
    .withMessage("Id is required")
    .isMongoId()
    .withMessage("Invalid category id format"),
  validatorMiddleware,
];

exports.createCategoryValidator = [
  validateExactFields(["name", "image"], [], []),
  check("name")
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 3 })
    .withMessage("Too short category name")
    .isLength({ max: 32 })
    .withMessage("Too long category name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

exports.updateCategoryValidator = [
  validateExactFields(["name", "image"], ["id"], []),
  check("id")
    .notEmpty()
    .withMessage("Id is required")
    .isMongoId()
    .withMessage("Invalid category id format"),
  body("name")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

exports.deleteCategoryValidator = [
  validateExactFields([], ["id"], []),
  check("id")
    .notEmpty()
    .withMessage("Id is required")
    .isMongoId()
    .withMessage("Invalid category id format"),
  validatorMiddleware,
];
