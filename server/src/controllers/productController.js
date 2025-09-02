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
  if (req.body.sizes != null && !Array.isArray(req.body.sizes)) {
    try {
      req.body.sizes = JSON.parse(req.body.sizes); // Convert sizes from string to JSON
    } catch (error) {
      // step 3: If conversion fails, return an error stating that the sizes format is invalid
      return next(new ApiError("Invalid sizes format.", 400));
    }
  }

  if (req.body.addSizes != null && !Array.isArray(req.body.addSizes)) {
    try {
      req.body.addSizes = JSON.parse(req.body.addSizes); // Convert update sizes from string to JSON
    } catch (error) {
      // step 5: If conversion fails, return an error stating that the colors format is invalid
      return next(new ApiError("Invalid addSizes format.", 400));
    }
  }

  if (req.body.updateSizes != null && !Array.isArray(req.body.updateSizes)) {
    try {
      req.body.updateSizes = JSON.parse(req.body.updateSizes); // Convert update sizes from string to JSON
    } catch (error) {
      // step 5: If conversion fails, return an error stating that the colors format is invalid
      return next(new ApiError("Invalid updateSizes format.", 400));
    }
  }

  if (req.body.deleteSizes != null && !Array.isArray(req.body.deleteSizes)) {
    try {
      req.body.deleteSizes = JSON.parse(req.body.deleteSizes); // Convert update sizes from string to JSON
    } catch (error) {
      // step 5: If conversion fails, return an error stating that the colors format is invalid
      return next(new ApiError("Invalid deleteSizes format.", 400));
    }
  }

  if (req.body.deleteGeneralColors != null && !Array.isArray(req.body.deleteGeneralColors)) {
    try {
      req.body.deleteGeneralColors = JSON.parse(req.body.deleteGeneralColors);
    } catch (err) {
      return next(
        new ApiError(
          "Invalid deleteGeneralColors format.",
          400
        )
      );
    }
  }

  if (req.body.colors != null && !Array.isArray(req.body.colors)) {
    try {
      req.body.colors = JSON.parse(req.body.colors); // Convert colors from string to JSON
    } catch (error) {
      // step 5: If conversion fails, return an error stating that the colors format is invalid
      return next(new ApiError("Invalid colors format.", 400));
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
  /* 
    The following fields were not validated:
      - sizes: 
        - quantity

    Fields were not applied to user carts that do not contain sizes:
      - Without sizes:
        - deletePriceAfterDiscount
  */
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
    deleteGeneralColors,
    deletePriceAfterDiscount,
    // addGeneralColors,
    // updateGeneralColors,
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

      if (deletePriceAfterDiscount != null) {
        return next(
          new ApiError(
            "The 'Delete price after discount' field is not allowed when adding, updating, or deleting sizes.",
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

      let updateStatus = true;
      const validationErrors = {};
      if (product.sizesIsExist) {
        // Validation
        // Check if deleteSizes is provided, is an array, and contains at least one element
        if (
          deleteSizes != null &&
          Array.isArray(deleteSizes) &&
          deleteSizes?.length > 0
        ) {
          // Array to keep track of sizes we've already processed (to detect duplicates)
          const seenDeleteSizes = [];

          // Array to collect all validation error messages related to deleteSizes
          const deleteSizesErrors = [];

          // Loop through each size in the deleteSizes array
          deleteSizes.forEach((s, i) => {
            // Convert the size to lowercase and trim whitespace if it's a string; otherwise set to null
            const lowerS =
              typeof s === "string" ? s?.trim()?.toLowerCase() : null;

            // Store error messages for the current size
            const errors = [];

            // Validation 1: Check if the value is a string
            if (typeof lowerS !== "string") {
              errors.push(
                `Size at index ${i + 1} in the delete sizes list must be a string.`
              );

              // Validation 2: Check if the value is an empty string after trimming
            } else if (lowerS === "") {
              errors.push(
                `Size at index ${i + 1} in the delete sizes list cannot be empty.`
              );
            } else {
              // Validation 3: Check if the size exists in the original product sizes list
              const existsInOriginal = product.sizes.some(
                (size) => size?.size?.trim()?.toLowerCase() === lowerS
              );

              if (!existsInOriginal) {
                errors.push(
                  `Cannot delete size "${s}" because it does not exist in the original sizes list.`
                );
              }

              // Validation 4: Check if the size has already been added to the seen list (duplicate check)
              if (seenDeleteSizes.includes(lowerS)) {
                errors.push(
                  `Duplicate size "${s}" found in delete sizes list at index ${i}. Each size must be unique.`
                );
              }

              // Normalize the deleteSizes array by replacing the original value with the lowercase version
              deleteSizes[i] = lowerS;
            }

            // If there are any validation errors for this size, add them to deleteSizesErrors
            if (errors?.length > 0) {
              deleteSizesErrors.push({
                index: i, // Position of the problematic size in the array
                message: errors, // Array of error messages for this specific size
              });
            }

            // Mark this size as processed by adding it to the seen list
            seenDeleteSizes.push(lowerS);
          });

          // If there are any accumulated validation errors for deleteSizes, store them in validationErrors
          // and set updateStatus to false to indicate validation failed
          if (deleteSizesErrors?.length > 0) {
            validationErrors.deleteSizes = deleteSizesErrors;
            updateStatus = false;
          }
        }

        // ---------------------------------------------
        // UPDATE SIZES VALIDATION & NORMALIZATION FLOW
        // ---------------------------------------------
        // This block validates requests to update product sizes (rename size, update price,
        // set/clear discounted price, update general size quantity, manage size colors).
        // It accumulates all validation errors without throwing, so the caller can display
        // a full list of issues at once. It also normalizes some inputs to lowercase
        // (for consistent comparisons) but does NOT mutate the original product data here.
        //
        // Key concepts used repeatedly:
        // - "original": the existing size object on the product matching the incoming sizeName.
        // - "normalizedName": lowercased + trimmed version of size.sizeName.
        // - "seenSizeNames"/"seenNewSizeNames": track duplicates inside the same payload.
        // - "updateSizesErrors": errors tied to size-level fields (name/price/quantity).
        // - "updateSizeColorsErrors": errors tied to color-level updates within sizes.
        // - "validationErrors": global collector keyed by category.
        // - "updateStatus": flipped to false if any validation failed.
        //
        // NOTE: All name comparisons are performed in lowercase to ensure case-insensitive matching.
        // ---------------------------------------------

        const seenNewSizeNames = []; // Tracks all *new* size names across the entire updateSizes payload to prevent duplicates

        if (
          updateSizes != null &&
          Array.isArray(updateSizes) &&
          updateSizes?.length > 0
        ) {
          const seenSizeNames = []; // Tracks incoming size.sizeName values to prevent updating the same size multiple times
          const updateSizesErrors = []; // Collects errors for size-level updates (rename, price, quantity, etc.)
          const updateSizeColorsErrors = []; // Collects color-level errors per size

          // Iterate over each requested size update
          updateSizes.forEach((size, index) => {
            const errors = []; // Errors for the current size (index)
            let normalizedName = null; // Lowercased+trimmed version of size.sizeName (once validated)
            let original = null; // Reference to the existing size in product.sizes (if found)

            // ---------------------------
            // 1) Validate the target size
            // ---------------------------
            // Ensure we have a valid sizeName and that the size actually exists on the product.
            if (size?.sizeName == null) {
              errors.push(`Size name is required for update.`);
            } else if (typeof size?.sizeName !== "string") {
              errors.push(`Size name is required for update.`);
            } else {
              normalizedName = size.sizeName?.trim()?.toLowerCase();

              // Try to find the original size on the product by case-insensitive match
              original = product.sizes.find(
                (s) => s?.size?.trim()?.toLowerCase() === normalizedName
              );

              if (!original) {
                errors.push(
                  `Size "${size.sizeName}" does not exist in the product.`
                );
              }

              // If a new name is provided, validate its type and that it differs from the old name
              if (size?.newSizeName != null) {
                if (typeof size?.newSizeName !== "string") {
                  errors.push(`The new size name must be a string.`);
                } else if (
                  normalizedName === size?.newSizeName?.trim()?.toLowerCase()
                ) {
                  errors.push(
                    `The new name for size "${size.sizeName}" matches the old name. It must be different.`
                  );
                }
              }

              // Prevent multiple updates to the same size within a single payload
              if (
                seenSizeNames.includes(size.sizeName?.trim()?.toLowerCase())
              ) {
                errors.push(`Only one update per size is allowed.`);
              }

              // If this size is also marked for deletion, block modification
              if (
                deleteSizes != null &&
                Array.isArray(deleteSizes) &&
                deleteSizes?.length > 0
              ) {
                const shouldDeleteThisSize = deleteSizes.some(
                  (s) => s?.trim()?.toLowerCase() === normalizedName
                );

                if (shouldDeleteThisSize) {
                  errors.push(
                    `Size "${size.sizeName}" is marked for deletion and cannot be modified.`
                  );
                }
              }
            }

            // --------------------------------------------------------------------------
            // 2) Ensure at least one actionable change exists for this size update object
            // --------------------------------------------------------------------------
            // If no rename, no price changes, no quantity, no color updates or deletions -> no-op error
            if (
              size?.newSizeName == null &&
              size?.sizePrice == null &&
              size?.sizePriceAfterDiscount == null &&
              size?.sizeQuantity == null &&
              (size?.sizeColors == null ||
                !Array.isArray(size?.sizeColors) ||
                size?.sizeColors?.length === 0) &&
              (size?.deleteColors == null ||
                !Array.isArray(size?.deleteColors) ||
                size.deleteColors?.length === 0)
            ) {
              errors.push(
                `No actual update provided for size "${size.sizeName}". Please specify at least one change.`
              );
            }

            // -----------------------------------
            // 3) Validate new size name (if given)
            // -----------------------------------
            // Check: type, uniqueness vs existing product sizes, and duplicates within the payload
            if (size?.newSizeName != null) {
              if (typeof size?.newSizeName !== "string") {
                errors.push(`The new size name must be a string.`);
              } else {
                const newNameIsExist = product.sizes.find(
                  (s) =>
                    s?.size?.toLowerCase() ===
                    size?.newSizeName?.trim()?.toLowerCase()
                );

                if (newNameIsExist) {
                  errors.push(
                    `The new size name "${size.newSizeName}" already exists in the product. Please choose a different name.`
                  );
                }

                // Prevent two different size updates from attempting to rename to the same new name
                if (
                  seenNewSizeNames.includes(
                    size?.newSizeName?.trim()?.toLowerCase()
                  )
                ) {
                  errors.push(
                    `Duplicate new size name detected. Each size must have a unique name.`
                  );
                }

                // Prevent rename conflicts with an incoming sizeName within the same payload
                if (
                  seenSizeNames.includes(
                    size?.newSizeName?.trim()?.toLowerCase()
                  )
                ) {
                  errors.push(
                    `The new size name "${size.newSizeName}" conflicts with an existing size name. Please choose a different name.`
                  );
                }
              }
            }

            // ------------------------------------
            // 4) Validate size price (if provided)
            // ------------------------------------
            // Checks: numeric, > 0, different from existing, and > existing discounted price (unless also updating discount)
            if (size?.sizePrice != null) {
              if (typeof size?.sizePrice !== "number") {
                errors.push(`Price for "${size.sizeName}" must be a number.`);
              } else if (size?.sizePrice <= 0) {
                errors.push(
                  `Size price must be a positive number greater than 0.`
                );
              } else if (original != null) {
                // Must be different from the current original price
                if (size?.sizePrice === original?.price) {
                  errors.push(
                    `The new price for size "${size.sizeName}" must be different from the old price.`
                  );
                }

                // If not also setting a new discounted price, then price must be strictly greater than existing discounted price
                if (
                  size?.sizePriceAfterDiscount == null &&
                  size?.sizePrice <= original?.priceAfterDiscount
                ) {
                  errors.push(
                    `The price for size "${size.sizeName}" must not be less than or equal to its existing discounted price.`
                  );
                }
              }
            }

            // ----------------------------------------------------
            // 5) Validate discounted price (if provided/modified)
            // ----------------------------------------------------
            // Checks: cannot update and delete simultaneously, numeric, > 0, different from existing,
            // and must be < original price when sizePrice is not provided alongside.
            if (size?.sizePriceAfterDiscount != null) {
              // Guard: cannot update and delete discounted price in the same request
              if (size?.deletePriceAfterDiscount === true) {
                errors.push(
                  `Cannot update and delete price after discount simultaneously for size "${size.sizeName}".`
                );
              }

              if (typeof size?.sizePriceAfterDiscount !== "number") {
                errors.push(
                  `Discounted price for "${size.sizeName}" must be a number.`
                );
              } else if (size?.sizePriceAfterDiscount <= 0) {
                errors.push(
                  `Size price after discount after discount must be a positive number greater than 0.`
                );
              } else if (original != null) {
                // Must be different from current discounted price if one exists
                if (
                  original?.priceAfterDiscount != null &&
                  size?.sizePriceAfterDiscount === original?.priceAfterDiscount
                ) {
                  errors.push(
                    `The new discounted price for size "${size.sizeName}" must be different from the old discounted price.`
                  );
                }

                // If not also setting a new base price, ensure discounted price < existing original price
                if (
                  size?.sizePrice == null &&
                  size?.sizePriceAfterDiscount > original?.price
                ) {
                  errors.push(
                    `Discounted price for "${size.sizeName}" must be less than the original price (${original.price}).`
                  );
                }
              }
            }

            // ----------------------------------------------------------------
            // 6) Cross-field price rule: discount must be < base price (if both)
            // ----------------------------------------------------------------
            if (
              size?.sizePrice != null &&
              size?.sizePriceAfterDiscount != null &&
              size?.sizePriceAfterDiscount > size?.sizePrice
            ) {
              errors.push(
                `Discounted price for "${size.sizeName}" must be less than the original price.`
              );
            }

            // --------------------------------------------
            // 7) Validate deleteColors (if any were given)
            // --------------------------------------------
            // For each listed color to delete: must be string, non-empty, exist on the original size,
            // and must be unique within the delete list.
            if (
              size?.deleteColors != null &&
              Array.isArray(size?.deleteColors) &&
              size?.deleteColors?.length > 0
            ) {
              const seenDeleteColors = []; // Tracks duplicates within this deleteColors array
              const deleteColorErrors = []; // Errors tied to individual delete color entries

              size.deleteColors.forEach((c, i) => {
                const colorValidationErrors = [];
                const lowerC =
                  typeof c === "string" ? c?.trim()?.toLowerCase() : null;

                // Type/emptiness validation
                if (typeof lowerC !== "string") {
                  colorValidationErrors.push(
                    `Color at index ${i + 1} in the deleted colors list must be a string.`
                  );
                } else if (lowerC === "") {
                  colorValidationErrors.push(
                    `Color at index ${i + 1} in the deleted colors list cannot be empty.`
                  );
                } else {
                  // Ensure the color exists in the original size before deletion
                  if (
                    size?.sizeName != null &&
                    typeof size?.sizeName === "string" &&
                    original != null
                  ) {
                    const existsInOriginal = original.colors.some(
                      (color) => color?.color?.trim()?.toLowerCase() === lowerC
                    );
                    if (!existsInOriginal) {
                      colorValidationErrors.push(
                        `Cannot delete color "${c}" at index ${i + 1} in size "${size.sizeName}" because it does not exist in the original color list.`
                      );
                    }
                  }

                  // Duplicate delete check
                  if (seenDeleteColors.includes(lowerC)) {
                    colorValidationErrors.push(
                      `Duplicate color "${c}" found in delete colors list for size "${size.sizeName}" at index ${i + 1}. Each color must be unique.`
                    );
                  }

                  // Mark as seen to catch duplicates
                  seenDeleteColors.push(lowerC);

                  // Normalize the deleteColors array by replacing the original value with the lowercase version
                  size.deleteColors[i] = lowerC;
                }

                // Record any errors for this color entry
                if (colorValidationErrors?.length > 0) {
                  deleteColorErrors.push({
                    colorIndex: i,
                    message: colorValidationErrors,
                  });
                }
              });

              // If any color deletion errors exist, attach them under validationErrors.updateSizesDeleteColors
              if (deleteColorErrors?.length > 0) {
                if (!validationErrors?.updateSizesDeleteColors) {
                  validationErrors.updateSizesDeleteColors = [];
                }
                validationErrors.updateSizesDeleteColors.push({
                  index, // index of the current size in updateSizes
                  deleteColors: deleteColorErrors,
                });
                updateStatus = false;
              }
            }

            // ------------------------------------------
            // 8) Validate sizeColors (add/update colors)
            // ------------------------------------------
            // Each color entry must specify a type ("new" or "update") and a colorName.
            // We also enforce:
            // - uniqueness of colorName/newColorName within this request
            // - disallow adding/updating a color that is scheduled for deletion
            // - for "new": require colorQuantity and disallow newColorName
            // - for "update": require actual change (quantity or rename), ensure target exists, check conflicts
            if (
              size?.sizeColors != null &&
              Array.isArray(size?.sizeColors) &&
              size?.sizeColors?.length > 0
            ) {
              const seenOldColorNames = []; // Track duplicates among provided colorName values
              const seenNewColorNames = []; // Track duplicates among provided newColorName values
              const colorErrors = []; // Collects per-color validation errors for this size

              size.sizeColors.forEach((color, colorIndex) => {
                const colorValidationErrors = [];

                // --- (a) type validation ---
                if (color?.type == null) {
                  colorValidationErrors.push(
                    `Color update type is required for size "${size.sizeName}" at color index ${colorIndex + 1}. Please specify either "update" or "new".`
                  );
                } else if (typeof color?.type !== "string") {
                  colorValidationErrors.push(
                    `Color type ${size.sizeName != null && typeof size.sizeName === "string" ? `for size "${size.sizeName}"` : ""} at color index ${colorIndex + 1} must be a string.`
                  );
                } else if (
                  color?.type?.trim()?.toLowerCase() !== "new" &&
                  color?.type?.trim()?.toLowerCase() !== "update"
                ) {
                  colorValidationErrors.push(
                    `Invalid color update type "${color.type}" for size "${size.sizeName}" at color index ${colorIndex + 1}. Expected "new" or "update".`
                  );
                }

                // --- (b) colorName validation ---
                if (color?.colorName == null) {
                  colorValidationErrors.push(
                    `Missing color name for size "${size.sizeName}" at color index ${colorIndex + 1}.`
                  );
                } else if (typeof color?.colorName !== "string") {
                  colorValidationErrors.push(
                    `Color name ${size.sizeName != null && typeof size.sizeName === "string" ? `for size "${size.sizeName}"` : ""} at color index ${colorIndex + 1} must be a string.`
                  );
                } else {
                  // If renaming, newColorName must differ from colorName
                  if (
                    color?.newColorName != null &&
                    color?.colorName?.trim()?.toLowerCase() ===
                      color?.newColorName?.trim()?.toLowerCase()
                  ) {
                    colorValidationErrors.push(
                      `New color name must be different from the old color name for size "${size.sizeName}" at color index ${colorIndex + 1}.`
                    );
                  }

                  // Prevent duplicate colorName entries within the same size update
                  if (
                    seenOldColorNames.includes(
                      color?.colorName?.trim()?.toLowerCase()
                    )
                  ) {
                    colorValidationErrors.push(
                      `Duplicate color name "${color.colorName}" found in size "${size.sizeName}" at color index ${colorIndex + 1}.`
                    );
                  }
                }

                // --- (c) newColorName duplicates/conflicts ---
                if (color?.newColorName != null) {
                  // Prevent duplicate new names in the same size update
                  if (
                    seenNewColorNames.includes(
                      color?.newColorName?.trim()?.toLowerCase()
                    )
                  ) {
                    colorValidationErrors.push(
                      `Duplicate new color name "${color.newColorName}" found in size "${size.sizeName}" at color index ${colorIndex + 1}.`
                    );
                  }
                  // Prevent renaming to a name that already exists in the same request (old list)
                  if (
                    seenOldColorNames.includes(
                      color?.newColorName?.trim()?.toLowerCase()
                    )
                  ) {
                    colorValidationErrors.push(
                      `The color name "${color.newColorName}" already exists. Please choose a unique name.`
                    );
                  }
                }

                // --- (d) quantity validation (if provided) ---
                // Must be a positive integer. Note: the error message says "cannot be negative" but
                // the check forbids zero as well (<= 0). This is intentional in logic.
                let quantityErrorsStatus = false;
                if (color?.colorQuantity != null) {
                  if (typeof color?.colorQuantity !== "number") {
                    colorValidationErrors.push(
                      `Color quantity${size.sizeName != null && typeof size.sizeName === "string" ? ` for size "${size.sizeName}"` : ""} at color index ${colorIndex + 1} must be a number.`
                    );
                    quantityErrorsStatus = true;
                  } else if (color?.colorQuantity <= 0) {
                    colorValidationErrors.push(
                      `Color quantity for size "${size.sizeName}" at color index ${colorIndex + 1} cannot be negative.`
                    );
                    quantityErrorsStatus = true;
                  } else if (!Number.isInteger(color?.colorQuantity)) {
                    colorValidationErrors.push(
                      `Color quantity for size "${size.sizeName}" at color index ${colorIndex + 1} must be an integer.`
                    );
                    quantityErrorsStatus = true;
                  }
                }

                // --- (e) Behavior by type: "new" vs "update" ---
                if (
                  color?.type != null &&
                  typeof color?.type === "string" &&
                  (color?.type?.trim()?.toLowerCase() === "new" ||
                    color?.type?.trim()?.toLowerCase() === "update")
                ) {
                  // ------ TYPE: "new" ------
                  if (color?.type?.trim()?.toLowerCase() === "new") {
                    // Cannot add a color that is also listed in deleteColors
                    if (
                      color?.colorName != null &&
                      typeof color?.colorName === "string"
                    ) {
                      if (
                        size?.deleteColors != null &&
                        Array.isArray(size?.deleteColors) &&
                        size.deleteColors?.length > 0 &&
                        size.deleteColors?.includes(
                          color?.colorName?.trim()?.toLowerCase()
                        )
                      ) {
                        colorValidationErrors.push(
                          `Color "${color.colorName}" cannot be added because it is scheduled for deletion.`
                        );
                      }
                    }

                    // New colors must include a quantity
                    if (color?.colorQuantity == null) {
                      colorValidationErrors.push(
                        `Please specify the quantity for the new color "${color.colorName}" in size "${size.sizeName}".`
                      );
                    }

                    // newColorName is not applicable for "new" type
                    if (color?.newColorName != null) {
                      colorValidationErrors.push(
                        `For new colors in size "${size.sizeName}", use "Color Name" only.`
                      );
                    }

                    // Prevent adding a color that already exists on the original size
                    if (
                      original != null &&
                      color?.colorName != null &&
                      typeof color?.colorName === "string"
                    ) {
                      const newColorNameIsExist = original.colors.find(
                        (c) =>
                          c.color.toLowerCase() ===
                          color.colorName?.trim()?.toLowerCase()
                      );
                      if (newColorNameIsExist) {
                        colorValidationErrors.push(
                          `The color name "${color.colorName}" already exists in size "${original.size}".`
                        );
                      }
                    }
                  }

                  // ------ TYPE: "update" ------
                  if (color?.type?.trim()?.toLowerCase() === "update") {
                    if (
                      color.colorName != null &&
                      typeof color.colorName === "string"
                    ) {
                      // Cannot update a color that is scheduled for deletion
                      if (
                        size?.deleteColors != null &&
                        Array.isArray(size?.deleteColors) &&
                        size.deleteColors?.length > 0 &&
                        size.deleteColors?.includes(
                          color.colorName?.trim()?.toLowerCase()
                        )
                      ) {
                        colorValidationErrors.push(
                          `Color "${color.colorName}" cannot be updated because it is scheduled for deletion.`
                        );
                      }

                      // The color being updated must exist on the original size
                      if (original != null) {
                        const existingColor = original.colors.find(
                          (c) =>
                            c.color.toLowerCase() ===
                            color?.colorName?.trim()?.toLowerCase()
                        );
                        if (!existingColor) {
                          colorValidationErrors.push(
                            `The original color "${color.colorName}" does not exist in size "${original.size}".`
                          );
                        } else {
                          // Require an actual change: either quantity differs (and is valid), or the name actually changes
                          let isSameQuantity =
                            color?.colorQuantity == null ||
                            quantityErrorsStatus ||
                            color?.colorQuantity === existingColor?.quantity;

                          const isSameName =
                            color?.newColorName == null ||
                            typeof color?.newColorName !== "string" ||
                            color?.newColorName?.trim()?.toLowerCase() ===
                              color?.colorName?.trim()?.toLowerCase();

                          if (isSameQuantity && isSameName) {
                            colorValidationErrors.push(
                              `No update provided for the color "${color.colorName}" in size "${original.size}".`
                            );
                          }
                        }
                      }
                    }

                    // If provided, newColorName must be a string and must not conflict with deletions or existing colors
                    if (
                      color.newColorName != null &&
                      typeof color.newColorName !== "string"
                    ) {
                      colorValidationErrors.push(
                        `New color name ${size.sizeName != null && typeof size.sizeName === "string" ? `for size "${size.sizeName}"` : ""} at color index ${colorIndex + 1} must be a string.`
                      );
                    } else if (color.newColorName != null) {
                      // Cannot rename to a name that is also being deleted in this request
                      if (
                        size?.deleteColors != null &&
                        Array.isArray(size?.deleteColors) &&
                        size?.deleteColors?.length > 0 &&
                        size?.deleteColors?.includes(
                          color.newColorName?.trim()?.toLowerCase()
                        )
                      ) {
                        colorValidationErrors.push(
                          `Cannot rename the color to "${color.newColorName}" because it is marked for deletion.`
                        );
                      }

                      // Cannot rename to a color that already exists on the original size
                      if (original != null) {
                        const newColorNameIsExist = original.colors.find(
                          (c) =>
                            c.color.toLowerCase() ===
                            color?.newColorName?.trim()?.toLowerCase()
                        );
                        if (newColorNameIsExist) {
                          colorValidationErrors.push(
                            `The new color name "${color.newColorName}" already exists in size "${original.size}".`
                          );
                        }
                      }
                    }
                  }
                }

                // Record seen names (for duplicate detection inside this size update)
                if (color?.colorName)
                  seenOldColorNames.push(
                    color?.colorName?.trim()?.toLowerCase()
                  );
                if (color?.newColorName)
                  seenNewColorNames.push(
                    color?.newColorName?.trim()?.toLowerCase()
                  );

                // Push accumulated errors for this color entry, if any
                if (colorValidationErrors?.length > 0) {
                  colorErrors.push({
                    colorIndex,
                    message: colorValidationErrors,
                  });
                }
              });

              // If any color errors exist for this size, attach to updateSizeColorsErrors
              if (colorErrors?.length > 0) {
                updateSizeColorsErrors.push({
                  index: index, // size index within updateSizes
                  colors: colorErrors,
                });
              }
            }

            // -------------------------------------------------------
            // 9) Consistency rules between size quantity and colors
            // -------------------------------------------------------
            // You cannot set a general "sizeQuantity" while also adding/updating colors.
            // If the size currently has colors, you must delete all of them first before setting a size-level quantity.
            // Conversely, if all original colors are deleted and no new/update colors are supplied, require a general quantity.
            if (original != null) {
              // Determine if all original colors are being deleted in this request
              const allOriginalColorsDeleted =
                Array.isArray(original?.colors) &&
                original?.colors?.length > 0 && // requires there to be original colors
                Array.isArray(size?.deleteColors) &&
                size?.deleteColors?.length === original?.colors?.length &&
                original.colors.every((oc) =>
                  size.deleteColors.some(
                    (dc) =>
                      dc?.trim()?.toLowerCase() ===
                      oc?.color?.trim()?.toLowerCase()
                  )
                );

              // Determine if there are any new or updated colors in this request
              const hasNewOrUpdatedColors =
                Array.isArray(size?.sizeColors) &&
                size?.sizeColors.some(
                  (c) =>
                    c?.type?.trim()?.toLowerCase() === "new" ||
                    c?.type?.trim()?.toLowerCase() === "update"
                );

              if (size?.sizeQuantity != null) {
                const hasOriginalColors = original?.colors?.length > 0;

                // Cannot set sizeQuantity in the same request that adds/updates colors
                if (hasNewOrUpdatedColors) {
                  errors.push(
                    `Cannot update size quantity for "${size.sizeName}" while adding or updating colors.`
                  );
                }

                // Case 1: size currently has original colors -> must delete them all first
                if (hasOriginalColors) {
                  if (
                    !Array.isArray(size?.deleteColors) ||
                    size?.deleteColors?.length === 0
                  ) {
                    errors.push(
                      `You must delete all colors for size "${size.sizeName}" before adding a new quantity.`
                    );
                  }

                  if (!allOriginalColorsDeleted) {
                    errors.push(
                      `Cannot update quantity for size "${size.sizeName}" because it still has existing colors. Please delete them first.`
                    );
                  }
                }

                // Case 2: size has no original colors -> cannot request color deletions
                if (!hasOriginalColors) {
                  if (
                    Array.isArray(size?.deleteColors) &&
                    size?.deleteColors?.length > 0
                  ) {
                    errors.push(
                      `Cannot delete colors for "${size.sizeName}" because it has no original colors.`
                    );
                  }
                }
              } else if (allOriginalColorsDeleted && !hasNewOrUpdatedColors) {
                // If you are deleting all original colors and not adding/updating new ones,
                // you must provide a general sizeQuantity (otherwise the size becomes stockless).
                errors.push(
                  `If you want to delete all colors for size "${size.sizeName}", you must also provide a general quantity for the size.`
                );
              }
            }

            // -------------------------------------------
            // 10) Track seen size names for duplicate check
            // -------------------------------------------
            if (size?.sizeName != null && typeof size?.sizeName === "string") {
              seenSizeNames.push(size?.sizeName?.trim()?.toLowerCase());
            }

            // Track seen new names to prevent duplicates across the entire payload
            if (
              size?.newSizeName != null &&
              typeof size?.newSizeName === "string"
            ) {
              seenNewSizeNames.push(size?.newSizeName?.trim()?.toLowerCase());
            }

            // If this size has any errors, store them with its index
            if (errors?.length > 0) {
              updateSizesErrors.push({
                index: index,
                message: errors,
              });
            }
          });

          // ------------------------------------------
          // 11) Persist collected errors & update flag
          // ------------------------------------------
          // Attach size-level errors
          if (updateSizesErrors?.length > 0) {
            validationErrors.updateSizes = updateSizesErrors;
            updateStatus = false;
          }

          // Attach color-level errors
          if (updateSizeColorsErrors?.length > 0) {
            validationErrors.updateSizeColors = updateSizeColorsErrors;
            updateStatus = false;
          }
        }

        // ---------------------------------------------------------
        // ADD SIZES VALIDATION & NORMALIZATION (READ-ONLY COMMENTS)
        // ---------------------------------------------------------
        // This block validates a request payload that adds NEW sizes to a product.
        // It checks:
        //   - Size name presence, type, and uniqueness (vs product and within the same request)
        //   - Required price and optional discounted price rules
        //   - Either a general quantity OR a list of colors must be provided (but not both)
        //   - Color entries (if provided) must be valid, unique, and have positive integer quantities
        // ---------------------------------------------------------

        if (
          addSizes != null &&
          Array.isArray(addSizes) &&
          addSizes?.length > 0
        ) {
          // Collect size-level validation errors (per size object)
          const addSizesErrors = [];
          // Collect color-level validation errors (nested under a given size)
          const addSizeColorsErrors = [];

          // Validate each size candidate in the addSizes array
          addSizes.forEach((size, i) => {
            const errors = []; // Errors specific to this "size" entry (index i)

            // -----------------------------
            // 1) Validate size name (size)
            // -----------------------------
            if (size?.size == null) {
              errors.push(`Size name is required.`);
            } else if (typeof size?.size !== "string") {
              errors.push(`Size name must be a string.`);
            } else {
              // Check if this size already exists on the product (case-insensitive)
              const sizeIsExist = product.sizes.find(
                (s) =>
                  s?.size?.trim()?.toLowerCase() ===
                  size?.size?.trim()?.toLowerCase()
              );

              if (sizeIsExist) {
                errors.push(
                  `Size "${size.size}" already exists in the product.`
                );
              }

              // Prevent duplicates within the same addSizes payload
              // (seenNewSizeNames is assumed to be tracked outside this block for cross-section consistency)
              if (
                seenNewSizeNames.includes(size?.size?.trim()?.toLowerCase())
              ) {
                errors.push(
                  `Duplicate size "${size.size}" in addSizes at index ${i}.`
                );
              }
            }

            // -----------------------------
            // 2) Validate required price
            // -----------------------------
            if (size?.price == null) {
              errors.push(`Price is required.`);
            } else if (typeof size?.price !== "number") {
              errors.push(`Price must be a number.`);
            } else if (size?.price <= 0) {
              errors.push(`Price must be greater than 0.`);
            }

            // ---------------------------------------------------
            // 3) Validate optional priceAfterDiscount (if given)
            // ---------------------------------------------------
            // Must be a number > 0, and cannot exceed the base price.
            if (size?.priceAfterDiscount != null) {
              if (typeof size?.priceAfterDiscount !== "number") {
                errors.push(`priceAfterDiscount must be a number.`);
              } else if (size?.priceAfterDiscount <= 0) {
                errors.push(`priceAfterDiscount must be greater than 0.`);
              } else if (
                size?.price != null &&
                size?.priceAfterDiscount > size?.price
              ) {
                errors.push(
                  `priceAfterDiscount must be less than or equal to price.`
                );
              }
            }

            if (size?.deletePriceAfterDiscount != null) {
              errors.push(
                `The field 'Delete price after discount' is not allowed`
              );
            }

            // ----------------------------------------------------
            // 4) Validate quantity vs colors (mutually exclusive)
            // ----------------------------------------------------
            // If "quantity" is present:
            //  - quantity must be a positive integer
            //  - colors MUST NOT be provided simultaneously
            if (size?.quantity != null) {
              if (typeof size?.quantity !== "number") {
                errors.push(`quantity must be a number.`);
              } else if (!Number.isInteger(size?.quantity)) {
                errors.push(`quantity must be an integer.`);
              } else if (size?.quantity <= 0) {
                errors.push(`quantity must be greater than 0.`);
              }

              if (size?.colors != null) {
                errors.push(
                  `You can't define both quantity and colors at the same time.`
                );
              }
            }

            // Require at least one stock input path: either quantity OR colors
            if (size?.quantity == null && size?.colors == null) {
              errors.push(`You must define either quantity or colors.`);
            }

            if (size?.deleteColors != null) {
              errors.push(`The field 'Delete colors' is not allowed`);
            }

            // ----------------------------------------------------
            // 5) Colors-only path (no general quantity provided)
            // ----------------------------------------------------
            // When quantity is omitted but colors are provided, validate the colors array.
            // Each color must have:
            //   - color (string, unique within this size)
            //   - quantity (positive integer)
            if (size?.quantity == null && size?.colors != null) {
              if (!Array.isArray(size?.colors)) {
                errors.push(`colors must be an array.`);
              } else if (size?.colors?.length === 0) {
                errors.push(`colors array must not be empty.`);
              } else {
                const seenColorNames = []; // Track duplicate color names within this size payload
                const colorErrors = []; // Collect per-color validation errors

                size.colors.forEach((c, colorIndex) => {
                  const colorValidationErrors = [];

                  // --- color name checks ---
                  if (c?.color == null) {
                    colorValidationErrors.push(
                      `Color name is required in colors[${colorIndex}].`
                    );
                  } else if (typeof c?.color !== "string") {
                    colorValidationErrors.push(
                      `Color must be a string in colors[${colorIndex}].`
                    );
                  } else if (
                    seenColorNames.includes(c?.color?.trim()?.toLowerCase())
                  ) {
                    colorValidationErrors.push(
                      `Duplicate color "${c.color}" in colors[${colorIndex}].`
                    );
                  } else {
                    // Record this color name to catch duplicates in the same size request
                    seenColorNames.push(c?.color?.trim()?.toLowerCase());
                  }

                  // --- quantity checks for each color ---
                  if (c?.quantity == null) {
                    colorValidationErrors.push(
                      `quantity is required in colors[${colorIndex}].`
                    );
                  } else if (typeof c?.quantity !== "number") {
                    colorValidationErrors.push(
                      `quantity must be a number in colors[${colorIndex}].`
                    );
                  } else if (!Number.isInteger(c?.quantity)) {
                    colorValidationErrors.push(
                      `quantity must be an integer in colors[${colorIndex}].`
                    );
                  } else if (c?.quantity <= 0) {
                    colorValidationErrors.push(
                      `quantity must be greater than 0 in colors[${colorIndex}].`
                    );
                  }

                  // Accumulate this color's errors if any
                  if (colorValidationErrors?.length > 0) {
                    colorErrors.push({
                      colorIndex,
                      message: colorValidationErrors,
                    });
                  }
                });

                // If any color-level errors exist for this size, collect them for the global report
                if (colorErrors?.length > 0) {
                  addSizeColorsErrors.push({
                    index: i, // index of the size in addSizes
                    colors: colorErrors,
                  });
                }
              }
            }

            // If this size entry has any errors, collect them with its index
            if (errors?.length > 0) {
              addSizesErrors.push({
                index: i,
                message: errors,
              });
            }
          });

          // ------------------------------------------------
          // 6) Emit collected errors and flip updateStatus
          // ------------------------------------------------
          if (addSizesErrors?.length > 0) {
            // Size-level errors go under validationErrors.addSizes
            validationErrors.addSizes = addSizesErrors;
            updateStatus = false;
          }

          if (addSizeColorsErrors?.length > 0) {
            // Color-level errors for new sizes go under validationErrors.addSizeColors
            validationErrors.addSizeColors = addSizeColorsErrors;
            updateStatus = false;
          }
        }

        if (!updateStatus) {
          return next(new ApiError(validationErrors, 400));
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
                (size) => size.size.toLowerCase() !== s.trim().toLowerCase()
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
                (s) =>
                  s.size.toLowerCase() === size.sizeName.trim().toLowerCase()
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
        // ---------------------------------------------------------
        // ADD SIZES VALIDATION & NORMALIZATION (READ-ONLY COMMENTS)
        // ---------------------------------------------------------
        // This block validates a request payload that adds NEW sizes to a product.
        // It checks:
        //   - Size name presence, type, and uniqueness (vs product and within the same request)
        //   - Required price and optional discounted price rules
        //   - Either a general quantity OR a list of colors must be provided (but not both)
        //   - Color entries (if provided) must be valid, unique, and have positive integer quantities
        // ---------------------------------------------------------

        if (deleteSizes != null) {
          validationErrors.deleteSizesNotAllowed = `The field "delete sizes" is not allowed.`;
        }

        if (updateSizes != null) {
          validationErrors.updateSizesNotAllowed = `The field "update sizes" is not allowed.`;
        }

        if (
          addSizes != null &&
          Array.isArray(addSizes) &&
          addSizes?.length > 0
        ) {
          // Collect size-level validation errors (per size object)
          const addSizesErrors = [];
          // Collect color-level validation errors (nested under a given size)
          const addSizeColorsErrors = [];

          // Validate each size candidate in the addSizes array
          addSizes.forEach((size, i) => {
            const errors = []; // Errors specific to this "size" entry (index i)

            // -----------------------------
            // 1) Validate size name (size)
            // -----------------------------
            if (size?.size == null) {
              errors.push(`Size name is required.`);
            } else if (typeof size?.size !== "string") {
              errors.push(`Size name must be a string.`);
            } else {
              // Check if this size already exists on the product (case-insensitive)
              const sizeIsExist = product.sizes.find(
                (s) =>
                  s?.size?.trim()?.toLowerCase() ===
                  size?.size?.trim()?.toLowerCase()
              );

              if (sizeIsExist) {
                errors.push(
                  `Size "${size.size}" already exists in the product.`
                );
              }
            }

            // -----------------------------
            // 2) Validate required price
            // -----------------------------
            if (size?.price == null) {
              errors.push(`Price is required.`);
            } else if (typeof size?.price !== "number") {
              errors.push(`Price must be a number.`);
            } else if (size?.price <= 0) {
              errors.push(`Price must be greater than 0.`);
            }

            // ---------------------------------------------------
            // 3) Validate optional priceAfterDiscount (if given)
            // ---------------------------------------------------
            // Must be a number > 0, and cannot exceed the base price.
            if (size?.priceAfterDiscount != null) {
              if (typeof size?.priceAfterDiscount !== "number") {
                errors.push(`priceAfterDiscount must be a number.`);
              } else if (size?.priceAfterDiscount <= 0) {
                errors.push(`priceAfterDiscount must be greater than 0.`);
              } else if (
                size?.price != null &&
                size?.priceAfterDiscount > size?.price
              ) {
                errors.push(
                  `priceAfterDiscount must be less than or equal to price.`
                );
              }
            }

            if (size?.deletePriceAfterDiscount != null) {
              errors.push(
                `The field 'Delete price after discount' is not allowed`
              );
            }

            // ----------------------------------------------------
            // 4) Validate quantity vs colors (mutually exclusive)
            // ----------------------------------------------------
            // If "quantity" is present:
            //  - quantity must be a positive integer
            //  - colors MUST NOT be provided simultaneously
            if (size?.quantity != null) {
              if (typeof size?.quantity !== "number") {
                errors.push(`quantity must be a number.`);
              } else if (!Number.isInteger(size?.quantity)) {
                errors.push(`quantity must be an integer.`);
              } else if (size?.quantity <= 0) {
                errors.push(`quantity must be greater than 0.`);
              }

              if (size?.colors != null) {
                errors.push(
                  `You can't define both quantity and colors at the same time.`
                );
              }
            }

            // Require at least one stock input path: either quantity OR colors
            if (size?.quantity == null && size?.colors == null) {
              errors.push(`You must define either quantity or colors.`);
            }

            if (size?.deleteColors != null) {
              errors.push(`The field 'Delete colors' is not allowed`);
            }

            // ----------------------------------------------------
            // 5) Colors-only path (no general quantity provided)
            // ----------------------------------------------------
            // When quantity is omitted but colors are provided, validate the colors array.
            // Each color must have:
            //   - color (string, unique within this size)
            //   - quantity (positive integer)
            if (size?.quantity == null && size?.colors != null) {
              if (!Array.isArray(size?.colors)) {
                errors.push(`colors must be an array.`);
              } else if (size?.colors?.length === 0) {
                errors.push(`colors array must not be empty.`);
              } else {
                const seenColorNames = []; // Track duplicate color names within this size payload
                const colorErrors = []; // Collect per-color validation errors

                size.colors.forEach((c, colorIndex) => {
                  const colorValidationErrors = [];

                  // --- color name checks ---
                  if (c?.color == null) {
                    colorValidationErrors.push(
                      `Color name is required in colors[${colorIndex}].`
                    );
                  } else if (typeof c?.color !== "string") {
                    colorValidationErrors.push(
                      `Color must be a string in colors[${colorIndex}].`
                    );
                  } else if (
                    seenColorNames.includes(c?.color?.trim()?.toLowerCase())
                  ) {
                    colorValidationErrors.push(
                      `Duplicate color "${c.color}" in colors[${colorIndex}].`
                    );
                  } else {
                    // Record this color name to catch duplicates in the same size request
                    seenColorNames.push(c?.color?.trim()?.toLowerCase());
                  }

                  // --- quantity checks for each color ---
                  if (c?.quantity == null) {
                    colorValidationErrors.push(
                      `quantity is required in colors[${colorIndex}].`
                    );
                  } else if (typeof c?.quantity !== "number") {
                    colorValidationErrors.push(
                      `quantity must be a number in colors[${colorIndex}].`
                    );
                  } else if (!Number.isInteger(c?.quantity)) {
                    colorValidationErrors.push(
                      `quantity must be an integer in colors[${colorIndex}].`
                    );
                  } else if (c?.quantity <= 0) {
                    colorValidationErrors.push(
                      `quantity must be greater than 0 in colors[${colorIndex}].`
                    );
                  }

                  // Accumulate this color's errors if any
                  if (colorValidationErrors?.length > 0) {
                    colorErrors.push({
                      colorIndex,
                      message: colorValidationErrors,
                    });
                  }
                });

                // If any color-level errors exist for this size, collect them for the global report
                if (colorErrors?.length > 0) {
                  addSizeColorsErrors.push({
                    index: i, // index of the size in addSizes
                    colors: colorErrors,
                  });
                }
              }
            }

            // If this size entry has any errors, collect them with its index
            if (errors?.length > 0) {
              addSizesErrors.push({
                index: i,
                message: errors,
              });
            }
          });

          // ------------------------------------------------
          // 6) Emit collected errors and flip updateStatus
          // ------------------------------------------------
          if (addSizesErrors?.length > 0) {
            // Size-level errors go under validationErrors.addSizes
            validationErrors.addSizes = addSizesErrors;
            updateStatus = false;
          }

          if (addSizeColorsErrors?.length > 0) {
            // Color-level errors for new sizes go under validationErrors.addSizeColors
            validationErrors.addSizeColors = addSizeColorsErrors;
            updateStatus = false;
          }
        }

        if (!updateStatus) {
          return next(new ApiError(validationErrors, 400));
        }

        if (updateStatus) {
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
      }
    } else {
      // فيحالة مش متغطية افرض راح يحذف السعر بعد الخصم و المنتج ملوش سعر بعد الخصم
      // لو هوا باعت عاوز  يحدث الوان و هوا المنتج ملوش الوان
      // eslint-disable-next-line no-inner-declarations
      function isAllowedNumber(val) {
        // يقبل رقم صحيح أو عشري
        const numericRegex = /^-?\d+(\.\d+)?$/;

        if (typeof val === "number") {
          return Number.isFinite(val); // يقبل رقم صالح بس
        }

        if (typeof val === "string") {
          return numericRegex.test(val.trim()); // يقبل سترينج أرقام بس
        }

        return false; // بيرفض أي نوع تاني (object, array, boolean...)
      }

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

      let updateStatus = true;
      const validationErrors = {};
      // eslint-disable-next-line no-lonely-if
      if (!product.sizesIsExist) {
        if (price != null) {
          const errors = [];
          if (!isAllowedNumber(price)) {
            errors.push(`Price must be a number.`);
          } else if (+price <= 0) {
            errors.push(
              `Size price must be a positive number greater than 0.`
            );
          } else {
            // Must be different from the current original price
            if (+price === product?.price) {
              errors.push(
                `The new price must be different from the old price.`
              );
            }

            // If not also setting a new discounted price, then price must be strictly greater than existing discounted price
            if (
              priceAfterDiscount == null &&
              +price <= product?.priceAfterDiscount
            ) {
              errors.push(
                `The price must not be less than or equal to its existing discounted price.`
              );
            }
          }

          if (errors?.length > 0) {
            validationErrors.price = errors;
            updateStatus = false;
          }
        } // Done

        const deletePriceAfterDiscountValidation =
          deletePriceAfterDiscount?.trim()?.toLowerCase() === "true"
            ? true
            : deletePriceAfterDiscount?.trim()?.toLowerCase() === "false"
              ? false
              : null;
        if (
          deletePriceAfterDiscount != null &&
          deletePriceAfterDiscountValidation == null
        ) {
          validationErrors.deletePriceAfterDiscount = [
            `"Delete price after discount" must be a boolean (true or false).`,
          ];
          updateStatus = false;
        } // Done

        if (priceAfterDiscount != null) {
          const errors = [];

          if (deletePriceAfterDiscountValidation) {
            errors.push(
              `Cannot update and delete price after discount simultaneously.`
            );
          }

          if (!isAllowedNumber(priceAfterDiscount)) {
            errors.push(`Discounted price must be a number.`);
          } else if (+priceAfterDiscount <= 0) {
            errors.push(
              `price after discount must be a positive number greater than 0.`
            );
          } else {
            // Must be different from current discounted price if one exists
            if (
              product?.priceAfterDiscount != null &&
              +priceAfterDiscount === product?.priceAfterDiscount
            ) {
              errors.push(
                `The new discounted price must be different from the old discounted price.`
              );
            }

            // If not also setting a new base price, ensure discounted price < existing original price
            if (price == null && +priceAfterDiscount > product?.price) {
              errors.push(
                `Discounted price must be less than the original price (${product?.price}).`
              );
            }
          }

          if (errors?.length > 0) {
            validationErrors.priceAfterDiscount = errors;
            updateStatus = false;
          }
        } // Done

        if (
          price != null &&
          priceAfterDiscount != null &&
          priceAfterDiscount > price
        ) {
          validationErrors.priceAndDiscountedPrice = `Discounted price must be less than the original price.`;
          updateStatus = false;
        } // Done

        if (
          deleteGeneralColors != null &&
          Array.isArray(deleteGeneralColors) &&
          deleteGeneralColors?.length > 0
        ) {
          if (product.colors.length === 0) {
            validationErrors.deleteGeneralColors = [
              "You cannot delete colors because this product has no colors.",
            ];
            updateStatus = false;
          } else {
            const seenDeleteColors = []; // Tracks duplicates within this deleteColors array
            const deleteColorErrors = []; // Errors tied to individual delete color entries

            deleteGeneralColors.forEach((c, i) => {
              const colorValidationErrors = [];
              const lowerC =
                typeof c === "string" ? c?.trim()?.toLowerCase() : null;

              // Type/emptiness validation
              if (typeof lowerC !== "string") {
                colorValidationErrors.push(
                  `Color at index ${i + 1} in the deleted colors list must be a string.`
                );
              } else if (lowerC === "") {
                colorValidationErrors.push(
                  `Color at index ${i + 1} in the deleted colors list cannot be empty.`
                );
              } else {
                // Ensure the color exists in the original size before deletion
                const existsInOriginal = product.colors.some(
                  (color) => color?.color?.trim()?.toLowerCase() === lowerC
                );

                if (!existsInOriginal) {
                  colorValidationErrors.push(
                    `Cannot delete color "${c}" at index ${i + 1} because it does not exist in the original color list.`
                  );
                }

                // Duplicate delete check
                if (seenDeleteColors.includes(lowerC)) {
                  colorValidationErrors.push(
                    `Duplicate color "${c}" found in delete colors list at index ${i + 1}. Each color must be unique.`
                  );
                }

                // Mark as seen to catch duplicates
                seenDeleteColors.push(lowerC);

                // Normalize the deleteColors array by replacing the original value with the lowercase version
                deleteGeneralColors[i] = lowerC;
              }

              // Record any errors for this color entry
              if (colorValidationErrors?.length > 0) {
                deleteColorErrors.push({
                  colorIndex: i,
                  message: colorValidationErrors,
                });
              }
            });

            // If any color deletion errors exist, attach them under validationErrors.updateSizesDeleteColors
            if (deleteColorErrors?.length > 0) {
              if (!validationErrors?.deleteGeneralColors) {
                validationErrors.deleteGeneralColors = [];
              }
              validationErrors.deleteGeneralColors = deleteColorErrors;
              updateStatus = false;
            }
          }
        } // Done

        if (colors != null && Array.isArray(colors) && colors?.length > 0) {
          const seenOldColorNames = []; // Track duplicates among provided colorName values
          const seenNewColorNames = []; // Track duplicates among provided newColorName values
          const colorErrors = []; // Collects per-color validation errors for this size

          colors.forEach((color, colorIndex) => {
            const colorValidationErrors = [];

            // --- (a) type validation ---
            if (color?.type == null) {
              colorValidationErrors.push(
                `Color update type is required at color index ${colorIndex + 1}. Please specify either "update" or "new".`
              );
            } else if (typeof color?.type !== "string") {
              colorValidationErrors.push(
                `Color type at color index ${colorIndex + 1} must be a string.`
              );
            } else if (
              color?.type?.trim()?.toLowerCase() !== "new" &&
              color?.type?.trim()?.toLowerCase() !== "update"
            ) {
              colorValidationErrors.push(
                `Invalid color update type "${color.type}" at color index ${colorIndex + 1}. Expected "new" or "update".`
              );
            }

            // --- (b) colorName validation ---
            if (color?.colorName == null) {
              colorValidationErrors.push(
                `Missing color name at color index ${colorIndex + 1}.`
              );
            } else if (typeof color?.colorName !== "string") {
              colorValidationErrors.push(
                `Color name at color index ${colorIndex + 1} must be a string.`
              );
            } else {
              // If renaming, newColorName must differ from colorName
              if (
                color?.newColorName != null &&
                typeof color?.newColorName === "string" &&
                color?.colorName?.trim()?.toLowerCase() ===
                  color?.newColorName?.trim()?.toLowerCase()
              ) {
                colorValidationErrors.push(
                  `New color name must be different from the old color name at color index ${colorIndex + 1}.`
                );
              }

              // Prevent duplicate colorName entries within the same size update
              if (
                seenOldColorNames.includes(
                  color?.colorName?.trim()?.toLowerCase()
                )
              ) {
                colorValidationErrors.push(
                  `Duplicate color name "${color.colorName}" found at color index ${colorIndex + 1}.`
                );
              }
            }

            // --- (c) newColorName duplicates/conflicts ---
            if (color?.newColorName != null) {
              // Prevent duplicate new names in the same size update
              if(typeof color?.newColorName !== "string") {
                colorValidationErrors.push(
                  `New color name at color index ${colorIndex + 1} must be a string.`
                );
              } else {
                if (
                  seenNewColorNames.includes(
                    color?.newColorName?.trim()?.toLowerCase()
                  )
                ) {
                  colorValidationErrors.push(
                    `Duplicate new color name "${color.newColorName}" found at color index ${colorIndex + 1}.`
                  );
                }
                // Prevent renaming to a name that already exists in the same request (old list)
                if (
                  seenOldColorNames.includes(
                    color?.newColorName?.trim()?.toLowerCase()
                  )
                ) {
                  colorValidationErrors.push(
                    `The new color name "${color.newColorName}" is duplicated in the update list. Please make sure each new color name is unique.`
                  );
                }
              }
            }

            // --- (d) quantity validation (if provided) ---
            // Must be a positive integer. Note: the error message says "cannot be negative" but
            // the check forbids zero as well (<= 0). This is intentional in logic.
            let quantityErrorsStatus = false;
            if (color?.colorQuantity != null) {
              if (!isAllowedNumber(color?.colorQuantity)) {
                colorValidationErrors.push(
                  `Color quantity at color index ${colorIndex + 1} must be a number.`
                );
                quantityErrorsStatus = true;
              } else if (Number(color?.colorQuantity) <= 0) {
                colorValidationErrors.push(
                  `Color quantity at color index ${colorIndex + 1} cannot be negative.`
                );
                quantityErrorsStatus = true;
              } else if (!Number.isInteger(Number(color?.colorQuantity))) {
                colorValidationErrors.push(
                  `Color quantity at color index ${colorIndex + 1} must be an integer.`
                );
                quantityErrorsStatus = true;
              }
            }

            // --- (e) Behavior by type: "new" vs "update" ---
            if (
              color?.type != null &&
              typeof color?.type === "string" &&
              (color?.type?.trim()?.toLowerCase() === "new" ||
                color?.type?.trim()?.toLowerCase() === "update")
            ) {
              // ------ TYPE: "new" ------
              if (color?.type?.trim()?.toLowerCase() === "new") {
                // Cannot add a color that is also listed in deleteColors
                if (
                  color?.colorName != null &&
                  typeof color?.colorName === "string"
                ) {
                  const newColorNameIsExist = product.colors.find(
                    (c) =>
                      c.color.toLowerCase() ===
                      color.colorName?.trim()?.toLowerCase()
                  );
                  if (newColorNameIsExist) {
                    colorValidationErrors.push(
                      `The color name "${color.colorName}" already exists.`
                    );
                  }
                }

                // New colors must include a quantity
                if (color?.colorQuantity == null) {
                  colorValidationErrors.push(
                    `Please specify the quantity for the new color "${color.colorName}".`
                  );
                }

                // newColorName is not applicable for "new" type
                if (color?.newColorName != null) {
                  colorValidationErrors.push(
                    `For new colors, use "Color Name" only.`
                  );
                }
              }

              // ------ TYPE: "update" ------
              if (color?.type?.trim()?.toLowerCase() === "update") {
                if (
                  color.colorName != null &&
                  typeof color.colorName === "string"
                ) {
                  // Cannot update a color that is scheduled for deletion
                  if (
                    deleteGeneralColors != null &&
                    Array.isArray(deleteGeneralColors) &&
                    deleteGeneralColors?.length > 0 &&
                    deleteGeneralColors?.includes(
                      color.colorName?.trim()?.toLowerCase()
                    )
                  ) {
                    colorValidationErrors.push(
                      `Color "${color.colorName}" cannot be updated because it is scheduled for deletion.`
                    );
                  }

                  // The color being updated must exist on the original size
                  const existingColor = product.colors.find(
                    (c) =>
                      c.color.toLowerCase() ===
                      color?.colorName?.trim()?.toLowerCase()
                  );
                  if (!existingColor) {
                    colorValidationErrors.push(
                      `The original color "${color.colorName}" does not exist.`
                    );
                  } else {

                    if (color?.colorQuantity === existingColor?.quantity) {
                      colorValidationErrors.push(
                        `The new quantity for color "${color.colorName}" cannot be the same as the old quantity (${existingColor.quantity}).`
                      );
                    }

                    // Require an actual change: either quantity differs (and is valid), or the name actually changes
                    let isSameQuantity =
                      color?.colorQuantity == null ||
                      quantityErrorsStatus ||
                      color?.colorQuantity === existingColor?.quantity;

                    const isSameName =
                      color?.newColorName == null ||
                      typeof color?.newColorName !== "string" ||
                      color?.newColorName?.trim()?.toLowerCase() ===
                        color?.colorName?.trim()?.toLowerCase();

                    if (isSameQuantity && isSameName) {
                      colorValidationErrors.push(
                        `No update provided for the color "${color.colorName}".`
                      );
                    }
                  }
                }

                // If provided, newColorName must be a string and must not conflict with deletions or existing colors
                if (color?.newColorName != null && typeof color?.newColorName === "string") {
                  // Cannot rename to a color that already exists on the original size
                  const newColorNameIsExist = product.colors.find(
                    (c) =>
                      c.color.toLowerCase() ===
                      color?.newColorName?.trim()?.toLowerCase()
                  );
                  if (newColorNameIsExist) {
                    colorValidationErrors.push(
                      `The new color name "${color.newColorName}" already exists.`
                    );
                  }
                }
              }
            }

            // Record seen names (for duplicate detection inside this size update)
            if (color?.colorName != null && typeof color?.colorName === "string")
              seenOldColorNames.push(color?.colorName?.trim()?.toLowerCase());
            if (color?.newColorName != null && typeof color?.newColorName === "string")
              seenNewColorNames.push(
                color?.newColorName?.trim()?.toLowerCase()
              );

            // Push accumulated errors for this color entry, if any
            if (colorValidationErrors?.length > 0) {
              colorErrors.push({
                colorIndex,
                message: colorValidationErrors,
              });
            }
          });

          // If any color errors exist for this size, attach to updateSizeColorsErrors
          if (colorErrors?.length > 0) {
            validationErrors.updateGeneralColors = colorErrors;
            updateStatus = false;
          }
        } // Done

        // Determine if all original colors are being deleted in this request
        const allOriginalColorsDeleted =
          Array.isArray(product?.colors) &&
          product?.colors?.length > 0 && // requires there to be original colors
          Array.isArray(deleteGeneralColors) &&
          deleteGeneralColors?.length === product?.colors?.length &&
          product.colors.every((oc) =>
            deleteGeneralColors.some(
              (dc) =>
                dc?.trim()?.toLowerCase() === oc?.color?.trim()?.toLowerCase()
            )
          );

        // Determine if there are any new or updated colors in this request
        const hasNewOrUpdatedColors =
          Array.isArray(colors) &&
          colors.some((c) => {
            if (typeof c?.type === "string") {
              return (
                c?.type?.trim()?.toLowerCase() === "new" ||
                c?.type?.trim()?.toLowerCase() === "update"
              );
            }
            return false;
          });

        const quantityErrors = [];

        // Done
        if (quantity != null) {
          if (!isAllowedNumber(quantity)) {
            quantityErrors.push(
              `The quantity must be a number.`
            );
          } else if (!Number.isInteger(+quantity)) {
            quantityErrors.push(`quantity must be an integer.`);
          } else if (+quantity <= 0) {
            quantityErrors.push(`quantity must be greater than 0.`);
          } // Done

          const hasOriginalColors = product?.colors?.length > 0;

          // Cannot set sizeQuantity in the same request that adds/updates colors
          if (hasNewOrUpdatedColors) {
            quantityErrors.push(
              `Cannot add or update quantity while adding or updating colors.`
            );
          } // Done

          // Case 1: size currently has original colors -> must delete them all first
          if (hasOriginalColors && !allOriginalColorsDeleted) {
            quantityErrors.push(
              `Cannot add or update quantity because the product still has existing colors. Please delete them first.`
            );
          } // Done

          // delete this
          // // Case 2: size has no original colors -> cannot request color deletions
          // if (!hasOriginalColors) {
          //   if (
          //     Array.isArray(deleteGeneralColors) &&
          //     deleteGeneralColors?.length > 0
          //   ) {
          //     quantityErrors.push(
          //       `Cannot delete colors because it has no original colors.`
          //     );
          //   }
          // }
        } else if (allOriginalColorsDeleted && !hasNewOrUpdatedColors) {
          // If you are deleting all original colors and not adding/updating new ones,
          // you must provide a general sizeQuantity (otherwise the size becomes stockless).
          quantityErrors.push(
            `If you want to delete all colors, you must also provide a general quantity for the size.`
          );
        } // Done

        if (quantityErrors?.length > 0) {
          validationErrors.quantity = quantityErrors;
          updateStatus = false;
        }

        // if (!updateStatus) {
        //   return next(new ApiError(validationErrors, 400));
        // }

        if (!updateStatus) {
          return next(new ApiError("Validation failed", 400, validationErrors));
        }

        if (updateStatus) {
          if (price != null) {
            product.price = +price;
          }

          if (priceAfterDiscount != null) {
            product.priceAfterDiscount = +priceAfterDiscount;
          }

          if (deletePriceAfterDiscountValidation) {
            product.priceAfterDiscount = undefined;
          }

          if (quantity != null) {
            product.quantity = +quantity;
          }

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
                  (deleted) =>
                    deleted.toLowerCase() === color.color.toLowerCase()
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
                  quantity: Number(color.colorQuantity),
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
                      c.quantity = Number(color.colorQuantity);
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
                  if (
                    item.product._id.equals(product._id) &&
                    item.size == null
                  ) {
                    if (
                      item.color != null &&
                      Array.isArray(product.colors) &&
                      product.colors.length > 0
                    ) {
                      const colorIsExist = product.colors.find(
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
        }
      } else {
        const priceErrors = [];
        if (price == null) {
          priceErrors.push(`Price is required.`);
        } else if (typeof price !== "number") {
          priceErrors.push(`Price must be a number.`);
        } else if (price <= 0) {
          priceErrors.push(`Price must be greater than 0.`);
        }

        if (priceErrors?.length > 0) {
          validationErrors.price = priceErrors;
          updateStatus = false;
        }

        if (priceAfterDiscount != null) {
          const errors = [];
          if (typeof priceAfterDiscount !== "number") {
            errors.push(`priceAfterDiscount must be a number.`);
          } else if (priceAfterDiscount <= 0) {
            errors.push(`priceAfterDiscount must be greater than 0.`);
          } else if (price != null && priceAfterDiscount > price) {
            errors.push(
              `priceAfterDiscount must be less than or equal to price.`
            );
          }

          if (errors?.length > 0) {
            validationErrors.priceAfterDiscount = errors;
            updateStatus = false;
          }
        }

        if (deletePriceAfterDiscount != null) {
          validationErrors.deletePriceAfterDiscountNotAllowed = `The field 'Delete price after discount' is not allowed`;
          updateStatus = false;
        }

        if (quantity != null) {
          const errors = [];
          if (typeof quantity !== "number") {
            errors.push(`quantity must be a number.`);
          } else if (!Number.isInteger(quantity)) {
            errors.push(`quantity must be an integer.`);
          } else if (quantity <= 0) {
            errors.push(`quantity must be greater than 0.`);
          }

          if (colors != null) {
            errors.push(
              `You can't define both quantity and colors at the same time.`
            );
          }

          if (errors?.length > 0) {
            validationErrors.quantity = errors;
            updateStatus = false;
          }
        }

        if (quantity == null && colors == null) {
          validationErrors.general = `You must define either quantity or colors.`;
          updateStatus = false;
        }

        if (deleteGeneralColors != null) {
          validationErrors.deleteGeneralColorsNotAllowed = `The field 'Delete general colors' is not allowed`;
          updateStatus = false;
        }

        if (quantity == null && colors != null) {
          if (!Array.isArray(colors)) {
            validationErrors.GeneralErrorsForAddColors = `colors must be an array.`;
            updateStatus = false;
          } else if (colors?.length === 0) {
            validationErrors.GeneralErrorsForAddColors = ` colors array must not be empty.`;
            updateStatus = false;
            updateStatus = false;
          } else {
            const seenColorNames = []; // Track duplicate color names within this size payload
            const colorErrors = []; // Collect per-color validation errors

            colors.forEach((c, colorIndex) => {
              const colorValidationErrors = [];

              // --- color name checks ---
              if (c?.color == null) {
                colorValidationErrors.push(
                  `Color name is required in colors[${colorIndex}].`
                );
              } else if (typeof c?.color !== "string") {
                colorValidationErrors.push(
                  `Color must be a string in colors[${colorIndex}].`
                );
              } else if (
                seenColorNames.includes(c?.color?.trim()?.toLowerCase())
              ) {
                colorValidationErrors.push(
                  `Duplicate color "${c.color}" in colors[${colorIndex}].`
                );
              } else {
                // Record this color name to catch duplicates in the same size request
                seenColorNames.push(c?.color?.trim()?.toLowerCase());
              }

              // --- quantity checks for each color ---
              if (c?.quantity == null) {
                colorValidationErrors.push(
                  `quantity is required in colors[${colorIndex}].`
                );
              } else if (typeof c?.quantity !== "number") {
                colorValidationErrors.push(
                  `quantity must be a number in colors[${colorIndex}].`
                );
              } else if (!Number.isInteger(c?.quantity)) {
                colorValidationErrors.push(
                  `quantity must be an integer in colors[${colorIndex}].`
                );
              } else if (c?.quantity <= 0) {
                colorValidationErrors.push(
                  `quantity must be greater than 0 in colors[${colorIndex}].`
                );
              }

              // Accumulate this color's errors if any
              if (colorValidationErrors?.length > 0) {
                colorErrors.push({
                  colorIndex,
                  message: colorValidationErrors,
                });
              }
            });

            // If any color-level errors exist for this size, collect them for the global report
            if (colorErrors?.length > 0) {
              validationErrors.addColors = colorErrors;
              updateStatus = false;
            }
          }
        }

        if (!updateStatus) {
          return next(new ApiError(validationErrors, 400));
        }

        if (updateStatus) {
          product.sizes = [];
          product.price = price;
          if (priceAfterDiscount != null)
            product.priceAfterDiscount = priceAfterDiscount;
          if (quantity != null) product.quantity = quantity;
          if (colors != null && Array.isArray(colors) && colors.length > 0) {
            colors.forEach((c) => {
              product.colors.push({
                color: c.color,
                quantity: c.quantity,
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
                  if (
                    item.product._id.equals(product._id) &&
                    item.size == null
                  ) {
                    if (
                      item.color != null &&
                      Array.isArray(product.colors) &&
                      product.colors.length > 0
                    ) {
                      const colorIsExist = product.colors.find(
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
