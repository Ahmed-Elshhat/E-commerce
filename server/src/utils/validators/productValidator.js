const { check, body, query } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Category = require("../../models/categoryModel");
const { validateExactFields } = require("../validateFields");

exports.getProductValidator = [
  validateExactFields([], ["id"]),
  check("id").isMongoId().withMessage("Invalid ID formate"),
  validatorMiddleware,
];
exports.createProductValidator = [
  validateExactFields([
    "titleEn",
    "titleAr",
    "descriptionEn",
    "descriptionAr",
    "quantity",
    "price",
    "priceAfterDiscount",
    "colors",
    "coverImage",
    "images",
    "category",
  ]),
  check("titleEn")
    .notEmpty()
    .withMessage("Product title in English is required.")
    .isLength({ min: 3 })
    .withMessage("Product title in English must be at least 3 characters long.")
    .isLength({ max: 100 })
    .withMessage("The title in English must not exceed 100 characters."),
  check("titleAr")
    .notEmpty()
    .withMessage("Product title in Arabic is required.")
    .isLength({ min: 3 })
    .withMessage("Product title in Arabic must be at least 3 characters long.")
    .isLength({ max: 100 })
    .withMessage("The title in Arabic must not exceed 100 characters."),
  check("descriptionEn")
    .notEmpty()
    .withMessage("Product description in English is required.")
    .isLength({ min: 20 })
    .withMessage(
      "Product description in English must be at least 20 characters long."
    )
    .isLength({ max: 2000 })
    .withMessage(
      "Product description in English must not exceed 2000 characters."
    ),
  check("descriptionAr")
    .notEmpty()
    .withMessage("Product description in Arabic is required.")
    .isLength({ min: 20 })
    .withMessage(
      "Product description in Arabic must be at least 20 characters long."
    )
    .isLength({ max: 2000 })
    .withMessage(
      "Product description in Arabic must not exceed 2000 characters."
    ),
  check("quantity")
    .notEmpty()
    .withMessage("Product quantity is required")
    .isNumeric()
    .withMessage("Product quantity must be a number"),
  check("sold")
    .optional()
    .isNumeric()
    .withMessage("Product quantity must be a number"),
  check("price")
    .notEmpty()
    .withMessage("Product price is required")
    .isNumeric()
    .withMessage("Product price must be a number")
    .isLength({ max: 32 })
    .withMessage("To long price"),
  check("priceAfterDiscount")
    .optional()
    .isNumeric()
    .withMessage("Product priceAfterDiscount must be a number")
    .toFloat()
    .custom((value, { req }) => {
      if (req.body.price <= value) {
        throw new Error("priceAfterDiscount must be lower than price");
      }
      return true;
    }),
  check("colors")
    .optional()
    .isArray()
    .withMessage("availableColors should be array of string"),
  check("coverImage").notEmpty().withMessage("Product cover image is required"),
  check("images")
    .optional()
    .isArray()
    .withMessage("images should be array of string"),
  check("category")
    .notEmpty()
    .withMessage("Product must be belong to a category")
    .isMongoId()
    .withMessage("Invalid ID formate")
    .custom((categoryId) =>
      Category.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(
            new Error(`No category for this id: ${categoryId}`)
          );
        }
      })
    ),
  check("brand").optional().isMongoId().withMessage("Invalid ID formate"),
  validatorMiddleware,
];

exports.updateProductValidator = [
  validateExactFields(
    [
      "title",
      "description",
      "quantity",
      "price",
      "imageCover",
      "images",
      "ratingsQuantity",
      "category",
    ],
    ["id"]
  ),
  check("id").isMongoId().withMessage("Invalid ID formate"),
  body("title")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

exports.deleteProductValidator = [
  validateExactFields([], ["id"]),
  check("id").isMongoId().withMessage("Invalid ID formate"),
  validatorMiddleware,
];

exports.productSearchValidator = [
  validateExactFields([], [], ["s"]),
  query("s")
    .notEmpty()
    .withMessage("search must not be empty")
    .isLength({ max: 40 })
    .withMessage("Search text is too long, Must be under 40 characters."),
  validatorMiddleware,
];
