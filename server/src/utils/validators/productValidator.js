const { check, body, query } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Category = require("../../models/categoryModel");
const Brand = require("../../models/brandModel");
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
    "sizes",
    "coverImage",
    "images",
    "category",
    "brand",
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
    // .notEmpty()
    // .withMessage("Product quantity is required")
    .optional()
    .isNumeric()
    .withMessage("Product quantity must be a number"),
  // check("sold")
  //   .optional()
  //   .isNumeric()
  //   .withMessage("Product quantity must be a number"),
  check("price")
    // .notEmpty()
    // .withMessage("Product price is required")
    .optional()
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
  check("sizes").optional(),
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
  check("brand")
    .optional()
    .isMongoId()
    .withMessage("Invalid ID formate")
    .custom((brandId) =>
      Brand.findById(brandId).then((brand) => {
        if (!brand) {
          return Promise.reject(new Error(`No brand for this id: ${brandId}`));
        }
      })
    ),
  // body().custom((value) => {
  //   const { colors, quantity, price, priceAfterDiscount } = value;
    
  //   const sizes = JSON.parse(value.sizes);
  //   console.log(sizes);
    
  //   if (sizes) {
  //     if (quantity) {
  //       throw new Error("Cannot send quantity for product with sizes.");
  //     }
  //     if (price) {
  //       throw new Error("Cannot send price for product with sizes.");
  //     }
  //     if (priceAfterDiscount) {
  //       throw new Error(
  //         "Cannot send priceAfterDiscount for product with sizes."
  //       );
  //     }

  //     if (colors && colors.length > 0) {
  //       throw new Error("Cannot send general colors with sizes.");
  //     }

  //     sizes.forEach((size, idx) => {
  //       if (!size.size) {
  //         throw new Error(`Size name is required for size index ${idx}`);
  //       }
  //       if (!size.price) {
  //         throw new Error(`Price is required for size "${size.size}"`);
  //       }

  //       if (size.colors && size.colors.length > 0) {
  //         let total = 0;

  //         size.colors.forEach((colorObj, colorIdx) => {
  //           if (!colorObj.color) {
  //             throw new Error(
  //               `Color name is required for color at size "${size.size}"`
  //             );
  //           }
  //           if (colorObj.quantity == null) {
  //             throw new Error(
  //               `Color quantity is required for color "${colorObj.color}" at size "${size.size}"`
  //             );
  //           }
  //           total += colorObj.quantity;
  //         });

  //         if (size.quantity) {
  //           throw new Error(
  //             `Do not send quantity directly for size "${size.size}" with colors`
  //           );
  //         }

  //         size.quantity = total; // نحسب كمية المقاس تلقائيًا
  //       } else if (size.quantity == null) {
  //         throw new Error(
  //           `Quantity is required for size "${size.size}" without colors`
  //         );
  //       }
  //     });
  //   } else {
  //     if (colors && colors.length > 0) {
  //       if (quantity) {
  //         throw new Error("Cannot send general quantity with colors.");
  //       }

  //       let total = 0;

  //       colors.forEach((colorObj, colorIdx) => {
  //         if (!colorObj.color) {
  //           throw new Error(
  //             `Color name is required for color index ${colorIdx}`
  //           );
  //         }
  //         if (colorObj.quantity == null) {
  //           throw new Error(
  //             `Color quantity is required for color "${colorObj.color}"`
  //           );
  //         }
  //         total += colorObj.quantity;
  //       });

  //       value.quantity = total; // نحسب كمية المنتج تلقائيًا
  //     }

  //     if ((!colors || colors.length === 0) && quantity == null) {
  //       throw new Error("Quantity is required when no sizes and no colors.");
  //     }
  //   }

  //   return true;
  // }),
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
