const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

const mongoose = require("mongoose");
const factory = require("./handlersFactory");
const Product = require("../models/productModel");
const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const Cart = require("../models/cartModel");
const ApiFeatures = require("../utils/apiFeatures");
const ApiError = require("../utils/apiError");

exports.uploadProductImages = uploadMixOfImages([
  {
    name: "coverImage",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 10,
  },
]);

exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  if (!req.files) {
    req.files = {};
  }

  //1- Image processing for coverImage
  if (req.files.coverImage && req.files.coverImage[0]) {
    const coverImageFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.coverImage[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 75 })
      .toFile(`uploads/products/${coverImageFileName}`);

    // Save image into our db
    req.body.coverImage = coverImageFileName;
  }

  //2- Image processing for images
  if (req.files.images && Array.isArray(req.files.images)) {
    req.body.images = [];

    const imagesArray = req.files.images.slice(0, 10); // الحد الأقصى 10 صور

    await Promise.all(
      imagesArray.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

        await sharp(img.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 95 })
          .toFile(`uploads/products/${imageName}`);

        req.body.images.push({
          // _id: new mongoose.Types.ObjectId(),
          url: imageName,
        });
      })
    );
  }
  next();
});

exports.parseJSON = asyncHandler(async (req, res, next) => {
  if (req.body.sizes) {
    try {
      req.body.sizes = JSON.parse(req.body.sizes); // Convert sizes from string to JSON
    } catch (error) {
      // step 3: If conversion fails, return an error stating that the sizes format is invalid
      return next(new ApiError("Invalid sizes format.", 400));
    }
  }

  if (req.body.colors) {
    try {
      req.body.colors = JSON.parse(req.body.colors); // Convert colors from string to JSON
    } catch (error) {
      // step 5: If conversion fails, return an error stating that the colors format is invalid
      return next(new ApiError("Invalid colors format.", 400));
    }
  }

  if (req.body.updateSizes) {
    try {
      req.body.updateSizes = JSON.parse(req.body.updateSizes); // Convert update sizes from string to JSON
    } catch (error) {
      // step 5: If conversion fails, return an error stating that the colors format is invalid
      return next(new ApiError("Invalid updateSizes format.", 400));
    }
  }

  next();
});

// @desc    Get list of products
// @route    GET /api/v1/products
// @access    Public
exports.getProducts = factory.getAll(Product, "Products", "reviews");

// @desc    Get specific product by id
// @route    GET /api/v1/products/:id
// @access    Public
exports.getProduct = factory.getOne(Product, "reviews");

// @desc    Create product
// @route    POST /api/v1/products
// @access   Private
exports.createProduct = asyncHandler(async (req, res, next) => {
  let body = { ...req.body };

  let { sizes, colors } = body;

  if (sizes) {
    sizes.forEach((size, idx) => {
      if (size.colors && size.colors.length > 0) {
        let total = 0;

        size.colors.forEach((color) => {
          total += color.quantity; // step 22: Add the quantity to the total quantity
        });

        body.sizes[idx] = { ...size, quantity: total };
      }
    });
  } else if (colors && colors.length > 0) {
    let total = 0;

    colors.forEach((color) => {
      total += color.quantity;
    });

    body.quantity = total;
  }

  const product = await Product.create(body);

  res.status(201).json({ data: product });
});

const calcTotalCartPrice = (cart) => {
  let totalPrice = 0;

  cart.cartItems.forEach((item) => {
    if (item.isAvailable !== false) {
      totalPrice += item.quantity * item.price;
    }
  });

  cart.totalCartPrice = totalPrice;
  cart.totalPriceAfterDiscount = undefined;
  return totalPrice;
};

