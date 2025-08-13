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