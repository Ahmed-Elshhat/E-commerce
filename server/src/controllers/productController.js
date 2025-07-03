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
  //1- Image processing for coverImage
  if (req.files.coverImage) {
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
  if (req.files.images) {
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
    // sizes,
    // colors,
    // price,
    // priceAfterDiscount,
    // quantity,
    // deleteGeneralColors,
    updateSizes,
  } = body;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ApiError(`No product for this id ${req.params.id}`, 404));
  }

  // 1 - update color quantity in size
  // 2 - update color name in size
  // 3 - update color name in size and update color quantity in size

  // 4 - update size name
  // 5 - update size price
  // 6 - update size priceAfterDiscount
  // 7 - update size quantity
  // 8 - update size (name, price, priceAfterDiscount, quantity) Or all Or Some Or all and update color (quantity , price) OR all update color(all)
  // 9 - update multiple sizes
  // 10 - update multiple sizes and delete sizes
  // 11 - delete all sizes
  // 12 - delete all sizes and add general colors

  // 13 - update general colors quantity
  // 14 - update general colors quantity and name

  if (product.sizes && product.sizes.length > 0) {
    if (updateSizes && updateSizes.length > 0) {
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

          if (size.sizeName.toLowerCase() === size.newSizeName?.toLowerCase()) {
            next(
              new ApiError(
                `The new name for size "${size.sizeName}" matches the old name. It must be different.`,
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
            new ApiError(`Price for "${size.sizeName}" must be a number.`, 400)
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
              (color) => color.toLowerCase() === lowerC
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
                  `❌ Duplicate color "${c}" found in deleteColors list for size "${size.sizeName}" at index ${i}. Each color must be unique.`,
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

        if (size.sizeQuantity != null) {
          const hasOriginalColors = original.colors.length > 0;
          const hasNewOrUpdatedColors =
            Array.isArray(size.sizeColors) &&
            size.sizeColors.some(
              (c) => c.type === "new" || c.type === "update"
            );

          const allOriginalColorsDeleted =
            Array.isArray(size.deleteColors) &&
            size.deleteColors.length === original.colors.length &&
            original.colors.every((oc) =>
              size.deleteColors.some(
                (dc) => dc.toLowerCase() === oc.color.toLowerCase()
              )
            );

          // الحالة 1: فيه ألوان أصلية
          if (hasOriginalColors) {
            if (
              !Array.isArray(size.deleteColors) ||
              size.deleteColors.length === 0
            ) {
              return next(
                new ApiError(
                  `❌ Cannot update size quantity for "${size.sizeName}" because it has original colors but no delete colors were provided.`,
                  400
                )
              );
            }

            if (!allOriginalColorsDeleted) {
              return next(
                new ApiError(
                  `❌ Cannot update size quantity for "${size.sizeName}" unless all original colors are marked for deletion.`,
                  400
                )
              );
            }

            if (hasNewOrUpdatedColors) {
              return next(
                new ApiError(
                  `❌ Cannot update size quantity for "${size.sizeName}" while adding or updating colors.`,
                  400
                )
              );
            }
          }

          // الحالة 2: مفيش ألوان أصلية
          if (!hasOriginalColors) {
            if (
              Array.isArray(size.deleteColors) &&
              size.deleteColors.length > 0
            ) {
              return next(
                new ApiError(
                  `❌ Cannot delete colors for "${size.sizeName}" because it has no original colors.`,
                  400
                )
              );
            }

            if (hasNewOrUpdatedColors) {
              return next(
                new ApiError(
                  `❌ Cannot update size quantity for "${size.sizeName}" while adding or updating colors.`,
                  400
                )
              );
            }
          }
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
                  `Missing color name for size "${size.sizeName}" at color index ${colorIndex}. The "Color name" field is required.`,
                  400
                )
              );
              return true;
            }

            if (
              color.newColorName &&
              color.colorName.toLowerCase() === color.newColorName.toLowerCase()
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
              if (size.deleteColors.includes(color.colorName)) {
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
                    `Please specify the quantity available for the new color in size "${size.sizeName}".`,
                    400
                  )
                );
                return true;
              }

              if (color.newColorName) {
                next(
                  new ApiError(
                    `❌ For new colors in size "${size.sizeName}", use "colorName" only. Do not include "newColorName".`,
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
              if (size.deleteColors.includes(color.colorName)) {
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

            if (
              color.newColorName &&
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

            seenOldColorNames.push(color.colorName.toLowerCase());
            if (color.newColorName) {
              seenNewColorNames.push(color.newColorName.toLowerCase());
            }

            return false;
          });

          if (colorValidator) return true;
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
        const updatePromises = updateSizes.map(async (size) => {
          if (size.newSizeName) {
            const originalCartCount = await Cart.countDocuments({
              "cartItems.product": product._id,
              "cartItems.size": size.sizeName,
            });

            let updatedCartCount = 0;

            const result = await Cart.updateMany(
              {
                "cartItems.product": product._id,
                "cartItems.size": size.sizeName,
              },
              {
                $set: {
                  "cartItems.$[elem].isAvailable": false,
                },
              },
              {
                arrayFilters: [
                  {
                    "elem.product": product._id,
                    "elem.size": size.sizeName,
                  },
                ],
                session,
              }
            );

            if (result.modifiedCount > 0) {
              updatedCartCount += result.modifiedCount;
            }

            if (updatedCartCount < originalCartCount) {
              throw new ApiError(
                "Not all carts were updated. Transaction rolled back.",
                400
              );
            }

            const affectedCarts = await Cart.find({
              "cartItems.product": product._id,
              "cartItems.size": size.sizeName,
            }).session(session);

            await Promise.all(
              affectedCarts.map(async (cart) => {
                calcTotalCartPrice(cart);
                await cart.save({ session });
              })
            );

            product.sizes.forEach((productSize) => {
              if (
                productSize.size.toLowerCase() === size.sizeName.toLowerCase()
              ) {
                productSize.size = size.newSizeName;
              }
            });
          }

          let productSize = product.sizes.find((s) => {
            if (size.newSizeName) {
              return s.size.toLowerCase() === size.newSizeName.toLowerCase();
            }
            return s.size.toLowerCase() === size.sizeName.toLowerCase();
          });

          if (!productSize) {
            throw new ApiError(
              `Size "${size.sizeName}" not found in the product.`,
              400
            );
          }

          if (
            size.sizePriceAfterDiscount !== undefined &&
            size.deletePriceAfterDiscount
          ) {
            throw new ApiError(
              `Cannot update and delete price after discount simultaneously for size "${size.sizeName}".`,
              400
            );
          }

          if (size.deletePriceAfterDiscount) {
            if (productSize.priceAfterDiscount === undefined) {
              throw new ApiError(
                `Cannot delete the price after discount for size "${size.sizeName}" because it does not have a price after discount.`,
                400
              );
            }

            productSize.priceAfterDiscount = undefined;

            const cartsToUpdate = await Cart.find({
              "cartItems.product": product._id,
              "cartItems.size": size.sizeName,
            }).session(session);

            const originalCartCount = cartsToUpdate.length;

            const updateResults = await Promise.all(
              cartsToUpdate.map(async (cart) => {
                const updatedItems = cart.cartItems.map((item) => {
                  if (
                    item.product._id.toString() === product._id.toString() &&
                    item.size.toLowerCase() === size.sizeName.toLowerCase()
                  ) {
                    item.price = productSize.price;
                  }
                  return item;
                });

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

            const updatedCartCount = updateResults.reduce(
              (sum, count) => sum + count,
              0
            );

            if (updatedCartCount < originalCartCount) {
              throw new ApiError(
                `Not all carts were updated after deleting price after discount for size "${size.sizeName}". Transaction rolled back.`,
                400
              );
            }
          }

          if (size.sizePrice !== undefined) {
            productSize.price = size.sizePrice;

            if (size.sizePriceAfterDiscount !== undefined) {
              productSize.priceAfterDiscount = size.sizePriceAfterDiscount;
            }

            const cartsToUpdate = await Cart.find({
              "cartItems.product": product._id,
              "cartItems.size": size.sizeName,
            }).session(session);

            const originalCartCount = cartsToUpdate.length;

            const updateResults = await Promise.all(
              cartsToUpdate.map(async (cart) => {
                const updatedItems = cart.cartItems.map((item) => {
                  if (
                    item.product._id.toString() === product._id.toString() &&
                    item.size.toLowerCase() === size.sizeName.toLowerCase()
                  ) {
                    item.price =
                      size?.sizePriceAfterDiscount ??
                      productSize?.priceAfterDiscount ??
                      size.sizePrice;
                  }
                  return item;
                });

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

            const updatedCartCount = updateResults.reduce(
              (sum, count) => sum + count,
              0
            );

            if (updatedCartCount < originalCartCount) {
              throw new ApiError(
                `Not all carts were updated after changing price for size "${size.sizeName}". Transaction rolled back.`,
                400
              );
            }
          } else if (size.sizePriceAfterDiscount !== undefined) {
            productSize.priceAfterDiscount = size.sizePriceAfterDiscount;

            const cartsToUpdate = await Cart.find({
              "cartItems.product": product._id,
              "cartItems.size": size.sizeName,
            }).session(session);

            const originalCartCount = cartsToUpdate.length;

            const updateResults = await Promise.all(
              cartsToUpdate.map(async (cart) => {
                const updatedItems = cart.cartItems.map((item) => {
                  if (
                    item.product._id.toString() === product._id.toString() &&
                    item.size.toLowerCase() === size.sizeName.toLowerCase()
                  ) {
                    item.price =
                      size?.sizePriceAfterDiscount ??
                      productSize?.priceAfterDiscount ??
                      productSize.price;
                  }
                  return item;
                });

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

            const updatedCartCount = updateResults.reduce(
              (sum, count) => sum + count,
              0
            );

            if (updatedCartCount < originalCartCount) {
              throw new ApiError(
                `Not all carts were updated after changing price for size "${size.sizeName}". Transaction rolled back.`,
                400
              );
            }
          }

          if (size.sizeQuantity !== undefined) {
            productSize.quantity = size.sizeQuantity;

            const cartsToUpdate = await Cart.find({
              "cartItems.product": product._id,
              "cartItems.size": size.sizeName,
            }).session(session);

            let originalCartCount = 0;

            const updateResults = await Promise.all(
              cartsToUpdate.map(async (cart) => {
                const updatedItems = cart.cartItems.map((item) => {
                  if (
                    item.product._id.toString() === product._id.toString() &&
                    item.size.toLowerCase() === size.sizeName.toLowerCase()
                  ) {
                    if (item.quantity > size.sizeQuantity) {
                      originalCartCount++;
                      item.quantity = size.sizeQuantity;
                    }
                  }
                  return item;
                });

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

            const updatedCartCount = updateResults.reduce(
              (sum, count) => sum + count,
              0
            );

            if (updatedCartCount < originalCartCount) {
              throw new ApiError(
                `Not all carts were updated after changing quantity for size "${size.sizeName}". Transaction rolled back.`,
                400
              );
            }
          }

          if (size.sizeColors != null && size.sizeColors.length > 0) {
            productSize.size = undefined;

            size.sizeColors.forEach(async (color) => {
              if (color.type === "new") {
                const cartsToUpdate = await Cart.find({
                  "cartItems.product": product._id,
                  "cartItems.size": size.sizeName,
                  "cartItems.color": color.colorName,
                }).session(session);
                productSize.colors.push({
                  color: color.colorName,
                  quantity: color.quantity,
                });
                if (cartsToUpdate.length !== 0) {
                  let originalCartCount = 0;

                  const updateResults = await Promise.all(
                    cartsToUpdate.map(async (cart) => {
                      const updatedItems = cart.cartItems.map((item) => {
                        if (
                          item.product._id.toString() ===
                            product._id.toString() &&
                          item.size.toLowerCase() ===
                            size.sizeName.toLowerCase() &&
                          item.color.toLowerCase() ===
                            color.colorName.toLowerCase()
                        ) {
                          originalCartCount++;
                          item.isAvailable = true;
                          item.quantity = Math.min(
                            item.quantity,
                            color.colorQuantity
                          );
                        }
                        return item;
                      });

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

                  const updatedCartCount = updateResults.reduce(
                    (sum, count) => sum + count,
                    0
                  );

                  if (updatedCartCount < originalCartCount) {
                    throw new ApiError(
                      `Not all carts were updated after changing quantity for size "${size.sizeName}". Transaction rolled back.`,
                      400
                    );
                  }
                }
              } else if (color.type === "update") {
                productSize.colors.forEach((c) => {
                  if (c.color.toLowerCase() === color.colorName.toLowerCase()) {
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
                  let currentOriginalCartCount = 0;

                  const currentUpdateResults = await Promise.all(
                    currentCartsToUpdate.map(async (cart) => {
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
                          currentOriginalCartCount++;
                        }
                        return item;
                      });

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

                  const currentUpdatedCartCount = currentUpdateResults.reduce(
                    (sum, count) => sum + count,
                    0
                  );

                  if (currentUpdatedCartCount < currentOriginalCartCount) {
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
                    let oldOriginalCartCount = 0;

                    const oldUpdateResults = await Promise.all(
                      oldCartsToUpdate.map(async (cart) => {
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
                            oldOriginalCartCount++;
                          }
                          return item;
                        });

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

                    const oldUpdatedCartCount = oldUpdateResults.reduce(
                      (sum, count) => sum + count,
                      0
                    );

                    if (oldUpdatedCartCount < oldOriginalCartCount) {
                      throw new ApiError(
                        `Not all carts were updated after changing quantity for size "${size.sizeName}". Transaction rolled back.`,
                        400
                      );
                    }
                  }
                }
              }
            });
          }
        });

        await Promise.all(updatePromises);
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
      ](ok)
      deleteColors?: ["#fd34d4", ...]
      deletePriceAfterDiscount: true;(ok)(ok)
    }
  ];


  deleteSizes = ["S", ...]

  updateGeneralColors = [
    {
      colorName: "#f343df",
      newColorName: "#f343df",
      colorQuantity: 10,
    }
  ]

  deleteGeneralColors = ["#f343df", ...]

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
