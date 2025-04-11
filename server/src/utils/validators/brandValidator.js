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
  validateExactFields(["nameAr", "nameEn", "image"], [], []),
  check("nameAr")
    .notEmpty()
    .withMessage("The brand name in Arabic is required")
    .isLength({ min: 2 })
    .withMessage("The name in Arabic is too short, min 2 chars")
    .isLength({ max: 32 })
    .withMessage("The name in Arabic is too long, max 32 chars"),
  check("nameEn")
    .notEmpty()
    .withMessage("The brand name in English is required")
    .isLength({ min: 2 })
    .withMessage("The name in English is too short, min 2 chars")
    .isLength({ max: 32 })
    .withMessage("The name in English is too long, max 32 chars"),
  validatorMiddleware,
];

exports.updateBrandValidator = [
  validateExactFields(["nameAr", "nameEn", "image"], ["id"]),
  check("id").isMongoId().withMessage("Invalid brand id format"),
  check("nameAr")
    .optional()
    .isLength({ min: 2 })
    .withMessage("The name in Arabic is too short, min 2 chars")
    .isLength({ max: 32 })
    .withMessage("The name in Arabic is too long, max 32 chars"),
  check("nameEn")
    .optional()
    .isLength({ min: 2 })
    .withMessage("The name in English is too short, min 2 chars")
    .isLength({ max: 32 })
    .withMessage("The name in English is too long, max 32 chars"),
  validatorMiddleware,
];

exports.deleteBrandValidator = [
  validateExactFields([], ["id"]),
  check("id").isMongoId().withMessage("Invalid brand id format"),
  validatorMiddleware,
];
