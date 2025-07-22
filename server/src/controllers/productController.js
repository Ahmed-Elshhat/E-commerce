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
  const {
    sizesIsExist,
    price,
    priceAfterDiscount,
    quantity,
    colors,
    addGeneralColors,
    updateGeneralColors,
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

  if (typeof sizesIsExist !== "boolean") {
    return next(
      new ApiError(
        "The value of the 'Sizes is exist' field must be either true or false.",
        400
      )
    );
  }

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

    if (addGeneralColors != null) {
      return next(
        new ApiError(
          "The 'Add general colors' field is not allowed when adding, updating, or deleting sizes.",
          400
        )
      );
    }

    if (updateGeneralColors != null) {
      return next(
        new ApiError(
          "The 'Update general colors' field is not allowed when adding, updating, or deleting sizes.",
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

    if (!product.sizesIsExist) {
      product.price = undefined;
      product.priceAfterDiscount = undefined;
      product.quantity = undefined;
      product.colors = undefined;
    }

    if (product.sizesIsExist) {
      if (
        deleteSizes != null &&
        Array.isArray(deleteSizes) &&
        deleteSizes.length > 0
      ) {
        /* eslint-disable no-await-in-loop */
        const session = await mongoose.startSession();
        try {
          session.startTransaction();
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
                    item.isAvailable = false;
                    shouldUpdateCart = true;
                  }
                  return item;
                });

                if (shouldUpdateCart) cartsNeedingUpdate++;

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
          await product.save({ session });
          await session.commitTransaction();
          session.endSession();
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          return next(
            new ApiError(
              err.message ||
                "Error updating product or carts. Changes reverted.",
              err.statusCode || 500
            )
          );
        }
      }

      if (
        updateSizes != null &&
        Array.isArray(updateSizes) &&
        updateSizes.length > 0
      ) {
        const seenSizeNames = [];
        const seenNewSizeNames = [];
        const hasValidationErrors = updateSizes.some((size) => {
          if (!size.sizeName) {
            next(new ApiError("Size name is required for update.", 400));
            return true;
          }

          if (
            !size.newSizeName &&
            size.sizePrice == null &&
            size.sizePriceAfterDiscount == null &&
            size.sizeQuantity == null &&
            !size.sizeColors?.length &&
            !size.deleteColors?.length
          ) {
            next(
              new ApiError(
                `No actual update provided for size "${size.sizeName}". Please specify at least one change.`,
                400
              )
            );
            return true;
          }

          const normalizedName = size.sizeName.toLowerCase();
          const original = product.sizes.find(
            (s) => s.size.toLowerCase() === normalizedName
          );

          if (!original) {
            next(
              new ApiError(
                `Size "${size.sizeName}" does not exist in the product.`,
                400
              )
            );
            return true;
          }

          if (size.newSizeName) {
            if (
              size.sizeName.toLowerCase() === size.newSizeName?.toLowerCase()
            ) {
              next(
                new ApiError(
                  `The new name for size "${size.sizeName}" matches the old name. It must be different.`,
                  400
                )
              );
              return true;
            }

            const newNameIsExist = product.sizes.find(
              (s) => s.size.toLowerCase() === size.newSizeName.toLowerCase()
            );

            if (newNameIsExist) {
              next(
                new ApiError(
                  `The new size name "${size.newSizeName}" already exists in the product. Please choose a different name.`,
                  400
                )
              );
              return true;
            }
          }

          if (seenSizeNames.includes(size.sizeName.toLowerCase())) {
            next(new ApiError("Only one update per size is allowed.", 400));
            return true;
          }

          if (
            size.newSizeName &&
            seenNewSizeNames.includes(size.newSizeName.toLowerCase())
          ) {
            next(
              new ApiError(
                "Duplicate new size name detected. Each size must have a unique name.",
                400
              )
            );
            return true;
          }

          if (
            size.newSizeName &&
            seenSizeNames.includes(size.newSizeName.toLowerCase())
          ) {
            next(
              new ApiError(
                `The new size name "${size.newSizeName}" conflicts with an existing size name. Please choose a different name.`,
                400
              )
            );
            return true;
          }

          if (size.sizePrice != null && typeof size.sizePrice !== "number") {
            next(
              new ApiError(
                `Price for "${size.sizeName}" must be a number.`,
                400
              )
            );
            return true;
          }

          if (
            size.sizePriceAfterDiscount != null &&
            typeof size.sizePriceAfterDiscount !== "number"
          ) {
            next(
              new ApiError(
                `Discounted price for "${size.sizeName}" must be a number.`,
                400
              )
            );
            return true;
          }

          if (
            size.sizePriceAfterDiscount != null &&
            size.deletePriceAfterDiscount === true
          ) {
            next(
              new ApiError(
                `Cannot update and delete price after discount simultaneously for size "${size.sizeName}".`,
                400
              )
            );
            return true;
          }

          // ✅ تحقق من تكرار السعر الأصلي
          if (size.sizePrice != null && size.sizePrice === original.price) {
            next(
              new ApiError(
                `The new price for size "${size.sizeName}" must be different from the old price.`,
                400
              )
            );
            return true;
          }

          // ✅ تحقق من تكرار السعر بعد الخصم
          if (
            size.sizePriceAfterDiscount != null &&
            size.sizePriceAfterDiscount === original.priceAfterDiscount
          ) {
            next(
              new ApiError(
                `The new discounted price for size "${size.sizeName}" must be different from the old discounted price.`,
                400
              )
            );
            return true;
          }

          if (
            size.sizePrice != null &&
            size.sizePriceAfterDiscount == null &&
            size.sizePrice <= original.priceAfterDiscount
          ) {
            next(
              new ApiError(
                `❌ The price for size "${size.sizeName}" must not be less than or equal to its existing discounted price.`,
                400
              )
            );
            return true;
          }

          // ✅ تحقق إذا تم إرسال السعر والخصم وكان الخصم أكبر من السعر
          if (
            size.sizePrice != null &&
            size.sizePriceAfterDiscount != null &&
            size.sizePriceAfterDiscount > size.sizePrice
          ) {
            next(
              new ApiError(
                `Discounted price for "${size.sizeName}" must be less than the original price.`,
                400
              )
            );
            return true;
          }

          // ✅ تحقق إذا فقط تم إرسال الخصم وكان أكبر من السعر القديم
          if (
            size.sizePrice == null &&
            size.sizePriceAfterDiscount != null &&
            size.sizePriceAfterDiscount > original.price
          ) {
            next(
              new ApiError(
                `Discounted price for "${size.sizeName}" must be less than the original price (${original.price}).`,
                400
              )
            );
            return true;
          }

          if (size.deleteColors?.length) {
            const seenDeleteColors = [];

            const hasValidationDeleteColors = size.deleteColors.some((c, i) => {
              const lowerC = c.toLowerCase();

              // ❌ رجع Error فوري لو اللون غير موجود في الأصل
              const existsInOriginal = original.colors.some(
                (color) => color.color.toLowerCase() === lowerC
              );

              if (!existsInOriginal) {
                next(
                  new ApiError(
                    `❌ Cannot delete color "${c}" in size "${size.sizeName}" because it does not exist in the original color list.`,
                    400
                  )
                );
                return true;
              }

              // ❌ رجع Error لو فيه تكرار
              if (seenDeleteColors.includes(lowerC)) {
                next(
                  new ApiError(
                    `❌ Duplicate color "${c}" found in delete colors list for size "${size.sizeName}" at index ${i}. Each color must be unique.`,
                    400
                  )
                );
                return true;
              }

              seenDeleteColors.push(lowerC);
              return false;
            });

            if (hasValidationDeleteColors) return true;
          }

          if (size.sizeColors && size.sizeColors.length > 0) {
            const seenOldColorNames = [];
            const seenNewColorNames = [];

            const colorValidator = size.sizeColors.some((color, colorIndex) => {
              if (!color.type) {
                next(
                  new ApiError(
                    `Color update type is required for size "${size.sizeName}" at color index ${colorIndex}. Please specify either "update" or "new".`,
                    400
                  )
                );
                return true;
              }

              if (color.type !== "new" && color.type !== "update") {
                next(
                  new ApiError(
                    `Invalid color update type "${color.type}" for size "${size.sizeName}" at color index ${colorIndex}. Expected "new" or "update".`,
                    400
                  )
                );
                return true;
              }

              if (!color.colorName) {
                next(
                  new ApiError(
                    `Missing color name for size "${size.sizeName}" at color index ${colorIndex + 1}. The "Color name" field is required.`,
                    400
                  )
                );
                return true;
              }

              if (
                color.newColorName &&
                color.colorName.toLowerCase() ===
                  color.newColorName.toLowerCase()
              ) {
                next(
                  new ApiError(
                    `New color name must be different from the old color name for size "${size.sizeName}" at color index ${colorIndex}.`,
                    400
                  )
                );
                return true;
              }

              if (seenOldColorNames.includes(color.colorName.toLowerCase())) {
                next(
                  new ApiError(
                    `Duplicate color name "${color.colorName}" found in size "${size.sizeName}" at color index ${colorIndex}. Each color name must be unique.`,
                    400
                  )
                );
                return true;
              }

              if (
                color.newColorName &&
                seenNewColorNames.includes(color.newColorName.toLowerCase())
              ) {
                next(
                  new ApiError(
                    `Duplicate new color name "${color.newColorName}" found in size "${size.sizeName}" at color index ${colorIndex}. Each new color name must be unique.`,
                    400
                  )
                );
                return true;
              }

              if (
                color.newColorName &&
                seenOldColorNames.includes(color.newColorName.toLowerCase())
              ) {
                next(
                  new ApiError(
                    `The color name "${color.newColorName}" already exists. Please choose a unique name.`,
                    400
                  )
                );
                return true;
              }

              if (color.colorQuantity != null && color.colorQuantity < 0) {
                next(
                  new ApiError(
                    `Color quantity for size "${size.sizeName}" at color index ${colorIndex} cannot be negative.`,
                    400
                  )
                );
                return true;
              }

              if (
                color.colorQuantity != null &&
                !Number.isInteger(color.colorQuantity)
              ) {
                next(
                  new ApiError(
                    `Color quantity for size "${size.sizeName}" at color index ${colorIndex} must be a whole number (no decimals).`,
                    400
                  )
                );
                return true;
              }

              if (color.type === "new") {
                if (
                  size.deleteColors &&
                  size.deleteColors.includes(color.colorName)
                ) {
                  next(
                    new ApiError(
                      `Color "${color.colorName}" cannot be added because it is scheduled for deletion.`,
                      400
                    )
                  );
                  return true;
                }

                if (color.colorQuantity == null) {
                  next(
                    new ApiError(
                      `Please specify the quantity available for the new color "${color.colorName}" in size "${size.sizeName}".`,
                      400
                    )
                  );
                  return true;
                }

                if (color.newColorName) {
                  next(
                    new ApiError(
                      `❌ For new colors in size "${size.sizeName}", use "color Name" only. Do not include "new Color Name".`,
                      400
                    )
                  );
                  return true;
                }

                const newColorNameIsExist = original.colors.find(
                  (c) => c.color.toLowerCase() === color.colorName.toLowerCase()
                );

                if (newColorNameIsExist) {
                  next(
                    new ApiError(
                      `❌ The color name "${color.colorName}" already exists in the size "${original.size}". Please choose a different name.`,
                      400
                    )
                  );
                  return true;
                }
              }

              if (color.type === "update") {
                if (
                  size.deleteColors &&
                  size.deleteColors.includes(color.colorName)
                ) {
                  next(
                    new ApiError(
                      `Color "${color.colorName}" cannot be updated because it is scheduled for deletion.`,
                      400
                    )
                  );
                  return true;
                }

                const existingColor = original.colors.find(
                  (c) => c.color.toLowerCase() === color.colorName.toLowerCase()
                );

                if (!existingColor) {
                  next(
                    new ApiError(
                      `❌ The original color "${color.colorName}" does not exist in size "${original.size}".`,
                      400
                    )
                  );
                  return true;
                }

                // ✅ تحقق أنه تم تقديم تغيير فعلي
                const isSameQuantity =
                  color.colorQuantity == null ||
                  color.colorQuantity === existingColor.quantity;

                const isSameName =
                  !color.newColorName ||
                  color.newColorName.toLowerCase() ===
                    color.colorName.toLowerCase();

                if (isSameQuantity && isSameName) {
                  next(
                    new ApiError(
                      `❌ No update provided for the color "${color.colorName}" in size "${original.size}". Please change the name or the quantity.`,
                      400
                    )
                  );
                  return true;
                }

                if (color.newColorName) {
                  if (
                    color.newColorName &&
                    size.deleteColors &&
                    size.deleteColors.includes(color.newColorName)
                  ) {
                    next(
                      new ApiError(
                        `Cannot rename the color to (${color.newColorName}) because it is marked for deletion.`,
                        400
                      )
                    );
                    return true;
                  }

                  const newColorNameIsExist = original.colors.find(
                    (c) =>
                      c.color.toLowerCase() === color.newColorName.toLowerCase()
                  );

                  if (newColorNameIsExist) {
                    next(
                      new ApiError(
                        `❌ The new color name "${color.newColorName}" already exists in the size "${original.size}". Please choose a different name.`,
                        400
                      )
                    );
                    return true;
                  }
                }
              }

              seenOldColorNames.push(color.colorName.toLowerCase());
              if (color.newColorName) {
                seenNewColorNames.push(color.newColorName.toLowerCase());
              }

              return false;
            });

            if (colorValidator) return true;
          }

          const allOriginalColorsDeleted =
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
              next(
                new ApiError(
                  `❌ Cannot update size quantity for "${size.sizeName}" while adding or updating colors.`,
                  400
                )
              );
              return true;
            }

            // الحالة 1: فيه ألوان أصلية
            if (hasOriginalColors) {
              if (
                !Array.isArray(size.deleteColors) ||
                size.deleteColors.length === 0
              ) {
                next(
                  new ApiError(
                    `❌ You must delete all colors for size "${size.sizeName}" before adding a new quantity.`,
                    400
                  )
                );
                return true;
              }

              if (!allOriginalColorsDeleted) {
                next(
                  new ApiError(
                    `❌ Cannot update quantity for size "${size.sizeName}" because it still has existing colors. Please delete them first.`,
                    400
                  )
                );
                return true;
              }
            }

            // الحالة 2: مفيش ألوان أصلية
            if (!hasOriginalColors) {
              if (
                Array.isArray(size.deleteColors) &&
                size.deleteColors.length > 0
              ) {
                next(
                  new ApiError(
                    `❌ Cannot delete colors for "${size.sizeName}" because it has no original colors.`,
                    400
                  )
                );
                return true;
              }
            }
          } else if (allOriginalColorsDeleted && !hasNewOrUpdatedColors) {
            next(
              new ApiError(
                `If you want to delete all colors for size "${size.sizeName}", you must also provide a general quantity for the size.`,
                400
              )
            );
            return true;
          }

          seenSizeNames.push(size.sizeName.toLowerCase());
          if (size.newSizeName) {
            seenNewSizeNames.push(size.newSizeName.toLowerCase());
          }
          return false;
        });
        if (hasValidationErrors) return;

        const session = await mongoose.startSession();
        try {
          session.startTransaction();
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

            /* eslint-disable no-await-in-loop */
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

                    if (shouldUpdateCart) cartsNeedingUpdate++;

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

            if (
              size.sizeColors != null &&
              Array.isArray(size.sizeColors) &&
              size.sizeColors.length > 0
            ) {
              productSize.quantity = undefined;

              const updateColorPromises = size.sizeColors.map(async (color) => {
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
                            item.quantity = Math.min(
                              item.quantity,
                              color.colorQuantity
                            );
                          }
                          return item;
                        });

                        if (shouldUpdateCart) cartsNeedingUpdate++;

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
                      c.color.toLowerCase() === color.colorName.toLowerCase()
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
                            item.product._id.toString() ===
                              product._id.toString() &&
                            item.size.toLowerCase() ===
                              size.sizeName.toLowerCase() &&
                            item.color.toLowerCase() ===
                              color.colorName.toLowerCase()
                          ) {
                            if (
                              color.newColorName &&
                              color.newColorName != null
                            ) {
                              item.isAvailable = false;
                            }
                            if (
                              color.colorQuantity &&
                              color.colorQuantity != null
                            ) {
                              item.quantity = Math.min(
                                item.quantity,
                                color.colorQuantity
                              );
                            }
                            shouldUpdateCart = true;
                          }
                          return item;
                        });

                        if (shouldUpdateCart) currentCartsNeedingUpdate++;

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
                      })
                    );

                    const modifiedCurrentCartsCount =
                      currentUpdateResults.reduce(
                        (sum, count) => sum + count,
                        0
                      );

                    if (modifiedCurrentCartsCount < currentCartsNeedingUpdate) {
                      throw new ApiError(
                        `Not all carts were updated after changing quantity for size "${size.sizeName}". Transaction rolled back.`,
                        400
                      );
                    }
                  }

                  if (color.newColorName && color.newColorName != null) {
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
                          const updatedItems = cart.cartItems.map((item) => {
                            if (
                              item.product._id.toString() ===
                                product._id.toString() &&
                              item.size.toLowerCase() ===
                                size.sizeName.toLowerCase() &&
                              item.color.toLowerCase() ===
                                color.newColorName.toLowerCase()
                            ) {
                              item.isAvailable = true;
                              if (
                                color.colorQuantity &&
                                color.colorQuantity != null
                              ) {
                                item.quantity = Math.min(
                                  item.quantity,
                                  color.colorQuantity
                                );
                              }
                              shouldUpdateCart = true;
                            }
                            return item;
                          });

                          if (shouldUpdateCart) oldCartsNeedingUpdate++;

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
              });

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
                    if (size.sizePrice != null) {
                      item.price =
                        size?.sizePriceAfterDiscount ??
                        productSize?.priceAfterDiscount ??
                        size.sizePrice;
                    } else if (size.sizePriceAfterDiscount != null) {
                      item.price =
                        size?.sizePriceAfterDiscount ??
                        productSize?.priceAfterDiscount ??
                        productSize.price;
                    }

                    // If priceAfterDiscount was deleted, update cart item price to default product price
                    if (size.deletePriceAfterDiscount) {
                      item.price = productSize.price;
                    }

                    if (size.sizeQuantity != null && item.color == null) {
                      item.quantity = Math.min(
                        item.quantity,
                        size.sizeQuantity
                      );
                    }

                    // If a new size name is provided, mark old size as unavailable in cart
                    if (size.newSizeName) {
                      item.isAvailable = false;
                    }

                    shouldUpdateCart = true;

                    // if (item.color != null && productSize.colors.length > 0) {
                    //   const colorIsExist = productSize.colors.find(
                    //     (c) => c.color.toLowerCase() === item.color.toLowerCase()
                    //   );

                    //   if (colorIsExist) {
                    //     if (!item.isAvailable) {
                    //       item.isAvailable = true;
                    //       shouldUpdateCart = true;
                    //     }

                    //     if (item.quantity !== colorIsExist.quantity) {
                    //       item.quantity = Math.min(
                    //         item.quantity,
                    //         colorIsExist.quantity
                    //       );
                    //       shouldUpdateCart = true;
                    //     }
                    //   }
                    // } else {
                    //   if (size.sizeQuantity != null && item.quantity !== size.sizeQuantity) {
                    //     item.quantity = size.sizeQuantity;
                    //     shouldUpdateCart = true;
                    //   }

                    //   if (
                    //     priceAfterDiscount != null &&
                    //     item.price !== priceAfterDiscount
                    //   ) {
                    //     item.price = priceAfterDiscount;
                    //     shouldUpdateCart = true;
                    //   } else if (
                    //     product.priceAfterDiscount != null &&
                    //     item.price !== product.priceAfterDiscount
                    //   ) {
                    //     item.price = product.priceAfterDiscount;
                    //     shouldUpdateCart = true;
                    //   } else if (price != null && item.price !== price) {
                    //     item.price = price;
                    //     shouldUpdateCart = true;
                    //   } else if (
                    //     product.price != null &&
                    //     item.price !== product.price
                    //   ) {
                    //     item.price = product.price;
                    //     shouldUpdateCart = true;
                    //   }
                    // }
                  }
                  return item;
                });

                if (shouldUpdateCart) cartsNeedingUpdate++;

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
                      item.size.toLowerCase() === size.newSizeName.toLowerCase()
                    ) {
                      // Use latest priceAfterDiscount if exists, otherwise fallback to regular price
                      item.price =
                        productSize?.priceAfterDiscount ?? productSize.price;

                      // If color exists and the size has colors, adjust availability and quantity
                      if (
                        item.color != null &&
                        Array.isArray(productSize.colors) &&
                        productSize.colors.length > 0
                      ) {
                        const matchedColor = productSize.colors.find(
                          (c) =>
                            c.color.toLowerCase() === item.color.toLowerCase()
                        );

                        if (matchedColor) {
                          item.isAvailable = true;
                          // Limit quantity to available stock
                          item.quantity = Math.min(
                            item.quantity,
                            matchedColor.quantity
                          );
                        } else {
                          item.isAvailable = false;
                        }
                      } else {
                        // No color variant: check general size quantity
                        item.quantity = Math.min(
                          item.quantity,
                          productSize.quantity
                        );
                        item.isAvailable = true;
                      }

                      shouldUpdateCart = true;
                    }
                    return item;
                  });

                  if (shouldUpdateCart) newSizeNameCartsNeedingUpdate++;

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
          await product.save({ session });
          await session.commitTransaction();
          session.endSession();
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          return next(
            new ApiError(
              err.message ||
                "Error updating product or carts. Changes reverted.",
              err.statusCode || 500
            )
          );
        }
      }

      if (addSizes != null && Array.isArray(addSizes) && addSizes.length > 0) {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();
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
                        }
                      } else {
                        if (!item.isAvailable) {
                          item.isAvailable = true;
                          shouldUpdateCart = true;
                        }

                        if (
                          size.quantity != null &&
                          item.quantity !== size.quantity
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
          await product.save({ session });
          await session.commitTransaction();
          session.endSession();
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          return next(
            new ApiError(
              err.message ||
                "Error updating product or carts. Changes reverted.",
              err.statusCode || 500
            )
          );
        }
      }
    }
  } else {
    if (addSizes != null) {
      return next(
        new ApiError(
          "Cannot add sizes when the product is not set to support sizes.",
          400
        )
      );
    }

    if (updateSizes != null) {
      return next(
        new ApiError(
          "Cannot update sizes when the product is not set to support sizes.",
          400
        )
      );
    }

    if (deleteSizes != null) {
      return next(
        new ApiError(
          "Cannot delete sizes when the product is not set to support sizes.",
          400
        )
      );
    }

    if (product.sizesIsExist) {
      product.sizes = [];
    }

    if (
      product.sizesIsExist &&
      deleteGeneralColors != null &&
      deleteGeneralColors?.length > 0
    ) {
      return next(new ApiError("", 400));
    }

    if (
      !product.sizesIsExist &&
      deleteGeneralColors != null &&
      product.colors.length === 0
    ) {
      return next(new ApiError("", 400));
    }

    if (
      product.sizesIsExist &&
      updateGeneralColors != null &&
      updateGeneralColors?.length > 0
    ) {
      return next(new ApiError("", 400));
    }

    if (
      !product.sizesIsExist &&
      updateGeneralColors != null &&
      updateGeneralColors?.length > 0 &&
      product.colors.length === 0
    ) {
      return next(new ApiError("", 400));
    }

    if (product.sizesIsExist && price == null) {
      return next(new ApiError("", 400));
    }

    if (
      product.sizesIsExist &&
      (addGeneralColors == null || addGeneralColors?.length === 0) &&
      quantity == null
    ) {
      return next(new ApiError("", 400));
    }

    if (price != null && typeof price !== "number") {
      return next(new ApiError("", 400));
    }

    if (price != null && price < 0) {
      return next(new ApiError("", 400));
    }

    if (!product.sizesIsExist && price != null && price === product.price) {
      return next(new ApiError("", 400));
    }

    if (priceAfterDiscount != null && typeof priceAfterDiscount !== "number") {
      return next(new ApiError("", 400));
    }

    if (priceAfterDiscount != null && priceAfterDiscount < 0) {
      return next(new ApiError("", 400));
    }

    if (
      priceAfterDiscount != null &&
      price != null &&
      priceAfterDiscount >= price
    ) {
      return next(new ApiError("", 400));
    }

    if (
      !product.sizesIsExist &&
      priceAfterDiscount != null &&
      price == null &&
      priceAfterDiscount >= product.price
    ) {
      return next(new ApiError("", 400));
    }

    if (
      !product.sizesIsExist &&
      priceAfterDiscount != null &&
      priceAfterDiscount === product.priceAfterDiscount
    ) {
      return next(new ApiError("", 400));
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

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

        // Done
        /* eslint-disable no-await-in-loop */
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

        // Done
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

        // Done
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
                  } else {
                    if (quantity != null && item.quantity !== quantity) {
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
                  } else {
                    if (quantity != null && item.quantity !== quantity) {
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
                }
                return item;
              });

              if (shouldUpdateCart) cartsNeedingUpdate++;

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

  publicFields.forEach((field) => {
    if (req.body[field]) {
      product[field] = req.body[field];
    }
  });

  await product.save();
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
