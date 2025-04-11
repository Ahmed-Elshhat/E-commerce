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
  validateExactFields(["nameAr", "nameEn", "image"], [], []),
  check("nameAr")
    .notEmpty()
    .withMessage("The category name in Arabic is required")
    .isLength({ min: 3 })
    .withMessage("The name in Arabic is too short, min 3 chars")
    .isLength({ max: 32 })
    .withMessage("The name in Arabic is too long, max 32 chars"),
  check("nameEn")
    .notEmpty()
    .withMessage("The category name in English is required")
    .isLength({ min: 3 })
    .withMessage("The name in English is too short, min 3 chars")
    .isLength({ max: 32 })
    .withMessage("The name in English is too long, max 32 chars"),
  validatorMiddleware,
];

exports.updateCategoryValidator = [
  validateExactFields(["nameAr", "nameEn", "image"], ["id"], []),
  check("id")
    .notEmpty()
    .withMessage("Id is required")
    .isMongoId()
    .withMessage("Invalid category id format"),
  check("nameAr")
    .optional()
    .isLength({ min: 3 })
    .withMessage("The name in Arabic is too short, min 3 chars")
    .isLength({ max: 32 })
    .withMessage("The name in Arabic is too long, max 32 chars"),
  check("nameEn")
    .optional()
    .isLength({ min: 3 })
    .withMessage("The name in English is too short, min 3 chars")
    .isLength({ max: 32 })
    .withMessage("The name in English is too long, max 32 chars"),
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
