///////////////////////////////////////

const seenNewSizeNames = [];
if (
  updateSizes != null &&
  Array.isArray(updateSizes) &&
  updateSizes.length > 0
) {
  const seenSizeNames = [];

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

    if (
      deleteSizes != null &&
      Array.isArray(deleteSizes) &&
      deleteSizes.length > 0
    ) {
      const shouldDeleteThisSize = deleteSizes.some(
        (s) => s.toLowerCase() === normalizedName
      );

      if (shouldDeleteThisSize) {
        return next(
          new ApiError(
            `Size "${size.sizeName}" is marked for deletion and cannot be modified.`,
            400
          )
        );
      }
    }

    if (size.newSizeName) {
      if (size.sizeName.toLowerCase() === size.newSizeName?.toLowerCase()) {
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
      next(new ApiError(`Price for "${size.sizeName}" must be a number.`, 400));
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

    if (
      size.deleteColors != null &&
      Array.isArray(size.deleteColors) &&
      size.deleteColors.length > 0
    ) {
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

    if (
      size.sizeColors != null &&
      Array.isArray(size.sizeColors) &&
      size.sizeColors.length > 0
    ) {
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
            color.newColorName.toLowerCase() === color.colorName.toLowerCase();

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
              (c) => c.color.toLowerCase() === color.newColorName.toLowerCase()
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
      size.sizeColors.some((c) => c.type === "new" || c.type === "update");

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
        if (Array.isArray(size.deleteColors) && size.deleteColors.length > 0) {
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
    if (size.newSizeName != null) {
      seenNewSizeNames.push(size.newSizeName.toLowerCase());
    }
    return false;
  });

  if (hasValidationErrors) updateStatus = false;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// wait
if (
  size.sizeColors != null &&
  Array.isArray(size.sizeColors) &&
  size.sizeColors.length > 0
) {
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

    if (color.colorQuantity != null && !Number.isInteger(color.colorQuantity)) {
      next(
        new ApiError(
          `Color quantity for size "${size.sizeName}" at color index ${colorIndex} must be a whole number (no decimals).`,
          400
        )
      );
      return true;
    }

    if (color.type === "new") {
      if (size.deleteColors && size.deleteColors.includes(color.colorName)) {
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
      if (size.deleteColors && size.deleteColors.includes(color.colorName)) {
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
        color.newColorName.toLowerCase() === color.colorName.toLowerCase();

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
          (c) => c.color.toLowerCase() === color.newColorName.toLowerCase()
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Done
if (
  size.deleteColors != null &&
  Array.isArray(size.deleteColors) &&
  size.deleteColors.length > 0
) {
  const seenDeleteColors = [];

  size.deleteColors.forEach((c, i) => {
    const lowerC = c?.toLowerCase();
    if (typeof lowerC !== "string") {
      errors.push(
        `❌ Color at index ${i + 1} in the deleted colors list must be a string.`
      );
    } else if (lowerC === "") {
      errors.push(
        `❌ Color at index ${i + 1} in the deleted colors list cannot be empty.`
      );
    } else {
      if (
        size.sizeName != null &&
        typeof size.sizeName === "string" &&
        original != null
      ) {
        // ❌ رجع Error فوري لو اللون غير موجود في الأصل
        const existsInOriginal = original.colors.some(
          (color) => color.color.toLowerCase() === lowerC
        );

        if (!existsInOriginal) {
          errors.push(
            `❌ Cannot delete color "${c}" at index ${i + 1} in size "${size.sizeName}" because it does not exist in the original color list.`
          );
        }
      }

      // ❌ رجع Error لو فيه تكرار
      if (seenDeleteColors.includes(lowerC)) {
        errors.push(
          `❌ Duplicate color "${c}" found in delete colors list for size "${size.sizeName}" at index ${i}. Each color must be unique.`
        );
      }

      seenDeleteColors.push(lowerC);
    }
  });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ---- GLOBAL FLAGS ----
let allOriginalColorsDeleted = false;
let hasNewOrUpdatedColors = false;

// ---- HELPERS ----
// Helper: parse number
function isAllowedNumber(val) {
  const numericRegex = /^-?\d+(\.\d+)?$/;
  if (typeof val === "number") return Number.isFinite(val);
  if (typeof val === "string") return numericRegex.test(val.trim());
  return false;
}

// Helper: parse boolean string
function parseBoolean(str) {
  if (typeof str !== "string") return null;
  const val = str.trim().toLowerCase();
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === true) return true;
  if (val === false) return false;
  return null;
}

// Helper: push error (always array)
function addError(obj, key, message) {
  if (!obj[key]) obj[key] = [];
  obj[key].push(message);
}

// ---- VALIDATION FUNCTIONS ----
// Price validation
function validatePrice({ price, priceAfterDiscount, product }) {
  const errors = [];

  if (!isAllowedNumber(price)) {
    errors.push(`Price must be a number.`);
  } else if (+price <= 0) {
    errors.push(`❌ Size price must be a positive number greater than 0.`);
  } else {
    // Must be different from the current original price
    if (+price === product?.price) {
      errors.push(`The new price must be different from the old price.`);
    }

    // If not also setting a new discounted price, then price must be strictly greater than existing discounted price
    if (priceAfterDiscount == null && +price <= product?.priceAfterDiscount) {
      errors.push(
        `❌ The price must not be less than or equal to its existing discounted price.`
      );
    }
  }

  return errors; // ممكن يرجع مصفوفة فارغة لو مفيش errors
}

// Delete price after discount validation
function validateDeletePriceAfterDiscount(deletePriceAfterDiscount) {
  const parsed = parseBoolean(deletePriceAfterDiscount);
  if (deletePriceAfterDiscount != null && parsed == null) {
    return {
      parsed,
      errors: [
        `"Delete price after discount" must be a boolean (true or false).`,
      ],
    };
  }
  return { parsed, errors: [] };
}

// Price after discount validation
function validatePriceAfterDiscount({ 
  priceAfterDiscount, 
  price, 
  product, 
  deletePriceAfterDiscountValidation 
}) {
  const errors = [];

  if (deletePriceAfterDiscountValidation) {
    errors.push(
      `Cannot update and delete price after discount simultaneously.`
    );
  }

  if (!isAllowedNumber(priceAfterDiscount)) {
    errors.push(`Discounted price must be a number.`);
  } else if (+priceAfterDiscount <= 0) {
    errors.push(`❌ price after discount must be a positive number greater than 0.`);
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

  return errors;
}

// Price and price after discount relation validation
function validatePriceAndDiscountRelation(price, priceAfterDiscount) {
  // لو واحد منهم مش موجود => ما نطبقش الشرط
  if (price == null || priceAfterDiscount == null) return [];

  // لو واحد منهم مش رقم صالح => ما نطبقش الشرط
  if (!isAllowedNumber(price) || !isAllowedNumber(priceAfterDiscount)) return [];

  // لو واحد منهم <= 0 => ما نطبقش الشرط
  if (+price <= 0 || +priceAfterDiscount <= 0) return [];

  // لو كل الشروط فوق متحققة نطبق المقارنة كما هي
  if (+priceAfterDiscount > +price) {
    return ["Discounted price must be less than the original price."];
  }

  return [];
}

// Delete general colors validation
function validateDeleteGeneralColors(deleteGeneralColors, product) {
  const errors = [];

  if (deleteGeneralColors == null) {
    return errors; // no errors, skip
  }

  if (!Array.isArray(deleteGeneralColors)) {
    errors.push(`"Delete general color" field must be an array.`);
    return errors;
  }

  if (deleteGeneralColors.length === 0) {
    errors.push(`"Delete general color" array cannot be empty.`); // Add message here
    return errors;
  }

  if (product.colors.length === 0) {
    errors.push("You cannot delete colors because this product has no colors.");
    return errors;
  }

  const seenDeleteColors = [];
  const deleteColorErrors = [];

  deleteGeneralColors.forEach((c, i) => {
    const colorValidationErrors = [];
    const lowerC = typeof c === "string" ? c?.trim()?.toLowerCase() : null;

    // Type/emptiness validation
    if (typeof lowerC !== "string") {
      colorValidationErrors.push(
        `❌ Color at index ${i + 1} in the deleted colors list must be a string.`
      );
    } else if (lowerC === "") {
      colorValidationErrors.push(
        `❌ Color at index ${i + 1} in the deleted colors list cannot be empty.`
      );
    } else {
      // Ensure the color exists in the original size before deletion
      const existsInOriginal = product.colors.some(
        (color) => color?.color?.trim()?.toLowerCase() === lowerC
      );

      if (!existsInOriginal) {
        colorValidationErrors.push(
          `❌ Cannot delete color "${c}" at index ${i + 1} because it does not exist in the original color list.`
        );
      }

      // Duplicate delete check
      if (seenDeleteColors.includes(lowerC)) {
        colorValidationErrors.push(
          `❌ Duplicate color "${c}" found in delete colors list at index ${i + 1}. Each color must be unique.`
        );
      }

      // Mark as seen to catch duplicates
      seenDeleteColors.push(lowerC);

      // Normalize array inplace
      deleteGeneralColors[i] = lowerC;
    }

    if (colorValidationErrors.length > 0) {
      deleteColorErrors.push({
        colorIndex: i,
        message: colorValidationErrors,
      });
    }
  });

  if (deleteColorErrors.length > 0) {
    errors.push(...deleteColorErrors);
  }

  return errors;
}

// Colors validation
function validateColors(colors, product, deleteGeneralColors) {
  const errors = [];

  if (colors == null) return errors;
  if (!Array.isArray(colors)) {
    errors.push(`"Colors" field must be an array.`);
    return errors;
  }
  if (colors.length === 0) {
    errors.push(`"Colors" array cannot be empty.`);
    return errors;
  }

  const seenOldColorNames = [];
  const seenNewColorNames = [];
  const colorErrors = [];

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

      // Prevent duplicate colorName entries
      if (
        seenOldColorNames.includes(color?.colorName?.trim()?.toLowerCase())
      ) {
        colorValidationErrors.push(
          `Duplicate color name "${color.colorName}" found at color index ${colorIndex + 1}.`
        );
      }
    }

    // --- (c) newColorName duplicates/conflicts ---
    if (color?.newColorName != null) {
      if (typeof color?.newColorName !== "string") {
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
        if (
          seenOldColorNames.includes(
            color?.newColorName?.trim()?.toLowerCase()
          )
        ) {
          colorValidationErrors.push(
            `The new color name "${color.newColorName}" is duplicated in the update list.`
          );
        }
      }
    }

    // --- (d) quantity validation ---
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

    // --- (e) Behavior by type ---
    if (
      color?.type != null &&
      typeof color?.type === "string" &&
      (color?.type?.trim()?.toLowerCase() === "new" ||
        color?.type?.trim()?.toLowerCase() === "update")
    ) {
      if (color?.type?.trim()?.toLowerCase() === "new") {
        // New color cannot already exist
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
        if (color?.colorQuantity == null) {
          colorValidationErrors.push(
            `Please specify the quantity for the new color "${color.colorName}".`
          );
        }
        if (color?.newColorName != null) {
          colorValidationErrors.push(`For new colors, use "Color Name" only.`);
        }
      }

      if (color?.type?.trim()?.toLowerCase() === "update") {
        if (
          color.colorName != null &&
          typeof color.colorName === "string"
        ) {
          // Cannot update if scheduled for deletion
          if (
            deleteGeneralColors != null &&
            Array.isArray(deleteGeneralColors) &&
            deleteGeneralColors?.length > 0 &&
            deleteGeneralColors?.includes(
              color?.colorName?.trim()?.toLowerCase()
            )
          ) {
            colorValidationErrors.push(
              `Color "${color.colorName}" cannot be updated because it is scheduled for deletion.`
            );
          }

          // Must exist originally
          const existingColor = product.colors.find(
            (c) =>
              c.color.toLowerCase() === color?.colorName?.trim()?.toLowerCase()
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

            const isSameQuantity =
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

        // NewColorName conflicts
        if (color?.newColorName != null && typeof color?.newColorName === "string") {
          const newColorNameIsExist = product.colors.find(
            (c) =>
              c.color.toLowerCase() === color?.newColorName?.trim()?.toLowerCase()
          );
          if (newColorNameIsExist) {
            colorValidationErrors.push(
              `The new color name "${color.newColorName}" already exists.`
            );
          }
        }
      }
    }

    // Record seen names
    if (color?.colorName != null && typeof color?.colorName === "string")
      seenOldColorNames.push(color?.colorName?.trim()?.toLowerCase());
    if (color?.newColorName != null && typeof color?.newColorName === "string")
      seenNewColorNames.push(color?.newColorName?.trim()?.toLowerCase());

    // Push accumulated errors
    if (colorValidationErrors.length > 0) {
      colorErrors.push({ colorIndex, message: colorValidationErrors });
    }
  });

  if (colorErrors.length > 0) errors.push(...colorErrors);
  return errors;
}

// Quantity validation
function validateQuantity({ quantity, product, colors, deleteGeneralColors }) {
  const errors = [];

  // Determine if all original colors are being deleted
  allOriginalColorsDeleted =
    Array.isArray(product?.colors) &&
    product?.colors?.length > 0 &&
    Array.isArray(deleteGeneralColors) &&
    deleteGeneralColors?.length === product?.colors?.length &&
    product.colors.every((oc) =>
      deleteGeneralColors.some(
        (dc) =>
          dc?.trim()?.toLowerCase() === oc?.color?.trim()?.toLowerCase()
      )
    );

  // Determine if there are any new or updated colors
  hasNewOrUpdatedColors =
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

  if (quantity != null) {
    if (!isAllowedNumber(quantity)) {
      errors.push(`The quantity must be a number.`);
    } else if (!Number.isInteger(+quantity)) {
      errors.push(`Quantity must be an integer.`);
    } else if (+quantity <= 0) {
      errors.push(`Quantity must be greater than 0.`);
    }

    const hasOriginalColors = product?.colors?.length > 0;

    // Cannot set sizeQuantity in the same request that adds/updates colors
    if (hasNewOrUpdatedColors) {
      errors.push(
        `Cannot add or update quantity while adding or updating colors.`
      );
    }

    // Case 1: size currently has original colors -> must delete them all first
    if (hasOriginalColors && !allOriginalColorsDeleted) {
      errors.push(
        `Cannot add or update quantity because the product still has existing colors. Please delete them first.`
      );
    }
  } else if (allOriginalColorsDeleted && !hasNewOrUpdatedColors) {
    // If deleting all original colors and not adding/updating new ones, general quantity is required
    errors.push(
      `If you want to delete all colors, you must also provide a general quantity for the size.`
    );
  }

  return errors;
}

// ---- MAIN VALIDATION HANDLER ----
// Price
if (price != null) {
  const priceErrors = validatePrice({ price, priceAfterDiscount, product });
  if (priceErrors.length > 0) {
    validationErrors.price = priceErrors;
    updateStatus = false;
  }
}

// Delete price after discount
const { parsed: deletePAD, errors: deletePADerrors } =
  validateDeletePriceAfterDiscount(deletePriceAfterDiscount);

if (deletePADerrors.length > 0) {
  validationErrors.deletePriceAfterDiscount = deletePADerrors;
  updateStatus = false;
}

// Price after discount
if (priceAfterDiscount != null) {
  const padErrors = validatePriceAfterDiscount({
    priceAfterDiscount,
    price,
    product,
    deletePriceAfterDiscountValidation: deletePAD,
  });

  if (padErrors.length > 0) {
    validationErrors.priceAfterDiscount = padErrors;
    updateStatus = false;
  }
}

// Relation between price & price after discount
const relationErrors = validatePriceAndDiscountRelation(price, priceAfterDiscount);
if (relationErrors.length > 0) {
  validationErrors.priceAndDiscountedPrice = relationErrors;
  updateStatus = false;
}

// Delete general colors
const deleteGeneralColorsErrors = validateDeleteGeneralColors(deleteGeneralColors, product);
if (deleteGeneralColorsErrors.length > 0) {
  validationErrors.deleteGeneralColors = deleteGeneralColorsErrors;
  updateStatus = false;
}

// Add and update colors
const colorsErrors = validateColors(colors, product, deleteGeneralColors);
if (colorsErrors.length > 0) {
  validationErrors.updateGeneralColors = colorsErrors;
  updateStatus = false;
}

// Quantity
const quantityErrors = validateQuantity({ quantity, product, colors, deleteGeneralColors });
if (quantityErrors.length > 0) {
  validationErrors.quantity = quantityErrors;
  updateStatus = false;
}