// @desc    Update specific product
// @route    PUT /api/v1/products/:id
// @access    Private
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let { id } = req.params;

  const publicFields = [
    "titleEn",
    "titleAr",
    "descriptionEn",
    "descriptionAr",
    "coverImage",
    "images",
    "category",
    "brand",
  ];

  let body = { ...req.body };

  let {
    sizesIsExist,
    price,
    priceAfterDiscount,
    quantity,
    colors,
    // addGeneralColors,
    // updateGeneralColors,
    deleteGeneralColors,
    addSizes,
    updateSizes,
    deleteSizes,
  } = body;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ApiError(`No product for this id ${req.params.id}`, 404));
  }

  if (sizesIsExist == null) {
    return next(
      new ApiError(
        " The 'Sizes is exist' field is required. Please send true or false.",
        400
      )
    );
  }

  if (typeof sizesIsExist === "string") {
    sizesIsExist =
      sizesIsExist.toLowerCase() === "true"
        ? true
        : sizesIsExist.toLowerCase() === "false"
          ? false
          : null;
  }

  if (typeof sizesIsExist !== "boolean") {
    return next(
      new ApiError(
        "The value of the 'Sizes is exist' field must be either true or false.",
        400
      )
    );
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    if (sizesIsExist) {
      if (price != null) {
        return next(
          new ApiError(
            "The 'Price' field is not allowed when adding, updating, or deleting sizes.",
            400
          )
        );
      }

      if (priceAfterDiscount != null) {
        return next(
          new ApiError(
            "The 'Price after discount' field is not allowed when adding, updating, or deleting sizes.",
            400
          )
        );
      }

      if (quantity != null) {
        return next(
          new ApiError(
            "The 'Quantity' field is not allowed when adding, updating, or deleting sizes.",
            400
          )
        );
      }

      if (colors != null) {
        return next(
          new ApiError(
            "The 'general colors' field is not allowed when adding, updating, or deleting sizes.",
            400
          )
        );
      }

      if (deleteGeneralColors != null) {
        return next(
          new ApiError(
            "The 'Delete general colors' field is not allowed when adding, updating, or deleting sizes.",
            400
          )
        );
      }

      if (product.sizesIsExist) {
        let updateStatus = true;
        const validationErrors = {};

        // Validation
        if (
          deleteSizes != null &&
          Array.isArray(deleteSizes) &&
          deleteSizes.length > 0
        ) {
          const seenDeleteSizes = [];
          const deleteSizesErrors = [];

          deleteSizes.forEach((s, i) => {
            const lowerS = s.toLowerCase();
            const errors = [];

            const existsInOriginal = product.sizes.some(
              (size) => size.size.toLowerCase() === lowerS
            );

            if (!existsInOriginal) {
              errors.push(
                `❌ Cannot delete size "${s}" because it does not exist in the original sizes list.`
              );
            }

            if (seenDeleteSizes.includes(lowerS)) {
              errors.push(
                `❌ Duplicate size "${s}" found in delete sizes list at index ${i}. Each size must be unique.`
              );
            }

            if (errors.length > 0) {
              deleteSizesErrors.push({
                index: i,
                message: errors,
              });
            }

            seenDeleteSizes.push(lowerS);
          });

          if (deleteSizesErrors.length > 0) {
            validationErrors.deleteSizes = deleteSizesErrors;
            updateStatus = false;
          }
        }

        const seenNewSizeNames = [];
        if (
          updateSizes != null &&
          Array.isArray(updateSizes) &&
          updateSizes.length > 0
        ) {
          const seenSizeNames = [];
          const updateSizesErrors = [];
          const updateSizeColorsErrors = [];

          updateSizes.forEach((size, index) => {
            const errors = [];
            let normalizedName = null;
            let original = null;

            // Done
            if (size.sizeName == null) {
              errors.push(`Size name is required for update.`);
            } else if (typeof size.sizeName !== "string") {
              errors.push(`Size name is required for update.`);
            } else {
              normalizedName = size.sizeName.toLowerCase();
              original = product.sizes.find(
                (s) => s.size.toLowerCase() === normalizedName
              );

              if (!original) {
                errors.push(
                  `Size "${size.sizeName}" does not exist in the product.`
                );
              }

              if (size.newSizeName != null) {
                if (typeof size.newSizeName !== "string") {
                  errors.push(`The new size name must be a string.`);
                } else if (normalizedName === size.newSizeName?.toLowerCase()) {
                  errors.push(
                    `The new name for size "${size.sizeName}" matches the old name. It must be different.`
                  );
                }
              }

              if (seenSizeNames.includes(size.sizeName.toLowerCase())) {
                errors.push(`Only one update per size is allowed.`);
              }

              if (
                deleteSizes != null &&
                Array.isArray(deleteSizes) &&
                deleteSizes.length > 0
              ) {
                const shouldDeleteThisSize = deleteSizes.some(
                  (s) => s.toLowerCase() === normalizedName
                );

                if (shouldDeleteThisSize) {
                  errors.push(
                    `Size "${size.sizeName}" is marked for deletion and cannot be modified.`
                  );
                }
              }
            }

            // Done
            if (
              size.newSizeName == null &&
              size.sizePrice == null &&
              size.sizePriceAfterDiscount == null &&
              size.sizeQuantity == null &&
              (size.sizeColors == null ||
                !Array.isArray(size.sizeColors) ||
                size.sizeColors?.length === 0) &&
              (size.deleteColors == null ||
                !Array.isArray(size.deleteColors) ||
                size.deleteColors?.length === 0)
            ) {
              errors.push(
                `No actual update provided for size "${size.sizeName}". Please specify at least one change.`
              );
            }

            // Done
            if (size.newSizeName != null) {
              if (typeof size.newSizeName !== "string") {
                errors.push(`The new size name must be a string.`);
              } else {
                const newNameIsExist = product.sizes.find(
                  (s) => s.size.toLowerCase() === size.newSizeName.toLowerCase()
                );

                if (newNameIsExist) {
                  errors.push(
                    `The new size name "${size.newSizeName}" already exists in the product. Please choose a different name.`
                  );
                }

                if (seenNewSizeNames.includes(size.newSizeName.toLowerCase())) {
                  errors.push(
                    `Duplicate new size name detected. Each size must have a unique name.`
                  );
                }

                if (seenSizeNames.includes(size.newSizeName.toLowerCase())) {
                  errors.push(
                    `The new size name "${size.newSizeName}" conflicts with an existing size name. Please choose a different name.`
                  );
                }
              }
            }

            // Done
            if (size.sizePrice != null) {
              if (typeof size.sizePrice !== "number") {
                errors.push(`Price for "${size.sizeName}" must be a number.`);
              } else if (size.sizePrice <= 0) {
                errors.push(
                  `❌ Size price must be a positive number greater than 0.`
                );
              } else if (original != null) {
                if (size.sizePrice === original.price) {
                  errors.push(
                    `The new price for size "${size.sizeName}" must be different from the old price.`
                  );
                }

                if (
                  size.sizePriceAfterDiscount == null &&
                  size.sizePrice <= original.priceAfterDiscount
                ) {
                  errors.push(
                    `❌ The price for size "${size.sizeName}" must not be less than or equal to its existing discounted price.`
                  );
                }
              }
            }

            // Done
            if (size.sizePriceAfterDiscount != null) {
              if (size.deletePriceAfterDiscount === true) {
                errors.push(
                  `Cannot update and delete price after discount simultaneously for size "${size.sizeName}".`
                );
              }

              if (typeof size.sizePriceAfterDiscount !== "number") {
                errors.push(
                  `Discounted price for "${size.sizeName}" must be a number.`
                );
              } else if (size.sizePrice <= 0) {
                errors.push(
                  `❌ Size price after discount must be a positive number greater than 0.`
                );
              } else if (original != null) {
                if (
                  original.priceAfterDiscount != null &&
                  size.sizePriceAfterDiscount === original.priceAfterDiscount
                ) {
                  errors.push(
                    `The new discounted price for size "${size.sizeName}" must be different from the old discounted price.`
                  );
                }

                if (
                  size.sizePrice == null &&
                  size.sizePriceAfterDiscount > original.price
                ) {
                  errors.push(
                    `Discounted price for "${size.sizeName}" must be less than the original price (${original.price}).`
                  );
                }
              }
            }

            // Done
            if (
              size.sizePrice != null &&
              size.sizePriceAfterDiscount != null &&
              size.sizePriceAfterDiscount > size.sizePrice
            ) {
              errors.push(
                `Discounted price for "${size.sizeName}" must be less than the original price.`
              );
            }

            // Done
            if (
              size.deleteColors != null &&
              Array.isArray(size.deleteColors) &&
              size.deleteColors.length > 0
            ) {
              const seenDeleteColors = [];
              const deleteColorErrors = [];

              size.deleteColors.forEach((c, i) => {
                const colorValidationErrors = [];
                const lowerC = typeof c === "string" ? c.toLowerCase() : null;

                if (typeof c !== "string") {
                  colorValidationErrors.push(
                    `❌ Color at index ${i + 1} in the deleted colors list must be a string.`
                  );
                } else if (lowerC === "") {
                  colorValidationErrors.push(
                    `❌ Color at index ${i + 1} in the deleted colors list cannot be empty.`
                  );
                } else {
                  if (
                    size.sizeName != null &&
                    typeof size.sizeName === "string" &&
                    original != null
                  ) {
                    const existsInOriginal = original.colors.some(
                      (color) => color.color.toLowerCase() === lowerC
                    );
                    if (!existsInOriginal) {
                      colorValidationErrors.push(
                        `❌ Cannot delete color "${c}" at index ${i + 1} in size "${size.sizeName}" because it does not exist in the original color list.`
                      );
                    }
                  }

                  if (seenDeleteColors.includes(lowerC)) {
                    colorValidationErrors.push(
                      `❌ Duplicate color "${c}" found in delete colors list for size "${size.sizeName}" at index ${i + 1}. Each color must be unique.`
                    );
                  }

                  seenDeleteColors.push(lowerC);
                }

                if (colorValidationErrors.length > 0) {
                  deleteColorErrors.push({
                    colorIndex: i,
                    message: colorValidationErrors,
                  });
                }
              });

              if (deleteColorErrors.length > 0) {
                if (!validationErrors.updateSizesDeleteColors) {
                  validationErrors.updateSizesDeleteColors = [];
                }
                validationErrors.updateSizesDeleteColors.push({
                  index, // index الخاص بالـ size
                  deleteColors: deleteColorErrors,
                });
                updateStatus = false;
              }
            }

            // Done
            if (
              size.sizeColors != null &&
              Array.isArray(size.sizeColors) &&
              size.sizeColors.length > 0
            ) {
              const seenOldColorNames = [];
              const seenNewColorNames = [];
              const colorErrors = [];

              size.sizeColors.forEach((color, colorIndex) => {
                const colorValidationErrors = [];

                // type
                if (color.type == null) {
                  colorValidationErrors.push(
                    `❌ Color update type is required for size "${size.sizeName}" at color index ${colorIndex + 1}. Please specify either "update" or "new".`
                  );
                } else if (typeof color.type !== "string") {
                  colorValidationErrors.push(
                    `❌ Color type ${size.sizeName != null && typeof size.sizeName === "string" ? `for size "${size.sizeName}"` : ""} at color index ${colorIndex + 1} must be a string.`
                  );
                } else if (color.type !== "new" && color.type !== "update") {
                  colorValidationErrors.push(
                    `❌ Invalid color update type "${color.type}" for size "${size.sizeName}" at color index ${colorIndex + 1}. Expected "new" or "update".`
                  );
                }

                // colorName
                if (color.colorName == null) {
                  colorValidationErrors.push(
                    `❌ Missing color name for size "${size.sizeName}" at color index ${colorIndex + 1}.`
                  );
                } else if (typeof color.colorName !== "string") {
                  colorValidationErrors.push(
                    `❌ Color name ${size.sizeName != null && typeof size.sizeName === "string" ? `for size "${size.sizeName}"` : ""} at color index ${colorIndex + 1} must be a string.`
                  );
                } else {
                  // newColorName checks
                  if (
                    color.newColorName != null &&
                    color.colorName?.toLowerCase() ===
                      color.newColorName?.toLowerCase()
                  ) {
                    colorValidationErrors.push(
                      `❌ New color name must be different from the old color name for size "${size.sizeName}" at color index ${colorIndex + 1}.`
                    );
                  }

                  // duplicates
                  if (
                    seenOldColorNames.includes(color.colorName?.toLowerCase())
                  ) {
                    colorValidationErrors.push(
                      `❌ Duplicate color name "${color.colorName}" found in size "${size.sizeName}" at color index ${colorIndex + 1}.`
                    );
                  }
                }

                // duplicates
                if (color.newColorName != null) {
                  if (
                    seenNewColorNames.includes(
                      color.newColorName?.toLowerCase()
                    )
                  ) {
                    colorValidationErrors.push(
                      `❌ Duplicate new color name "${color.newColorName}" found in size "${size.sizeName}" at color index ${colorIndex + 1}.`
                    );
                  }
                  if (
                    seenOldColorNames.includes(
                      color.newColorName?.toLowerCase()
                    )
                  ) {
                    colorValidationErrors.push(
                      `❌ The color name "${color.newColorName}" already exists. Please choose a unique name.`
                    );
                  }
                }

                let quantityErrorsStatus = false;
                // quantity
                if (color.colorQuantity != null) {
                  if (typeof color.colorQuantity !== "number") {
                    colorValidationErrors.push(
                      `❌ Color quantity${size.sizeName != null && typeof size.sizeName === "string" ? ` for size "${size.sizeName}"` : ""} at color index ${colorIndex + 1} must be a number.`
                    );
                    quantityErrorsStatus = true;
                  } else if (color.colorQuantity <= 0) {
                    colorValidationErrors.push(
                      `❌ Color quantity for size "${size.sizeName}" at color index ${colorIndex + 1} cannot be negative.`
                    );
                    quantityErrorsStatus = true;
                  } else if (!Number.isInteger(color.colorQuantity)) {
                    colorValidationErrors.push(
                      `❌ Color quantity for size "${size.sizeName}" at color index ${colorIndex + 1} must be an integer.`
                    );
                    quantityErrorsStatus = true;
                  }
                }

                if (color.type != null && typeof color.type === "string" && (color.type === "new" || color.type === "update")) {
                  // type === "new"
                  if (color.type === "new") {
                    if (color.colorName != null && typeof color.colorName === "string") {
                      if (
                        size.deleteColors != null &&
                        Array.isArray(size.deleteColors) &&
                        size.deleteColors.length > 0 &&
                        size.deleteColors?.includes(color.colorName)
                      ) {
                        colorValidationErrors.push(
                          `❌ Color "${color.colorName}" cannot be added because it is scheduled for deletion.`
                        );
                      }
                    }
                    if (color.colorQuantity == null) {
                      colorValidationErrors.push(
                        `❌ Please specify the quantity for the new color "${color.colorName}" in size "${size.sizeName}".`
                      );
                    }
                    if (color.newColorName != null) {
                      colorValidationErrors.push(
                        `❌ For new colors in size "${size.sizeName}", use "Color Name" only.`
                      );
                    }
                    if (original != null && color.colorName != null && typeof color.colorName === "string") {
                      const newColorNameIsExist = original.colors.find(
                        (c) =>
                          c.color.toLowerCase() === color.colorName?.toLowerCase()
                      );
                      if (newColorNameIsExist) {
                        colorValidationErrors.push(
                          `❌ The color name "${color.colorName}" already exists in size "${original.size}".`
                        );
                      }
                    }
                  }
  
                  // type === "update"
                  if (color.type === "update") {
                    if (color.colorName != null && typeof color.colorName === "string") {
                      if (
                        size.deleteColors != null &&
                        Array.isArray(size.deleteColors) &&
                        size.deleteColors.length > 0 &&
                        size.deleteColors?.includes(color.colorName)
                      ) {
                        colorValidationErrors.push(
                          `❌ Color "${color.colorName}" cannot be updated because it is scheduled for deletion.`
                        );
                      }

                      if (original != null) {
                        const existingColor = original.colors.find(
                          (c) =>
                            c.color.toLowerCase() === color.colorName?.toLowerCase()
                        );
                        if (!existingColor) {
                          colorValidationErrors.push(
                            `❌ The original color "${color.colorName}" does not exist in size "${original.size}".`
                          );
                        } else {

                            let isSameQuantity =
                              color.colorQuantity == null || quantityErrorsStatus ||
                              color.colorQuantity === existingColor.quantity;

                          const isSameName =
                            color.newColorName == null || 
                            typeof color.newColorName !== "string" ||
                            color.newColorName?.toLowerCase() ===
                              color.colorName?.toLowerCase();

                          if (isSameQuantity && isSameName) {
                            colorValidationErrors.push(
                              `❌ No update provided for the color "${color.colorName}" in size "${original.size}".`
                            );
                          }
                        }
                      }
                    }
                    if (color.newColorName != null && typeof color.newColorName !== "string") {
                      colorValidationErrors.push(
                        `❌ New color name ${size.sizeName != null && typeof size.sizeName === "string" ? `for size "${size.sizeName}"` : ""} at color index ${colorIndex + 1} must be a string.`
                      );
                    } else if (color.newColorName != null) {
                      if (
                        size.deleteColors != null &&
                        Array.isArray(size.deleteColors) &&
                        size.deleteColors.length > 0 &&
                        size.deleteColors?.includes(color.newColorName)
                      ) {
                        colorValidationErrors.push(
                          `❌ Cannot rename the color to "${color.newColorName}" because it is marked for deletion.`
                        );
                      }

                      if (original != null) {
                        const newColorNameIsExist = original.colors.find(
                          (c) =>
                            c.color.toLowerCase() ===
                            color.newColorName?.toLowerCase()
                        );
                        if (newColorNameIsExist) {
                          colorValidationErrors.push(
                            `❌ The new color name "${color.newColorName}" already exists in size "${original.size}".`
                          );
                        }
                      }
                    }
                  }
                }

                // push seen names
                if (color.colorName)
                  seenOldColorNames.push(color.colorName?.toLowerCase());
                if (color.newColorName)
                  seenNewColorNames.push(color.newColorName?.toLowerCase());

                // لو فيه أخطاء للـ color ده، نضيفها في colorErrors
                if (colorValidationErrors.length > 0) {
                  colorErrors.push({
                    colorIndex,
                    message: colorValidationErrors,
                  });
                }
              });

              // لو فيه أخطاء ألوان في الـ size ده، نضيفها في updateSizeColorsErrors
              if (colorErrors.length > 0) {
                updateSizeColorsErrors.push({
                  index: index, // index الـ size
                  colors: colorErrors,
                });
              }
            }

            // Done
            if (original != null) {
              const allOriginalColorsDeleted =
                Array.isArray(original.colors) &&
                original.colors.length > 0 && // ✅ شرط وجود ألوان
                Array.isArray(size.deleteColors) &&
                size.deleteColors.length === original.colors.length &&
                original.colors.every((oc) =>
                  size.deleteColors.some(
                    (dc) => dc.toLowerCase() === oc.color.toLowerCase()
                  )
                );

              const hasNewOrUpdatedColors =
                Array.isArray(size.sizeColors) &&
                size.sizeColors.some(
                  (c) => c.type === "new" || c.type === "update"
                );

              if (size.sizeQuantity != null) {
                const hasOriginalColors = original.colors.length > 0;

                if (hasNewOrUpdatedColors) {
                  errors.push(
                    `❌ Cannot update size quantity for "${size.sizeName}" while adding or updating colors.`
                  );
                }

                // الحالة 1: فيه ألوان أصلية
                if (hasOriginalColors) {
                  if (
                    !Array.isArray(size.deleteColors) ||
                    size.deleteColors.length === 0
                  ) {
                    errors.push(
                      `❌ You must delete all colors for size "${size.sizeName}" before adding a new quantity.`
                    );
                  }

                  if (!allOriginalColorsDeleted) {
                    errors.push(
                      `❌ Cannot update quantity for size "${size.sizeName}" because it still has existing colors. Please delete them first.`
                    );
                  }
                }

                // الحالة 2: مفيش ألوان أصلية
                if (!hasOriginalColors) {
                  if (
                    Array.isArray(size.deleteColors) &&
                    size.deleteColors.length > 0
                  ) {
                    errors.push(
                      `❌ Cannot delete colors for "${size.sizeName}" because it has no original colors.`
                    );
                  }
                }
              } else if (allOriginalColorsDeleted && !hasNewOrUpdatedColors) {
                errors.push(
                  `If you want to delete all colors for size "${size.sizeName}", you must also provide a general quantity for the size.`
                );
              }
            }

            // Done
            if (size.sizeName != null && typeof size.sizeName === "string") {
              seenSizeNames.push(size.sizeName.toLowerCase());
            }
            
            if (
              size.newSizeName != null &&
              typeof size.newSizeName === "string"
            ) {
              seenNewSizeNames.push(size.newSizeName.toLowerCase());
            }

            if (errors.length > 0) {
              updateSizesErrors.push({
                index: index,
                message: errors,
              });
            }
          });

          if (updateSizesErrors.length > 0) {
            validationErrors.updateSizes = updateSizesErrors;
            updateStatus = false;
          }

          if (updateSizeColorsErrors.length > 0) {
            validationErrors.updateSizeColors = updateSizeColorsErrors;
            updateStatus = false;
          }
        }

        if (
          addSizes != null &&
          Array.isArray(addSizes) &&
          addSizes.length > 0
        ) {
          const addSizesErrors = [];
          const addSizeColorsErrors = [];

          addSizes.forEach((size, i) => {
            const errors = [];

            if (size.size == null) {
              errors.push(`❌ Size name is required.`);
            } else if (typeof size.size !== "string") {
              errors.push(`❌ Size name must be a string.`);
            } else {
              const sizeIsExist = product.sizes.find(
                (s) => s.size.toLowerCase() === size.size.toLowerCase()
              );

              if (sizeIsExist) {
                errors.push(
                  `❌ Size "${size.size}" already exists in the product.`
                );
              }

              if (seenNewSizeNames.includes(size.size.toLowerCase())) {
                errors.push(
                  `❌ Duplicate size "${size.size}" in addSizes at index ${i}.`
                );
              }
            }

            if (size.price == null) {
              errors.push(`❌ Price is required.`);
            } else if (typeof size.price !== "number") {
              errors.push(`❌ Price must be a number.`);
            } else if (size.price <= 0) {
              errors.push(`❌ Price must be greater than 0.`);
            }

            if (size.priceAfterDiscount != null) {
              if (typeof size.priceAfterDiscount !== "number") {
                errors.push(`❌ priceAfterDiscount must be a number.`);
              } else if (size.priceAfterDiscount <= 0) {
                errors.push(`❌ priceAfterDiscount must be greater than 0.`);
              } else if (size.priceAfterDiscount > size.price) {
                errors.push(
                  `❌ priceAfterDiscount must be less than or equal to price.`
                );
              }
            }

            if (size.quantity != null) {
              if (typeof size.quantity !== "number") {
                errors.push(`❌ quantity must be a number.`);
              } else if (!Number.isInteger(size.quantity)) {
                errors.push(`❌ quantity must be an integer.`);
              } else if (size.quantity <= 0) {
                errors.push(`❌ quantity must be greater than 0.`);
              }

              if (size.colors != null) {
                errors.push(
                  `❌ You can't define both quantity and colors at the same time.`
                );
              }
            }

            if (size.quantity == null && size.colors == null) {
              errors.push(`❌ You must define either quantity or colors.`);
            }

            // الألوان فقط
            if (size.quantity == null && size.colors != null) {
              if (!Array.isArray(size.colors)) {
                errors.push(`❌ colors must be an array.`);
              } else if (size.colors.length === 0) {
                errors.push(`❌ colors array must not be empty.`);
              } else {
                const seenColorNames = [];
                const colorErrors = [];

                size.colors.forEach((c, colorIndex) => {
                  const colorValidationErrors = [];

                  if (c.color == null) {
                    colorValidationErrors.push(
                      `❌ Color name is required in colors[${colorIndex}].`
                    );
                  } else if (typeof c.color !== "string") {
                    colorValidationErrors.push(
                      `❌ Color must be a string in colors[${colorIndex}].`
                    );
                  } else if (seenColorNames.includes(c.color.toLowerCase())) {
                    colorValidationErrors.push(
                      `❌ Duplicate color "${c.color}" in colors[${colorIndex}].`
                    );
                  } else {
                    seenColorNames.push(c.color.toLowerCase());
                  }

                  if (c.quantity == null) {
                    colorValidationErrors.push(
                      `❌ quantity is required in colors[${colorIndex}].`
                    );
                  } else if (typeof c.quantity !== "number") {
                    colorValidationErrors.push(
                      `❌ quantity must be a number in colors[${colorIndex}].`
                    );
                  } else if (!Number.isInteger(c.quantity)) {
                    colorValidationErrors.push(
                      `❌ quantity must be an integer in colors[${colorIndex}].`
                    );
                  } else if (c.quantity <= 0) {
                    colorValidationErrors.push(
                      `❌ quantity must be greater than 0 in colors[${colorIndex}].`
                    );
                  }

                  if (colorValidationErrors.length > 0) {
                    colorErrors.push({
                      colorIndex,
                      message: colorValidationErrors,
                    });
                  }
                });

                if (colorErrors.length > 0) {
                  addSizeColorsErrors.push({
                    index: i,
                    colors: colorErrors,
                  });
                }
              }
            }

            if (errors.length > 0) {
              addSizesErrors.push({
                index: i,
                message: errors,
              });
            }
          });

          if (addSizesErrors.length > 0) {
            validationErrors.addSizes = addSizesErrors;
            updateStatus = false;
          }

          if (addSizeColorsErrors.length > 0) {
            validationErrors.addSizeColors = addSizeColorsErrors;
            updateStatus = false;
          }
        }

        // update product and update carts
        if (updateStatus) {
          if (
            deleteSizes != null &&
            Array.isArray(deleteSizes) &&
            deleteSizes.length > 0
          ) {
            const deleteSizesPromises = deleteSizes.map(async (s) => {
              product.sizes = product.sizes.filter(
                (size) => size.size.toLowerCase() !== s.toLowerCase()
              );

              const cartsToUpdate = await Cart.find({
                "cartItems.product": product._id,
                "cartItems.size": s,
              }).session(session);

              let cartsNeedingUpdate = 0;

              const updateResults = await Promise.all(
                cartsToUpdate.map(async (cart) => {
                  let shouldUpdateCart = false;
                  const updatedItems = cart.cartItems.map((item) => {
                    if (
                      item.product._id.equals(product._id) &&
                      item.size.toLowerCase() === s.toLowerCase()
                    ) {
                      if (item.isAvailable) {
                        item.isAvailable = false;
                        shouldUpdateCart = true;
                      }
                    }
                    return item;
                  });

                  if (shouldUpdateCart) {
                    cartsNeedingUpdate++;

                    const result = await Cart.updateOne(
                      { _id: cart._id },
                      {
                        $set: {
                          cartItems: updatedItems,
                          totalCartPrice: calcTotalCartPrice({
                            cartItems: updatedItems,
                          }),
                        },
                      },
                      { session }
                    );

                    return result.modifiedCount;
                  }

                  return 0;
                })
              );

              const modifiedCartsCount = updateResults.reduce(
                (sum, count) => sum + count,
                0
              );

              if (modifiedCartsCount < cartsNeedingUpdate) {
                throw new ApiError(
                  `Not all carts were updated after deleting size "${s}"". Transaction rolled back.`,
                  400
                );
              }
            });

            await Promise.all(deleteSizesPromises);
          }

          if (
            updateSizes != null &&
            Array.isArray(updateSizes) &&
            updateSizes.length > 0
          ) {
            const updateSizesPromises = updateSizes.map(async (size) => {
              // Find the target size in the product based on the provided size name (case insensitive)
              let productSize = product.sizes.find(
                (s) => s.size.toLowerCase() === size.sizeName.toLowerCase()
              );

              // If the size doesn't exist in the product, abort the operation
              if (!productSize) {
                throw new ApiError(
                  `Size "${size.sizeName}" not found in the product.`,
                  400
                );
              }

              if (size.sizePrice != null) {
                productSize.price = size.sizePrice;

                if (size.sizePriceAfterDiscount != null) {
                  productSize.priceAfterDiscount = size.sizePriceAfterDiscount;
                }
              } else if (size.sizePriceAfterDiscount != null) {
                productSize.priceAfterDiscount = size.sizePriceAfterDiscount;
              }

              if (size.deletePriceAfterDiscount) {
                // Ensure there is a priceAfterDiscount to delete
                if (productSize.priceAfterDiscount == null) {
                  throw new ApiError(
                    `Cannot delete the price after discount for size "${size.sizeName}" because it does not have a price after discount.`,
                    400
                  );
                }

                // Remove the priceAfterDiscount from the product size
                productSize.priceAfterDiscount = undefined;
              }

              if (size.sizeQuantity != null) {
                productSize.quantity = size.sizeQuantity;
              }

              const allOriginalColorsDeleted =
                Array.isArray(productSize.colors) &&
                productSize.colors.length > 0 && // ✅ شرط وجود ألوان
                Array.isArray(size.deleteColors) &&
                size.deleteColors.length === productSize.colors.length &&
                productSize.colors.every((oc) =>
                  size.deleteColors.some(
                    (dc) => dc.toLowerCase() === oc.color.toLowerCase()
                  )
                );

              const hasNewOrUpdatedColors =
                Array.isArray(size.sizeColors) &&
                size.sizeColors.some(
                  (c) => c.type === "new" || c.type === "update"
                );

              if (allOriginalColorsDeleted && !hasNewOrUpdatedColors) {
                const cartsToUpdate = await Cart.find({
                  "cartItems.product": product._id,
                  "cartItems.size": size.sizeName,
                }).session(session);

                let cartsNeedingUpdate = 0;

                const updateResults = await Promise.all(
                  cartsToUpdate.map(async (cart) => {
                    let shouldUpdateCart = false;
                    const updatedItems = cart.cartItems.map((item) => {
                      if (
                        item.product._id.equals(product._id) &&
                        item.size.toLowerCase() ===
                          size.sizeName.toLowerCase() &&
                        item.color == null
                      ) {
                        item.isAvailable = true;
                        shouldUpdateCart = true;

                        if (
                          size.sizeQuantity != null &&
                          item.quantity !== size.sizeQuantity &&
                          item.quantity > size.sizeQuantity
                        ) {
                          item.quantity = size.sizeQuantity;
                          shouldUpdateCart = true;
                        } else if (
                          productSize.quantity != null &&
                          item.quantity !== productSize.quantity &&
                          item.quantity > productSize.quantity
                        ) {
                          item.quantity = productSize.quantity;
                          shouldUpdateCart = true;
                        }

                        if (
                          size.priceAfterDiscount != null &&
                          item.price !== size.priceAfterDiscount
                        ) {
                          item.price = size.priceAfterDiscount;
                          shouldUpdateCart = true;
                        } else if (
                          productSize.priceAfterDiscount != null &&
                          item.price !== productSize.priceAfterDiscount
                        ) {
                          item.price = productSize.priceAfterDiscount;
                          shouldUpdateCart = true;
                        } else if (
                          size.price != null &&
                          item.price !== size.price
                        ) {
                          item.price = size.price;
                          shouldUpdateCart = true;
                        } else if (
                          productSize.price != null &&
                          item.price !== productSize.price
                        ) {
                          item.price = productSize.price;
                          shouldUpdateCart = true;
                        }
                      }
                      return item;
                    });

                    if (shouldUpdateCart) {
                      cartsNeedingUpdate++;
                      const result = await Cart.updateOne(
                        { _id: cart._id },
                        {
                          $set: {
                            cartItems: updatedItems,
                            totalCartPrice: calcTotalCartPrice({
                              cartItems: updatedItems,
                            }),
                          },
                        },
                        { session }
                      );

                      return result.modifiedCount;
                    }

                    return 0;
                  })
                );

                const modifiedCartsCount = updateResults.reduce(
                  (sum, count) => sum + count,
                  0
                );

                if (modifiedCartsCount < cartsNeedingUpdate) {
                  throw new ApiError(
                    `Not all carts were updated after deleting all colors for size "${size.sizeName}". Transaction rolled back.`,
                    400
                  );
                }
              }

              if (
                size.deleteColors != null &&
                Array.isArray(size.deleteColors) &&
                size.deleteColors.length > 0
              ) {
                const deleteColorsPromises = updateSizes.map(async (c) => {
                  productSize.colors = productSize.colors.filter(
                    (color) => color.color.toLowerCase() !== c.toLowerCase()
                  );

                  const cartsToUpdate = await Cart.find({
                    "cartItems.product": product._id,
                    "cartItems.size": size.sizeName,
                    "cartItems.color": c,
                  }).session(session);

                  let cartsNeedingUpdate = 0;

                  const updateResults = await Promise.all(
                    cartsToUpdate.map(async (cart) => {
                      let shouldUpdateCart = false;
                      const updatedItems = cart.cartItems.map((item) => {
                        if (
                          item.product._id.equals(product._id) &&
                          item.size.toLowerCase() ===
                            size.sizeName.toLowerCase() &&
                          item.color.toLowerCase() === c.toLowerCase()
                        ) {
                          item.isAvailable = false;
                          shouldUpdateCart = true;
                        }
                        return item;
                      });

                      if (shouldUpdateCart) {
                        cartsNeedingUpdate++;

                        const result = await Cart.updateOne(
                          { _id: cart._id },
                          {
                            $set: {
                              cartItems: updatedItems,
                              totalCartPrice: calcTotalCartPrice({
                                cartItems: updatedItems,
                              }),
                            },
                          },
                          { session }
                        );

                        return result.modifiedCount;
                      }

                      return 0;
                    })
                  );

                  const modifiedCartsCount = updateResults.reduce(
                    (sum, count) => sum + count,
                    0
                  );

                  if (modifiedCartsCount < cartsNeedingUpdate) {
                    throw new ApiError(
                      `Not all carts were updated after deleting color "${c}" for size "${size.sizeName}". Transaction rolled back.`,
                      400
                    );
                  }
                });

                await Promise.all(deleteColorsPromises);
              }

              const isFirstTimeAddingColors =
                (!Array.isArray(productSize.colors) ||
                  productSize.colors.length === 0) &&
                Array.isArray(size.sizeColors) &&
                size.sizeColors.some((c) => c.type === "new");

              if (isFirstTimeAddingColors) {
                const cartsToUpdate = await Cart.find({
                  "cartItems.product": product._id,
                  "cartItems.size": size.sizeName,
                }).session(session);

                let cartsNeedingUpdate = 0;

                const updateResults = await Promise.all(
                  cartsToUpdate.map(async (cart) => {
                    let shouldUpdateCart = false;
                    const updatedItems = cart.cartItems.map((item) => {
                      if (
                        item.product._id.equals(product._id) &&
                        item.size.toLowerCase() ===
                          size.sizeName.toLowerCase() &&
                        item.color == null
                      ) {
                        item.isAvailable = false;
                        shouldUpdateCart = true;
                      }
                      return item;
                    });

                    if (shouldUpdateCart) {
                      cartsNeedingUpdate++;
                      const result = await Cart.updateOne(
                        { _id: cart._id },
                        {
                          $set: {
                            cartItems: updatedItems,
                            totalCartPrice: calcTotalCartPrice({
                              cartItems: updatedItems,
                            }),
                          },
                        },
                        { session }
                      );

                      return result.modifiedCount;
                    }

                    return 0;
                  })
                );

                const modifiedCartsCount = updateResults.reduce(
                  (sum, count) => sum + count,
                  0
                );

                if (modifiedCartsCount < cartsNeedingUpdate) {
                  throw new ApiError(
                    `Not all carts were updated after disabling items with no color for size "${size.sizeName}" during first-time color addition. Transaction rolled back.`,
                    400
                  );
                }
              }

              if (
                size.sizeColors != null &&
                Array.isArray(size.sizeColors) &&
                size.sizeColors.length > 0
              ) {
                const isMatchingCartItem = (item, productId, colorName) =>
                  item.product._id.equals(productId) &&
                  item.size.toLowerCase() === size.sizeName.toLowerCase() &&
                  item.color.toLowerCase() === colorName.toLowerCase();

                if (productSize.quantity != null) {
                  productSize.quantity = undefined;
                }

                const updateColorPromises = size.sizeColors.map(
                  async (color) => {
                    if (color.type === "new") {
                      const cartsToUpdate = await Cart.find({
                        "cartItems.product": product._id,
                        "cartItems.size": size.sizeName,
                        "cartItems.color": color.colorName,
                      }).session(session);

                      productSize.colors.push({
                        color: color.colorName,
                        quantity: color.colorQuantity,
                      });

                      if (cartsToUpdate.length !== 0) {
                        let cartsNeedingUpdate = 0;

                        const updateResults = await Promise.all(
                          cartsToUpdate.map(async (cart) => {
                            let shouldUpdateCart = false;
                            const updatedItems = cart.cartItems.map((item) => {
                              if (
                                isMatchingCartItem(
                                  item,
                                  product._id,
                                  color.colorName
                                )
                              ) {
                                shouldUpdateCart = true;
                                item.isAvailable = true;

                                if (
                                  color.colorQuantity != null &&
                                  item.quantity !== color.colorQuantity
                                ) {
                                  item.quantity = Math.min(
                                    item.quantity,
                                    color.colorQuantity
                                  );
                                }

                                if (
                                  size.priceAfterDiscount != null &&
                                  item.price !== size.priceAfterDiscount
                                ) {
                                  item.price = size.priceAfterDiscount;
                                } else if (
                                  productSize.priceAfterDiscount != null &&
                                  item.price !== productSize.priceAfterDiscount
                                ) {
                                  item.price = productSize.priceAfterDiscount;
                                } else if (
                                  size.price != null &&
                                  item.price !== size.price
                                ) {
                                  item.price = size.price;
                                } else if (
                                  productSize.price != null &&
                                  item.price !== productSize.price
                                ) {
                                  item.price = productSize.price;
                                }
                              }
                              return item;
                            });

                            if (shouldUpdateCart) {
                              cartsNeedingUpdate++;

                              const result = await Cart.updateOne(
                                { _id: cart._id },
                                {
                                  $set: {
                                    cartItems: updatedItems,
                                    totalCartPrice: calcTotalCartPrice({
                                      cartItems: updatedItems,
                                    }),
                                  },
                                },
                                { session }
                              );

                              return result.modifiedCount; // 1 if modified, 0 otherwise
                            }
                            return 0; // 1 if modified, 0 otherwise
                          })
                        );

                        const modifiedCartsCount = updateResults.reduce(
                          (sum, count) => sum + count,
                          0
                        );

                        if (modifiedCartsCount < cartsNeedingUpdate) {
                          throw new ApiError(
                            `Not all carts were updated after changing quantity for size "${size.sizeName}". Transaction rolled back.`,
                            400
                          );
                        }
                      }
                    } else if (color.type === "update") {
                      productSize.colors.forEach((c) => {
                        if (
                          c.color.toLowerCase() ===
                          color.colorName.toLowerCase()
                        ) {
                          if (color.newColorName != null) {
                            c.color = color.newColorName;
                          }

                          if (color.colorQuantity != null) {
                            c.quantity = color.colorQuantity;
                          }
                        }
                      });

                      const currentCartsToUpdate = await Cart.find({
                        "cartItems.product": product._id,
                        "cartItems.size": size.sizeName,
                        "cartItems.color": color.colorName,
                      }).session(session);

                      if (currentCartsToUpdate.length !== 0) {
                        let currentCartsNeedingUpdate = 0;

                        const currentUpdateResults = await Promise.all(
                          currentCartsToUpdate.map(async (cart) => {
                            let shouldUpdateCart = false;
                            const updatedItems = cart.cartItems.map((item) => {
                              if (
                                isMatchingCartItem(
                                  item,
                                  product._id,
                                  color.colorName
                                )
                              ) {
                                if (color.newColorName != null) {
                                  item.isAvailable = false;
                                  shouldUpdateCart = true;
                                }

                                if (
                                  color.colorQuantity != null &&
                                  item.quantity !== color.colorQuantity &&
                                  item.quantity > color.colorQuantity
                                ) {
                                  item.quantity = color.colorQuantity;
                                  shouldUpdateCart = true;
                                }

                                if (
                                  size.priceAfterDiscount != null &&
                                  item.price !== size.priceAfterDiscount
                                ) {
                                  item.price = size.priceAfterDiscount;
                                  shouldUpdateCart = true;
                                } else if (
                                  productSize.priceAfterDiscount != null &&
                                  item.price !== productSize.priceAfterDiscount
                                ) {
                                  item.price = productSize.priceAfterDiscount;
                                  shouldUpdateCart = true;
                                } else if (
                                  size.price != null &&
                                  item.price !== size.price
                                ) {
                                  item.price = size.price;
                                  shouldUpdateCart = true;
                                } else if (
                                  productSize.price != null &&
                                  item.price !== productSize.price
                                ) {
                                  item.price = productSize.price;
                                  shouldUpdateCart = true;
                                }
                              }
                              return item;
                            });

                            if (shouldUpdateCart) {
                              currentCartsNeedingUpdate++;

                              const result = await Cart.updateOne(
                                { _id: cart._id },
                                {
                                  $set: {
                                    cartItems: updatedItems,
                                    totalCartPrice: calcTotalCartPrice({
                                      cartItems: updatedItems,
                                    }),
                                  },
                                },
                                { session }
                              );

                              return result.modifiedCount; // 1 if modified, 0 otherwise
                            }

                            return 0; // 1 if modified, 0 otherwise
                          })
                        );

                        const modifiedCurrentCartsCount =
                          currentUpdateResults.reduce(
                            (sum, count) => sum + count,
                            0
                          );

                        if (
                          modifiedCurrentCartsCount < currentCartsNeedingUpdate
                        ) {
                          throw new ApiError(
                            `Not all carts were updated after changing quantity for size "${size.sizeName}". Transaction rolled back.`,
                            400
                          );
                        }
                      }

                      if (color.newColorName != null) {
                        const oldCartsToUpdate = await Cart.find({
                          "cartItems.product": product._id,
                          "cartItems.size": size.sizeName,
                          "cartItems.color": color.newColorName,
                        }).session(session);

                        if (oldCartsToUpdate.length !== 0) {
                          let oldCartsNeedingUpdate = 0;

                          const oldUpdateResults = await Promise.all(
                            oldCartsToUpdate.map(async (cart) => {
                              let shouldUpdateCart = false;
                              const updatedItems = cart.cartItems.map(
                                (item) => {
                                  if (
                                    isMatchingCartItem(
                                      item,
                                      product._id,
                                      color.newColorName
                                    )
                                  ) {
                                    item.isAvailable = true;
                                    if (
                                      color.colorQuantity != null &&
                                      item.quantity !== color.colorQuantity
                                    ) {
                                      item.quantity = Math.min(
                                        item.quantity,
                                        color.colorQuantity
                                      );
                                    }

                                    if (
                                      size.priceAfterDiscount != null &&
                                      item.price !== size.priceAfterDiscount
                                    ) {
                                      item.price = size.priceAfterDiscount;
                                    } else if (
                                      productSize.priceAfterDiscount != null &&
                                      item.price !==
                                        productSize.priceAfterDiscount
                                    ) {
                                      item.price =
                                        productSize.priceAfterDiscount;
                                    } else if (
                                      size.price != null &&
                                      item.price !== size.price
                                    ) {
                                      item.price = size.price;
                                    } else if (
                                      productSize.price != null &&
                                      item.price !== productSize.price
                                    ) {
                                      item.price = productSize.price;
                                    }
                                    shouldUpdateCart = true;
                                  }
                                  return item;
                                }
                              );

                              if (shouldUpdateCart) {
                                oldCartsNeedingUpdate++;

                                const result = await Cart.updateOne(
                                  { _id: cart._id },
                                  {
                                    $set: {
                                      cartItems: updatedItems,
                                      totalCartPrice: calcTotalCartPrice({
                                        cartItems: updatedItems,
                                      }),
                                    },
                                  },
                                  { session }
                                );

                                return result.modifiedCount; // 1 if modified, 0 otherwise
                              }

                              return 0;
                            })
                          );

                          const modifiedOldCartsCount = oldUpdateResults.reduce(
                            (sum, count) => sum + count,
                            0
                          );

                          if (modifiedOldCartsCount < oldCartsNeedingUpdate) {
                            throw new ApiError(
                              `Not all carts were updated after changing quantity for size "${size.sizeName}". Transaction rolled back.`,
                              400
                            );
                          }
                        }
                      }
                    }
                  }
                );

                await Promise.all(updateColorPromises);
              }

              // Find all carts that contain this product and size (before renaming)
              const cartsToUpdate = await Cart.find({
                "cartItems.product": product._id,
                "cartItems.size": size.sizeName,
              }).session(session);

              let cartsNeedingUpdate = 0;

              // Loop through carts and update matching cart items
              const updateResults = await Promise.all(
                cartsToUpdate.map(async (cart) => {
                  let shouldUpdateCart = false;
                  const updatedItems = cart.cartItems.map((item) => {
                    // Match the specific product and size in the cart
                    if (
                      item.product._id.equals(product._id) &&
                      item.size.toLowerCase() === size.sizeName.toLowerCase()
                    ) {
                      if (
                        item.color != null &&
                        Array.isArray(productSize.colors) &&
                        productSize.colors.length > 0
                      ) {
                        const colorIsExist = productSize.colors.find(
                          (c) =>
                            c.color.toLowerCase() === item.color.toLowerCase()
                        );

                        if (colorIsExist) {
                          if (size.newSizeName) {
                            if (item.isAvailable) {
                              item.isAvailable = false;
                              shouldUpdateCart = true;
                            }
                          } else {
                            if (!item.isAvailable) {
                              item.isAvailable = true;
                              shouldUpdateCart = true;
                            }

                            if (
                              item.quantity !== colorIsExist.quantity &&
                              item.quantity > colorIsExist.quantity
                            ) {
                              item.quantity = colorIsExist.quantity;
                              shouldUpdateCart = true;
                            }

                            if (
                              size.priceAfterDiscount != null &&
                              item.price !== size.priceAfterDiscount
                            ) {
                              item.price = size.priceAfterDiscount;
                              shouldUpdateCart = true;
                            } else if (
                              productSize.priceAfterDiscount != null &&
                              item.price !== productSize.priceAfterDiscount
                            ) {
                              item.price = productSize.priceAfterDiscount;
                              shouldUpdateCart = true;
                            } else if (
                              size.price != null &&
                              item.price !== size.price
                            ) {
                              item.price = size.price;
                              shouldUpdateCart = true;
                            } else if (
                              productSize.price != null &&
                              item.price !== productSize.price
                            ) {
                              item.price = productSize.price;
                              shouldUpdateCart = true;
                            }
                          }
                        } else if (item.isAvailable) {
                          item.isAvailable = false;
                          shouldUpdateCart = true;
                        }
                      } else if (
                        item.color == null &&
                        Array.isArray(productSize.colors) &&
                        productSize.colors.length === 0
                      ) {
                        if (size.newSizeName != null) {
                          if (item.isAvailable) {
                            item.isAvailable = false;
                            shouldUpdateCart = true;
                          }
                        } else {
                          if (
                            size.sizeQuantity != null &&
                            item.quantity !== size.sizeQuantity &&
                            item.quantity > size.sizeQuantity
                          ) {
                            item.quantity = size.sizeQuantity;
                            shouldUpdateCart = true;
                          }

                          if (
                            size.priceAfterDiscount != null &&
                            item.price !== size.priceAfterDiscount
                          ) {
                            item.price = size.priceAfterDiscount;
                            shouldUpdateCart = true;
                          } else if (
                            productSize.priceAfterDiscount != null &&
                            item.price !== productSize.priceAfterDiscount
                          ) {
                            item.price = productSize.priceAfterDiscount;
                            shouldUpdateCart = true;
                          } else if (
                            size.price != null &&
                            item.price !== size.price
                          ) {
                            item.price = size.price;
                            shouldUpdateCart = true;
                          } else if (
                            productSize.price != null &&
                            item.price !== productSize.price
                          ) {
                            item.price = productSize.price;
                            shouldUpdateCart = true;
                          }
                        }
                      }
                    }
                    return item;
                  });

                  if (shouldUpdateCart) {
                    cartsNeedingUpdate++;

                    // Save the updated cart items and recalculate total price
                    const result = await Cart.updateOne(
                      { _id: cart._id },
                      {
                        $set: {
                          cartItems: updatedItems,
                          totalCartPrice: calcTotalCartPrice({
                            cartItems: updatedItems,
                          }),
                        },
                      },
                      { session }
                    );

                    // Return number of modified documents (1 or 0)
                    return result.modifiedCount;
                  }

                  return 0;
                })
              );

              // Sum up all updated cart counts
              const modifiedCartsCount = updateResults.reduce(
                (sum, count) => sum + count,
                0
              );

              // Rollback if not all matching carts were updated successfully
              if (modifiedCartsCount < cartsNeedingUpdate) {
                throw new ApiError(
                  `Not all carts were updated for size "${size.sizeName}". Transaction rolled back.`,
                  400
                );
              }

              // If a new size name is specified, update all carts with the new size name
              if (size.newSizeName) {
                const newCartsToUpdate = await Cart.find({
                  "cartItems.product": product._id,
                  "cartItems.size": size.newSizeName,
                }).session(session);

                let newSizeNameCartsNeedingUpdate = 0;

                const updateNewResults = await Promise.all(
                  newCartsToUpdate.map(async (cart) => {
                    let shouldUpdateCart = false;
                    const updatedItems = cart.cartItems.map((item) => {
                      // Match product and new size in cart
                      if (
                        item.product._id.equals(product._id) &&
                        item.size.toLowerCase() ===
                          size.newSizeName.toLowerCase()
                      ) {
                        if (
                          item.color != null &&
                          Array.isArray(productSize.colors) &&
                          productSize.colors.length > 0
                        ) {
                          const colorIsExist = productSize.colors.find(
                            (c) =>
                              c.color.toLowerCase() === item.color.toLowerCase()
                          );

                          if (colorIsExist) {
                            if (!item.isAvailable) {
                              item.isAvailable = true;
                              shouldUpdateCart = true;
                            }

                            if (
                              item.quantity !== colorIsExist.quantity &&
                              item.quantity > colorIsExist.quantity
                            ) {
                              item.quantity = colorIsExist.quantity;
                              shouldUpdateCart = true;
                            }

                            if (
                              size.priceAfterDiscount != null &&
                              item.price !== size.priceAfterDiscount
                            ) {
                              item.price = size.priceAfterDiscount;
                              shouldUpdateCart = true;
                            } else if (
                              productSize.priceAfterDiscount != null &&
                              item.price !== productSize.priceAfterDiscount
                            ) {
                              item.price = productSize.priceAfterDiscount;
                              shouldUpdateCart = true;
                            } else if (
                              size.price != null &&
                              item.price !== size.price
                            ) {
                              item.price = size.price;
                              shouldUpdateCart = true;
                            } else if (
                              productSize.price != null &&
                              item.price !== productSize.price
                            ) {
                              item.price = productSize.price;
                              shouldUpdateCart = true;
                            }
                          } else if (item.isAvailable) {
                            item.isAvailable = false;
                            shouldUpdateCart = true;
                          }
                        } else if (
                          item.color == null &&
                          Array.isArray(productSize.colors) &&
                          productSize.colors.length === 0
                        ) {
                          if (!item.isAvailable) {
                            item.isAvailable = true;
                            shouldUpdateCart = true;
                          }

                          if (
                            size.sizeQuantity != null &&
                            item.quantity !== size.sizeQuantity &&
                            item.quantity > size.sizeQuantity
                          ) {
                            item.quantity = size.sizeQuantity;
                            shouldUpdateCart = true;
                          } else if (
                            productSize.quantity != null &&
                            item.quantity !== productSize.quantity &&
                            item.quantity > productSize.quantity
                          ) {
                            item.quantity = productSize.quantity;
                            shouldUpdateCart = true;
                          }

                          if (
                            size.priceAfterDiscount != null &&
                            item.price !== size.priceAfterDiscount
                          ) {
                            item.price = size.priceAfterDiscount;
                            shouldUpdateCart = true;
                          } else if (
                            productSize.priceAfterDiscount != null &&
                            item.price !== productSize.priceAfterDiscount
                          ) {
                            item.price = productSize.priceAfterDiscount;
                            shouldUpdateCart = true;
                          } else if (
                            size.price != null &&
                            item.price !== size.price
                          ) {
                            item.price = size.price;
                            shouldUpdateCart = true;
                          } else if (
                            productSize.price != null &&
                            item.price !== productSize.price
                          ) {
                            item.price = productSize.price;
                            shouldUpdateCart = true;
                          }
                        }
                      }
                      return item;
                    });

                    if (shouldUpdateCart) {
                      newSizeNameCartsNeedingUpdate++;

                      // Save updated cart with recalculated total price
                      const result = await Cart.updateOne(
                        { _id: cart._id },
                        {
                          $set: {
                            cartItems: updatedItems,
                            totalCartPrice: calcTotalCartPrice({
                              cartItems: updatedItems,
                            }),
                          },
                        },
                        { session }
                      );

                      return result.modifiedCount;
                    }

                    return 0;
                  })
                );

                const updatedNewCartCount = updateNewResults.reduce(
                  (sum, count) => sum + count,
                  0
                );

                // Rollback if not all carts were successfully updated with the new size name
                if (updatedNewCartCount < newSizeNameCartsNeedingUpdate) {
                  throw new ApiError(
                    `Not all carts were updated after renaming size "${size.sizeName}" to "${size.newSizeName}". Transaction rolled back.`,
                    400
                  );
                }

                // Finally, rename the size in the product itself
                productSize.size = size.newSizeName;
              }
            });

            await Promise.all(updateSizesPromises);
          }

          if (
            addSizes != null &&
            Array.isArray(addSizes) &&
            addSizes.length > 0
          ) {
            const addSizesPromises = addSizes.map(async (size) => {
              product.sizes.push(size);

              const cartsToUpdate = await Cart.find({
                "cartItems.product": product._id,
                "cartItems.size": size.size,
              }).session(session);

              if (cartsToUpdate.length > 0) {
                let cartsNeedingUpdate = 0;

                const updateResults = await Promise.all(
                  cartsToUpdate.map(async (cart) => {
                    let shouldUpdateCart = false;
                    const updatedItems = cart.cartItems.map((item) => {
                      if (
                        item.product._id.equals(product._id) &&
                        item.size.toLowerCase() === size.size.toLowerCase()
                      ) {
                        if (
                          item.color != null &&
                          Array.isArray(size.colors) &&
                          size.colors.length > 0
                        ) {
                          const colorIsExist = size.colors.find(
                            (c) =>
                              c.color.toLowerCase() === item.color.toLowerCase()
                          );

                          if (colorIsExist) {
                            if (!item.isAvailable) {
                              item.isAvailable = true;
                              shouldUpdateCart = true;
                            }

                            if (
                              item.quantity !== colorIsExist.quantity &&
                              item.quantity > colorIsExist.quantity
                            ) {
                              item.quantity = colorIsExist.quantity;
                              shouldUpdateCart = true;
                            }

                            if (
                              size.priceAfterDiscount != null &&
                              item.price !== size.priceAfterDiscount
                            ) {
                              item.price = size.priceAfterDiscount;
                              shouldUpdateCart = true;
                            } else if (
                              size.price != null &&
                              item.price !== size.price
                            ) {
                              item.price = size.price;
                              shouldUpdateCart = true;
                            }
                          } else if (item.isAvailable) {
                            item.isAvailable = false;
                            shouldUpdateCart = true;
                          }
                        } else if (
                          item.color == null &&
                          Array.isArray(size.colors) &&
                          size.colors.length === 0
                        ) {
                          if (!item.isAvailable) {
                            item.isAvailable = true;
                            shouldUpdateCart = true;
                          }

                          if (
                            size.quantity != null &&
                            item.quantity !== size.quantity &&
                            item.quantity > size.quantity
                          ) {
                            item.quantity = size.quantity;
                            shouldUpdateCart = true;
                          }

                          if (
                            size.priceAfterDiscount != null &&
                            item.price !== size.priceAfterDiscount
                          ) {
                            item.price = size.priceAfterDiscount;
                            shouldUpdateCart = true;
                          } else if (
                            size.price != null &&
                            item.price !== size.price
                          ) {
                            item.price = size.price;
                            shouldUpdateCart = true;
                          }
                        }
                      }
                      return item;
                    });

                    if (shouldUpdateCart) {
                      cartsNeedingUpdate++;

                      // Save the updated cart items and recalculate total price
                      const result = await Cart.updateOne(
                        { _id: cart._id },
                        {
                          $set: {
                            cartItems: updatedItems,
                            totalCartPrice: calcTotalCartPrice({
                              cartItems: updatedItems,
                            }),
                          },
                        },
                        { session }
                      );

                      // Return number of modified documents (1 or 0)
                      return result.modifiedCount;
                    }

                    return 0;
                  })
                );

                // Sum up all updated cart counts
                const modifiedCartsCount = updateResults.reduce(
                  (sum, count) => sum + count,
                  0
                );

                // Rollback if not all matching carts were updated successfully
                if (modifiedCartsCount < cartsNeedingUpdate) {
                  throw new ApiError(
                    `Some carts failed to update. All changes have been rolled back.`,
                    400
                  );
                }
              }
            });

            await Promise.all(addSizesPromises);
          }
        }
      } else {
        product.price = undefined;
        product.priceAfterDiscount = undefined;
        product.quantity = undefined;
        product.colors = undefined;

        if (
          addSizes != null &&
          Array.isArray(addSizes) &&
          addSizes.length > 0
        ) {
          const addSizesPromises = addSizes.map(async (size) => {
            product.sizes.push(size);

            const cartsToUpdate = await Cart.find({
              "cartItems.product": product._id,
            }).session(session);

            if (cartsToUpdate.length > 0) {
              let cartsNeedingUpdate = 0;

              const updateResults = await Promise.all(
                cartsToUpdate.map(async (cart) => {
                  let shouldUpdateCart = false;
                  const updatedItems = cart.cartItems.map((item) => {
                    if (
                      item.product._id.equals(product._id) &&
                      item.size.toLowerCase() === size.size.toLowerCase()
                    ) {
                      if (
                        item.color != null &&
                        Array.isArray(size.colors) &&
                        size.colors.length > 0
                      ) {
                        const colorIsExist = size.colors.find(
                          (c) =>
                            c.color.toLowerCase() === item.color.toLowerCase()
                        );

                        if (colorIsExist) {
                          if (!item.isAvailable) {
                            item.isAvailable = true;
                            shouldUpdateCart = true;
                          }

                          if (
                            item.quantity !== colorIsExist.quantity &&
                            item.quantity > colorIsExist.quantity
                          ) {
                            item.quantity = colorIsExist.quantity;
                            shouldUpdateCart = true;
                          }

                          if (
                            size.priceAfterDiscount != null &&
                            item.price !== size.priceAfterDiscount
                          ) {
                            item.price = size.priceAfterDiscount;
                            shouldUpdateCart = true;
                          } else if (
                            size.price != null &&
                            item.price !== size.price
                          ) {
                            item.price = size.price;
                            shouldUpdateCart = true;
                          }
                        } else if (item.isAvailable) {
                          item.isAvailable = false;
                          shouldUpdateCart = true;
                        }
                      } else if (
                        item.color == null &&
                        Array.isArray(size.colors) &&
                        size.colors.length === 0
                      ) {
                        if (!item.isAvailable) {
                          item.isAvailable = true;
                          shouldUpdateCart = true;
                        }

                        if (
                          size.quantity != null &&
                          item.quantity !== size.quantity &&
                          item.quantity > size.quantity
                        ) {
                          item.quantity = size.quantity;
                          shouldUpdateCart = true;
                        }

                        if (
                          size.priceAfterDiscount != null &&
                          item.price !== size.priceAfterDiscount
                        ) {
                          item.price = size.priceAfterDiscount;
                          shouldUpdateCart = true;
                        } else if (
                          size.price != null &&
                          item.price !== size.price
                        ) {
                          item.price = size.price;
                          shouldUpdateCart = true;
                        }
                      }
                    } else if (
                      item.product._id.equals(product._id) &&
                      item.size == null
                    ) {
                      if (item.isAvailable) {
                        item.isAvailable = false;
                        shouldUpdateCart = true;
                      }
                    }
                    return item;
                  });

                  if (shouldUpdateCart) {
                    cartsNeedingUpdate++;

                    // Save the updated cart items and recalculate total price
                    const result = await Cart.updateOne(
                      { _id: cart._id },
                      {
                        $set: {
                          cartItems: updatedItems,
                          totalCartPrice: calcTotalCartPrice({
                            cartItems: updatedItems,
                          }),
                        },
                      },
                      { session }
                    );

                    // Return number of modified documents (1 or 0)
                    return result.modifiedCount;
                  }

                  return 0;
                })
              );

              // Sum up all updated cart counts
              const modifiedCartsCount = updateResults.reduce(
                (sum, count) => sum + count,
                0
              );

              // Rollback if not all matching carts were updated successfully
              if (modifiedCartsCount < cartsNeedingUpdate) {
                throw new ApiError(
                  `Some carts failed to update. All changes have been rolled back.`,
                  400
                );
              }
            }
          });

          await Promise.all(addSizesPromises);
        }

        product.sizesIsExist = true;
      }
    } else {
      // if (addSizes != null) {
      //   return next(
      //     new ApiError(
      //       "Cannot add sizes when the product is not set to support sizes.",
      //       400
      //     )
      //   );
      // }

      // if (updateSizes != null) {
      //   return next(
      //     new ApiError(
      //       "Cannot update sizes when the product is not set to support sizes.",
      //       400
      //     )
      //   );
      // }

      // if (deleteSizes != null) {
      //   return next(
      //     new ApiError(
      //       "Cannot delete sizes when the product is not set to support sizes.",
      //       400
      //     )
      //   );
      // }

      // if (product.sizesIsExist) {
      //   product.sizes = [];
      // }

      // if (
      //   product.sizesIsExist &&
      //   deleteGeneralColors != null &&
      //   deleteGeneralColors?.length > 0
      // ) {
      //   return next(new ApiError("", 400));
      // }

      // if (
      //   !product.sizesIsExist &&
      //   deleteGeneralColors != null &&
      //   product.colors.length === 0
      // ) {
      //   return next(new ApiError("", 400));
      // }

      // if (
      //   product.sizesIsExist &&
      //   updateGeneralColors != null &&
      //   updateGeneralColors?.length > 0
      // ) {
      //   return next(new ApiError("", 400));
      // }

      // if (
      //   !product.sizesIsExist &&
      //   updateGeneralColors != null &&
      //   updateGeneralColors?.length > 0 &&
      //   product.colors.length === 0
      // ) {
      //   return next(new ApiError("", 400));
      // }

      // if (product.sizesIsExist && price == null) {
      //   return next(new ApiError("", 400));
      // }

      // if (
      //   product.sizesIsExist &&
      //   (addGeneralColors == null || addGeneralColors?.length === 0) &&
      //   quantity == null
      // ) {
      //   return next(new ApiError("", 400));
      // }

      // if (price != null && typeof price !== "number") {
      //   return next(new ApiError("", 400));
      // }

      // if (price != null && price < 0) {
      //   return next(new ApiError("", 400));
      // }

      // if (!product.sizesIsExist && price != null && price === product.price) {
      //   return next(new ApiError("", 400));
      // }

      // if (
      //   priceAfterDiscount != null &&
      //   typeof priceAfterDiscount !== "number"
      // ) {
      //   return next(new ApiError("", 400));
      // }

      // if (priceAfterDiscount != null && priceAfterDiscount < 0) {
      //   return next(new ApiError("", 400));
      // }

      // if (
      //   priceAfterDiscount != null &&
      //   price != null &&
      //   priceAfterDiscount >= price
      // ) {
      //   return next(new ApiError("", 400));
      // }

      // if (
      //   !product.sizesIsExist &&
      //   priceAfterDiscount != null &&
      //   price == null &&
      //   priceAfterDiscount >= product.price
      // ) {
      //   return next(new ApiError("", 400));
      // }

      // if (
      //   !product.sizesIsExist &&
      //   priceAfterDiscount != null &&
      //   priceAfterDiscount === product.priceAfterDiscount
      // ) {
      //   return next(new ApiError("", 400));
      // }

      // eslint-disable-next-line no-lonely-if
      if (!product.sizesIsExist) {
        if (price != null) {
          product.price = price;
        }

        if (priceAfterDiscount != null) {
          product.priceAfterDiscount = priceAfterDiscount;
        }

        if (quantity != null) {
          product.quantity = quantity;
        }

        const allOriginalColorsDeleted =
          Array.isArray(product.colors) &&
          product.colors.length > 0 && // ✅ شرط وجود ألوان
          Array.isArray(deleteGeneralColors) &&
          deleteGeneralColors.length === product.colors.length &&
          product.colors.every((oc) =>
            deleteGeneralColors.some(
              (dc) => dc.toLowerCase() === oc.color.toLowerCase()
            )
          );

        const hasNewOrUpdatedColors =
          Array.isArray(colors) &&
          colors.some((c) => c.type === "new" || c.type === "update");

        if (allOriginalColorsDeleted && !hasNewOrUpdatedColors) {
          const cartsToUpdate = await Cart.find({
            "cartItems.product": product._id,
          }).session(session);

          let cartsNeedingUpdate = 0;

          const updateResults = await Promise.all(
            cartsToUpdate.map(async (cart) => {
              let shouldUpdateCart = false;
              const updatedItems = cart.cartItems.map((item) => {
                if (
                  item.product._id.equals(product._id) &&
                  item.size == null &&
                  item.color == null
                ) {
                  item.isAvailable = true;
                  shouldUpdateCart = true;

                  if (
                    quantity != null &&
                    item.quantity !== quantity &&
                    item.quantity > quantity
                  ) {
                    item.quantity = quantity;
                    shouldUpdateCart = true;
                  } else if (
                    product.quantity != null &&
                    item.quantity !== product.quantity &&
                    item.quantity > product.quantity
                  ) {
                    item.quantity = product.quantity;
                    shouldUpdateCart = true;
                  }

                  if (
                    priceAfterDiscount != null &&
                    item.price !== priceAfterDiscount
                  ) {
                    item.price = priceAfterDiscount;
                    shouldUpdateCart = true;
                  } else if (
                    product.priceAfterDiscount != null &&
                    item.price !== product.priceAfterDiscount
                  ) {
                    item.price = product.priceAfterDiscount;
                    shouldUpdateCart = true;
                  } else if (price != null && item.price !== price) {
                    item.price = price;
                    shouldUpdateCart = true;
                  } else if (
                    product.price != null &&
                    item.price !== product.price
                  ) {
                    item.price = product.price;
                    shouldUpdateCart = true;
                  }
                }
                return item;
              });

              if (shouldUpdateCart) {
                cartsNeedingUpdate++;
                const result = await Cart.updateOne(
                  { _id: cart._id },
                  {
                    $set: {
                      cartItems: updatedItems,
                      totalCartPrice: calcTotalCartPrice({
                        cartItems: updatedItems,
                      }),
                    },
                  },
                  { session }
                );

                return result.modifiedCount;
              }

              return 0;
            })
          );

          const modifiedCartsCount = updateResults.reduce(
            (sum, count) => sum + count,
            0
          );

          if (modifiedCartsCount < cartsNeedingUpdate) {
            throw new ApiError(
              `Not all carts were updated after deleting all colors". Transaction rolled back.`,
              400
            );
          }
        }

        if (
          deleteGeneralColors != null &&
          Array.isArray(deleteGeneralColors) &&
          deleteGeneralColors.length > 0
        ) {
          product.colors = product.colors.filter(
            (color) =>
              !deleteGeneralColors.some(
                (deleted) => deleted.toLowerCase() === color.color.toLowerCase()
              )
          );

          let deleteColorsPromises = deleteGeneralColors.map(async (c) => {
            // product.colors = product.colors.filter(
            //   (color) => color.color.toLowerCase() !== c.toLowerCase()
            // );

            const cartsToUpdate = await Cart.find({
              "cartItems.product": product._id,
              "cartItems.color": c,
            }).session(session);

            let cartsNeedingUpdate = 0;

            const updateResults = await Promise.all(
              cartsToUpdate.map(async (cart) => {
                let shouldUpdateCart = false;
                const updatedItems = cart.cartItems.map((item) => {
                  if (
                    item.product._id.equals(product._id) &&
                    item.size == null &&
                    item.color.toLowerCase() === c.toLowerCase()
                  ) {
                    if (item.isAvailable) {
                      item.isAvailable = false;
                      shouldUpdateCart = true;
                    }
                  }
                  return item;
                });

                if (shouldUpdateCart) {
                  cartsNeedingUpdate++;
                  const result = await Cart.updateOne(
                    { _id: cart._id },
                    {
                      $set: {
                        cartItems: updatedItems,
                        totalCartPrice: calcTotalCartPrice({
                          cartItems: updatedItems,
                        }),
                      },
                    },
                    { session }
                  );

                  return result.modifiedCount;
                }

                return 0;
              })
            );

            const modifiedCartsCount = updateResults.reduce(
              (sum, count) => sum + count,
              0
            );

            if (modifiedCartsCount < cartsNeedingUpdate) {
              throw new ApiError(
                `Not all carts were updated after deleting general color "${c}"". Transaction rolled back.`,
                400
              );
            }
          });

          await Promise.all(deleteColorsPromises);
        }

        const isFirstTimeAddingColors =
          (!Array.isArray(product.colors) || product.colors.length === 0) &&
          Array.isArray(colors) &&
          colors.some((c) => c.type === "new");

        if (isFirstTimeAddingColors) {
          const cartsToUpdate = await Cart.find({
            "cartItems.product": product._id,
          }).session(session);

          let cartsNeedingUpdate = 0;

          const updateResults = await Promise.all(
            cartsToUpdate.map(async (cart) => {
              let shouldUpdateCart = false;
              const updatedItems = cart.cartItems.map((item) => {
                if (
                  item.product._id.equals(product._id) &&
                  item.size == null &&
                  item.color == null
                ) {
                  item.isAvailable = false;
                  shouldUpdateCart = true;
                }
                return item;
              });

              if (shouldUpdateCart) {
                cartsNeedingUpdate++;
                const result = await Cart.updateOne(
                  { _id: cart._id },
                  {
                    $set: {
                      cartItems: updatedItems,
                      totalCartPrice: calcTotalCartPrice({
                        cartItems: updatedItems,
                      }),
                    },
                  },
                  { session }
                );

                return result.modifiedCount;
              }

              return 0;
            })
          );

          const modifiedCartsCount = updateResults.reduce(
            (sum, count) => sum + count,
            0
          );

          if (modifiedCartsCount < cartsNeedingUpdate) {
            throw new ApiError(
              `Not all carts were updated after disabling items with no color" during first-time color addition. Transaction rolled back.`,
              400
            );
          }
        }

        if (colors != null && Array.isArray(colors) && colors?.length > 0) {
          const isMatchingCartItem = (item, productId, colorName) =>
            item.product._id.equals(productId) &&
            item.size == null &&
            item.color.toLowerCase() === colorName.toLowerCase();

          if (product.quantity != null) {
            product.quantity = undefined;
          }

          let updateColorsPromises = colors.map(async (color) => {
            if (color.type === "new") {
              const cartsToUpdate = await Cart.find({
                "cartItems.product": product._id,
                "cartItems.color": color.colorName,
              }).session(session);

              product.colors.push({
                color: color.colorName,
                quantity: color.colorQuantity,
              });

              if (cartsToUpdate.length !== 0) {
                let cartsNeedingUpdate = 0;

                const updateResults = await Promise.all(
                  cartsToUpdate.map(async (cart) => {
                    let shouldUpdateCart = false;
                    const updatedItems = cart.cartItems.map((item) => {
                      if (
                        isMatchingCartItem(item, product._id, color.colorName)
                      ) {
                        item.isAvailable = true;
                        if (item.quantity !== color.colorQuantity) {
                          item.quantity = Math.min(
                            item.quantity,
                            color.colorQuantity
                          );
                        }

                        if (
                          priceAfterDiscount != null &&
                          item.price !== priceAfterDiscount
                        ) {
                          item.price = priceAfterDiscount;
                        } else if (
                          product.priceAfterDiscount != null &&
                          item.price !== product.priceAfterDiscount
                        ) {
                          item.price = product.priceAfterDiscount;
                        } else if (price != null && item.price !== price) {
                          item.price = price;
                        } else if (
                          product.price != null &&
                          item.price !== product.price
                        ) {
                          item.price = product.price;
                        }

                        shouldUpdateCart = true;
                      }
                      return item;
                    });

                    if (shouldUpdateCart) {
                      cartsNeedingUpdate++;
                      const result = await Cart.updateOne(
                        { _id: cart._id },
                        {
                          $set: {
                            cartItems: updatedItems,
                            totalCartPrice: calcTotalCartPrice({
                              cartItems: updatedItems,
                            }),
                          },
                        },
                        { session }
                      );

                      return result.modifiedCount; // 1 if modified, 0 otherwise
                    }

                    return 0;
                  })
                );

                const modifiedCartsCount = updateResults.reduce(
                  (sum, count) => sum + count,
                  0
                );

                if (modifiedCartsCount < cartsNeedingUpdate) {
                  throw new ApiError(
                    `Not all carts were updated after changing quantity. Transaction rolled back.`,
                    400
                  );
                }
              }
            } else if (color.type === "update") {
              product.colors.forEach((c) => {
                if (c.color.toLowerCase() === color.colorName.toLowerCase()) {
                  if (color.newColorName != null) {
                    c.color = color.newColorName.toLowerCase();
                  }

                  if (color.colorQuantity != null) {
                    c.quantity = color.colorQuantity;
                  }
                }
              });

              const currentCartsToUpdate = await Cart.find({
                "cartItems.product": product._id,
                "cartItems.color": color.colorName,
              }).session(session);

              if (currentCartsToUpdate.length !== 0) {
                let currentCartsNeedingUpdate = 0;

                const currentUpdateResults = await Promise.all(
                  currentCartsToUpdate.map(async (cart) => {
                    let shouldUpdateCart = false;
                    const updatedItems = cart.cartItems.map((item) => {
                      if (
                        isMatchingCartItem(item, product._id, color.colorName)
                      ) {
                        if (color.newColorName != null) {
                          item.isAvailable = false;
                          shouldUpdateCart = true;
                        }

                        if (
                          color.colorQuantity != null &&
                          item.quantity !== color.colorQuantity &&
                          item.quantity > color.colorQuantity
                        ) {
                          item.quantity = color.colorQuantity;
                          shouldUpdateCart = true;
                        }

                        if (
                          priceAfterDiscount != null &&
                          item.price !== priceAfterDiscount
                        ) {
                          item.price = priceAfterDiscount;
                          shouldUpdateCart = true;
                        } else if (
                          product.priceAfterDiscount != null &&
                          item.price !== product.priceAfterDiscount
                        ) {
                          item.price = product.priceAfterDiscount;
                          shouldUpdateCart = true;
                        } else if (price != null && item.price !== price) {
                          item.price = price;
                          shouldUpdateCart = true;
                        } else if (
                          product.price != null &&
                          item.price !== product.price
                        ) {
                          item.price = product.price;
                          shouldUpdateCart = true;
                        }
                      }
                      return item;
                    });

                    if (shouldUpdateCart) {
                      currentCartsNeedingUpdate++;
                      const result = await Cart.updateOne(
                        { _id: cart._id },
                        {
                          $set: {
                            cartItems: updatedItems,
                            totalCartPrice: calcTotalCartPrice({
                              cartItems: updatedItems,
                            }),
                          },
                        },
                        { session }
                      );

                      return result.modifiedCount; // 1 if modified, 0 otherwise
                    }

                    return 0;
                  })
                );

                const modifiedCurrentCartsCount = currentUpdateResults.reduce(
                  (sum, count) => sum + count,
                  0
                );

                if (modifiedCurrentCartsCount < currentCartsNeedingUpdate) {
                  throw new ApiError(
                    `Not all carts were updated after changing". Transaction rolled back.`,
                    400
                  );
                }
              }

              if (color.newColorName != null) {
                const oldCartsToUpdate = await Cart.find({
                  "cartItems.product": product._id,
                  "cartItems.color": color.newColorName,
                }).session(session);

                if (oldCartsToUpdate.length !== 0) {
                  let oldCartsNeedingUpdate = 0;

                  const oldUpdateResults = await Promise.all(
                    oldCartsToUpdate.map(async (cart) => {
                      let shouldUpdateCart = false;
                      const updatedItems = cart.cartItems.map((item) => {
                        if (
                          isMatchingCartItem(
                            item,
                            product._id,
                            color.newColorName
                          )
                        ) {
                          item.isAvailable = true;
                          if (
                            color.colorQuantity != null &&
                            item.quantity !== color.colorQuantity
                          ) {
                            item.quantity = Math.min(
                              item.quantity,
                              color.colorQuantity
                            );
                          }

                          if (
                            priceAfterDiscount != null &&
                            item.price !== priceAfterDiscount
                          ) {
                            item.price = priceAfterDiscount;
                          } else if (
                            product.priceAfterDiscount != null &&
                            item.price !== product.priceAfterDiscount
                          ) {
                            item.price = product.priceAfterDiscount;
                          } else if (price != null && item.price !== price) {
                            item.price = price;
                          } else if (
                            product.price != null &&
                            item.price !== product.price
                          ) {
                            item.price = product.price;
                          }
                          shouldUpdateCart = true;
                        }
                        return item;
                      });

                      if (shouldUpdateCart) {
                        oldCartsNeedingUpdate++;
                        const result = await Cart.updateOne(
                          { _id: cart._id },
                          {
                            $set: {
                              cartItems: updatedItems,
                              totalCartPrice: calcTotalCartPrice({
                                cartItems: updatedItems,
                              }),
                            },
                          },
                          { session }
                        );

                        return result.modifiedCount; // 1 if modified, 0 otherwise
                      }

                      return 0;
                    })
                  );

                  const modifiedOldCartsCount = oldUpdateResults.reduce(
                    (sum, count) => sum + count,
                    0
                  );

                  if (modifiedOldCartsCount < oldCartsNeedingUpdate) {
                    throw new ApiError(
                      `Not all carts were updated after changing quantity". Transaction rolled back.`,
                      400
                    );
                  }
                }
              }
            }
          });

          await Promise.all(updateColorsPromises);
        }

        const cartsToUpdate = await Cart.find({
          "cartItems.product": product._id,
        }).session(session);

        if (cartsToUpdate.length > 0) {
          let cartsNeedingUpdate = 0;

          const updateResults = await Promise.all(
            cartsToUpdate.map(async (cart) => {
              let shouldUpdateCart = false;
              const updatedItems = cart.cartItems.map((item) => {
                if (item.product._id.equals(product._id) && item.size == null) {
                  if (
                    item.color != null &&
                    Array.isArray(product.colors) &&
                    product.colors.length > 0
                  ) {
                    const colorIsExist = product.colors.find(
                      (c) => c.color.toLowerCase() === item.color.toLowerCase()
                    );

                    if (colorIsExist) {
                      if (!item.isAvailable) {
                        item.isAvailable = true;
                        shouldUpdateCart = true;
                      }

                      if (
                        item.quantity !== colorIsExist.quantity &&
                        item.quantity > colorIsExist.quantity
                      ) {
                        item.quantity = colorIsExist.quantity;
                        shouldUpdateCart = true;
                      }

                      if (
                        priceAfterDiscount != null &&
                        item.price !== priceAfterDiscount
                      ) {
                        item.price = priceAfterDiscount;
                        shouldUpdateCart = true;
                      } else if (
                        product.priceAfterDiscount != null &&
                        item.price !== product.priceAfterDiscount
                      ) {
                        item.price = product.priceAfterDiscount;
                        shouldUpdateCart = true;
                      } else if (price != null && item.price !== price) {
                        item.price = price;
                        shouldUpdateCart = true;
                      } else if (
                        product.price != null &&
                        item.price !== product.price
                      ) {
                        item.price = product.price;
                        shouldUpdateCart = true;
                      }
                    } else if (item.isAvailable) {
                      item.isAvailable = false;
                      shouldUpdateCart = true;
                    }
                  } else if (
                    item.color == null &&
                    Array.isArray(product.colors) &&
                    product.colors.length === 0
                  ) {
                    if (
                      quantity != null &&
                      item.quantity !== quantity &&
                      item.quantity > quantity
                    ) {
                      item.quantity = quantity;
                      shouldUpdateCart = true;
                    }

                    if (
                      priceAfterDiscount != null &&
                      item.price !== priceAfterDiscount
                    ) {
                      item.price = priceAfterDiscount;
                      shouldUpdateCart = true;
                    } else if (
                      product.priceAfterDiscount != null &&
                      item.price !== product.priceAfterDiscount
                    ) {
                      item.price = product.priceAfterDiscount;
                      shouldUpdateCart = true;
                    } else if (price != null && item.price !== price) {
                      item.price = price;
                      shouldUpdateCart = true;
                    } else if (
                      product.price != null &&
                      item.price !== product.price
                    ) {
                      item.price = product.price;
                      shouldUpdateCart = true;
                    }
                  }
                }
                return item;
              });

              if (shouldUpdateCart) {
                cartsNeedingUpdate++;

                // Save the updated cart items and recalculate total price
                const result = await Cart.updateOne(
                  { _id: cart._id },
                  {
                    $set: {
                      cartItems: updatedItems,
                      totalCartPrice: calcTotalCartPrice({
                        cartItems: updatedItems,
                      }),
                    },
                  },
                  { session }
                );

                // Return number of modified documents (1 or 0)
                return result.modifiedCount;
              }

              return 0;
            })
          );

          // Sum up all updated cart counts
          const modifiedCartsCount = updateResults.reduce(
            (sum, count) => sum + count,
            0
          );

          // Rollback if not all matching carts were updated successfully
          if (modifiedCartsCount < cartsNeedingUpdate) {
            throw new ApiError(
              `Some carts failed to update. All changes have been rolled back.`,
              400
            );
          }
        }
      } else {
        product.sizes = [];
        product.price = price;
        if (priceAfterDiscount != null)
          product.priceAfterDiscount = priceAfterDiscount;
        if (quantity != null) product.quantity = quantity;
        if (colors != null && Array.isArray(colors) && colors.length > 0) {
          colors.forEach((c) => {
            product.colors.push({
              color: c.colorName,
              quantity: c.colorQuantity,
            });
          });
        }

        const cartsToUpdate = await Cart.find({
          "cartItems.product": product._id,
        }).session(session);

        if (cartsToUpdate.length > 0) {
          let cartsNeedingUpdate = 0;

          const updateResults = await Promise.all(
            cartsToUpdate.map(async (cart) => {
              let shouldUpdateCart = false;
              const updatedItems = cart.cartItems.map((item) => {
                if (item.product._id.equals(product._id) && item.size == null) {
                  if (
                    item.color != null &&
                    Array.isArray(product.colors) &&
                    product.colors.length > 0
                  ) {
                    const colorIsExist = product.colors.find(
                      (c) => c.color.toLowerCase() === item.color.toLowerCase()
                    );

                    if (colorIsExist) {
                      if (!item.isAvailable) {
                        item.isAvailable = true;
                        shouldUpdateCart = true;
                      }

                      if (
                        item.quantity !== colorIsExist.quantity &&
                        item.quantity > colorIsExist.quantity
                      ) {
                        item.quantity = colorIsExist.quantity;
                        shouldUpdateCart = true;
                      }

                      if (
                        priceAfterDiscount != null &&
                        item.price !== priceAfterDiscount
                      ) {
                        item.price = priceAfterDiscount;
                        shouldUpdateCart = true;
                      } else if (
                        product.priceAfterDiscount != null &&
                        item.price !== product.priceAfterDiscount
                      ) {
                        item.price = product.priceAfterDiscount;
                        shouldUpdateCart = true;
                      } else if (price != null && item.price !== price) {
                        item.price = price;
                        shouldUpdateCart = true;
                      } else if (
                        product.price != null &&
                        item.price !== product.price
                      ) {
                        item.price = product.price;
                        shouldUpdateCart = true;
                      }
                    } else if (item.isAvailable) {
                      item.isAvailable = false;
                      shouldUpdateCart = true;
                    }
                  } else if (
                    item.color == null &&
                    Array.isArray(product.colors) &&
                    product.colors.length === 0
                  ) {
                    if (!item.isAvailable) {
                      item.isAvailable = true;
                      shouldUpdateCart = true;
                    }

                    if (
                      quantity != null &&
                      item.quantity !== quantity &&
                      item.quantity > quantity
                    ) {
                      item.quantity = quantity;
                      shouldUpdateCart = true;
                    }

                    if (
                      priceAfterDiscount != null &&
                      item.price !== priceAfterDiscount
                    ) {
                      item.price = priceAfterDiscount;
                      shouldUpdateCart = true;
                    } else if (
                      product.priceAfterDiscount != null &&
                      item.price !== product.priceAfterDiscount
                    ) {
                      item.price = product.priceAfterDiscount;
                      shouldUpdateCart = true;
                    } else if (price != null && item.price !== price) {
                      item.price = price;
                      shouldUpdateCart = true;
                    } else if (
                      product.price != null &&
                      item.price !== product.price
                    ) {
                      item.price = product.price;
                      shouldUpdateCart = true;
                    }
                  }
                } else if (
                  item.product._id.equals(product._id) &&
                  item.size != null
                ) {
                  if (item.isAvailable) item.isAvailable = false;
                  shouldUpdateCart = true;
                }
                return item;
              });

              if (shouldUpdateCart) {
                cartsNeedingUpdate++;

                // Save the updated cart items and recalculate total price
                const result = await Cart.updateOne(
                  { _id: cart._id },
                  {
                    $set: {
                      cartItems: updatedItems,
                      totalCartPrice: calcTotalCartPrice({
                        cartItems: updatedItems,
                      }),
                    },
                  },
                  { session }
                );

                // Return number of modified documents (1 or 0)
                return result.modifiedCount;
              }

              return 0;
            })
          );

          // Sum up all updated cart counts
          const modifiedCartsCount = updateResults.reduce(
            (sum, count) => sum + count,
            0
          );

          // Rollback if not all matching carts were updated successfully
          if (modifiedCartsCount < cartsNeedingUpdate) {
            throw new ApiError(
              `Some carts failed to update. All changes have been rolled back.`,
              400
            );
          }
        }

        product.sizesIsExist = false;
      }
    }

    publicFields.forEach((field) => {
      if (req.body[field]) {
        product[field] = req.body[field];
      }
    });

    await product.save({ session });
    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(
      new ApiError(
        err.message || "Error updating product or carts. Changes reverted.",
        err.statusCode || 500
      )
    );
  }

  /* 

  updateSizes = [
    {
      sizeName: "S", (ok)
      newSizeName?: "S",(ok)(ok)
      sizePrice?: 100,(ok)(ok)
      sizePriceAfterDiscount?: 90,(ok)(ok)
      sizeQuantity?: 10,(ok)(ok)
      sizeColors?: [
        {
          type: "update OR new"
          colorName: "#fd34d4",
          newColorName?: "#fd3534",
          colorQuantity?: 5,
        }
      ],(ok)
      deleteColors?: ["#fd34d4", ...],
      deletePriceAfterDiscount: true,(ok)(ok)
    }
  ];

  addSizes = [
    {
      size: "S",
      price: 10,
      priceAfterDiscount: 7,
      quantity,
      colors: [
        color: "#f343df",
        quantity: 5,
      ]
    }
  ]


  deleteSizes = ["S", ...]

  updateGeneralColors = [
    {
      type: "update OR new",
      colorName: "#f343df",
      newColorName: "#f343df",
      colorQuantity: 10,
    }
  ]

  deleteGeneralColors = ["#f343df", ...]

  deletePriceAfterDiscount: true;

  */

  res.status(200).json({ data: product });
});

