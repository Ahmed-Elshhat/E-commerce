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
    .optional()
    .isNumeric()
    .withMessage("Product quantity must be a number")
    .isInt({ gt: 0 })
    .withMessage("Product quantity must be a positive integer")
    .toInt(),
  check("price")
    .optional()
    .isNumeric()
    .withMessage("Product price must be a number")
    .isFloat({ gt: 0 })
    .withMessage("Product price must be a positive number")
    .toFloat(),
  check("priceAfterDiscount")
    .optional()
    .isNumeric()
    .withMessage("Product price after discount must be a number")
    .isFloat({ gt: 0 })
    .withMessage("Product price after discount must be a positive number")
    .toFloat()
    .custom((value, { req }) => {
      if (req.body.price <= value) {
        throw new Error("price after discount must be lower than price");
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
  body().custom((val) => {
    let { sizes, colors, quantity, price, priceAfterDiscount } = val;
    console.log(sizes);
    console.log(colors);
    console.log("Hello");

    let setSizes = [];
    if (sizes) {
      // step 8: Ensure that quantity is not sent for products with sizes
      if (quantity) {
        throw new Error(`Cannot send quantity for product with sizes.`);
      }

      // step 9: Ensure that price is not sent for products with sizes
      if (price) {
        throw new Error(`Cannot send price for product with sizes.`);
      }

      // step 10: Ensure that priceAfterDiscount is not sent for products with sizes
      if (priceAfterDiscount) {
        throw new Error(
          `Cannot send price after discount for product with sizes.`
        );
      }

      // step 11: Ensure that general colors are not sent with sizes
      if (colors && colors.length > 0) {
        throw new Error(`Cannot send general colors with sizes.`);
      }

      sizes.forEach((size, i) => {
        // Ensure a size name exists
        if (!size.size) {
          throw new Error(`Size name is required for size index ${i}`);
        }

        if (setSizes.includes(size.size)) {
          throw new Error(
            `You cannot add the same size more than once. index: ${i}`
          );
        }

        setSizes.push(size.size);

        // Ensure there is a price for each size
        if (!size.price) {
          throw new Error(`Price is required for size "${size.size}"`);
        }

        if (size.quantity && typeof size.quantity !== "number") {
          throw new Error(
            `The quantity for size "${size.size}" must be a number.`
          );
        }

        if (typeof size.price !== "number") {
          throw new Error(
            `The price for size "${size.size}" must be a number.`
          );
        }

        if (
          size.priceAfterDiscount &&
          typeof size.priceAfterDiscount !== "number"
        ) {
          throw new Error(
            `The price after discount for size "${size.size}" must be a number.`
          );
        }

        if (size.quantity && size.quantity < 0) {
          throw new Error(
            `The quantity for size "${size.size}" must not be negative.`
          );
        }

        if (size.price && size.price < 0) {
          throw new Error(
            `The price for size "${size.size}" must not be negative.`
          );
        }

        if (size.priceAfterDiscount && size.priceAfterDiscount < 0) {
          throw new Error(
            `The discounted price for size "${size.size}" must not be negative.`
          );
        }

        if (size.priceAfterDiscount && size.priceAfterDiscount >= size.price) {
          throw new Error(
            `The discounted price for size "${size.size}" must be less than the original price.`
          );
        }

        if (size.colors && size.colors.length > 0) {
          if (size.quantity || size.quantity === 0) {
            throw new Error(
              `Do not send quantity directly for size "${size.size}" with colors`
            );
          }
          const setColors = [];
          size.colors.forEach((color) => {
            if (!color.color) {
              throw new Error(
                `Color name is required for color index ${i} at size "${size.size}"`
              );
            }
            if (!color.quantity && color.quantity !== 0) {
              throw new Error(
                `Color quantity is required for color "${color.color}" at size "${size.size}"`
              );
            }
            if (color.quantity && typeof color.quantity !== "number") {
              throw new Error(
                `The quantity for color "${color.color}" at size "${size.size}" must be a number.`
              );
            }
            if (color.quantity < 0) {
              throw new Error(
                `The quantity for color "${color.color}" in size "${size.size}" must not be negative.`
              );
            }
            if (setColors.includes(color.color)) {
              throw new Error(
                `Duplicate color "${color.color}" found at size "${size.size}". Colors must be unique per size.`
              );
            }
            setColors.push(color.color);
          });
        } else if (!size.quantity && size.quantity !== 0) {
          throw new Error(
            `Quantity is required for size "${size.size}" without colors`
          );
        }
      });
    } else if (colors && colors.length > 0) {
      if (quantity || quantity === 0) {
        throw new Error(`Cannot send general quantity with colors`);
      }

      let setColors = [];
      colors.forEach((color, i) => {
        if (!color.color) {
          throw new Error(`Color name is required for color index ${i}`);
        }
        if (!color.quantity && color.quantity !== 0) {
          throw new Error(
            `Color quantity is required for color "${color.color}"`
          );
        }
        if (color.quantity && typeof color.quantity !== "number") {
          throw new Error(
            `The quantity for color "${color.color}" must be a number.`
          );
        }
        if (color.quantity < 0) {
          throw new Error(
            `The quantity for color "${color.color}" must not be negative.`
          );
        }
        if (setColors.includes(color.color)) {
          throw new Error(
            `Color ${color.color} is already selected. Duplicates are not allowed.`
          );
        }
        setColors.push(color.color);
      });
    } else if (!quantity && quantity !== 0) {
      throw new Error(`Quantity is required when no sizes and no colors.`);
    }else if (!price && price !== 0) {
      throw new Error(`Product price is required when there are no sizes.`);
    }

    return true;
  }),
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