// @desc    Delete specific product
// @route    PUT /api/v1/products/:id
// @access    Private
exports.deleteProduct = factory.deleteOne(Product);

// @desc    Search for products
// @route    GET /api/v1/products/productSearch
// @access    protected
exports.productSearch = asyncHandler(async (req, res) => {
  const { s } = req.query;
  if (!s) return res.json([]);

  const categories = await Category.find({
    name: { $regex: s, $options: "i" },
  });

  const brands = await Brand.find({
    name: { $regex: s, $options: "i" },
  });

  const categoryIds = categories.map((cat) => cat._id);
  const brandIds = brands.map((brand) => brand._id);

  const filterObj = {
    $or: [
      { title: { $regex: s, $options: "i" } },
      { category: { $in: categoryIds } },
      { brand: { $in: brandIds } },
    ],
  };

  let apiFeatures = new ApiFeatures(Product.find(filterObj), req.query)
    .sort()
    .filter();

  const filteredCount = await apiFeatures.mongooseQuery
    .clone()
    .countDocuments();
  apiFeatures.Paginate(filteredCount);

  const { mongooseQuery, paginationResults } = apiFeatures;
  const products = await mongooseQuery
    .populate("category", "name")
    .populate("brand", "name");

  res.json({ results: products.length, paginationResults, products });
});
