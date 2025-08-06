if (addSizes != null && Array.isArray(addSizes) && addSizes.length > 0) {
  const addSizesErrors = [];

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
        errors.push(`❌ Size "${size.size}" already exists in the product.`);
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

    if (size.quantity == null && size.colors != null) {
      if (!Array.isArray(size.colors)) {
        errors.push(`❌ colors must be an array.`);
      } else if (size.colors.length === 0) {
        errors.push(`❌ colors array must not be empty.`);
      } else {
        const seenColorNames = [];
        size.colors.forEach((c, colorIndex) => {
          if (c.color == null) {
            errors.push(`❌ Color name is required in colors[${colorIndex}].`);
          } else if (typeof c.color !== "string") {
            errors.push(`❌ Color must be a string in colors[${colorIndex}].`);
          } else if (seenColorNames.includes(c.color.toLowerCase())) {
            errors.push(
              `❌ Duplicate color "${c.color}" in colors[${colorIndex}].`
            );
            seenColorNames.push(c.color.toLowerCase());
          } else {
            seenColorNames.push(c.color.toLowerCase());
          }

          if (c.quantity == null) {
            errors.push(`❌ quantity is required in colors[${colorIndex}].`);
          } else if (typeof c.quantity !== "number") {
            errors.push(
              `❌ quantity must be a number in colors[${colorIndex}].`
            );
          } else if (!Number.isInteger(c.quantity)) {
            errors.push(
              `❌ quantity must be an integer in colors[${colorIndex}].`
            );
          } else if (c.quantity <= 0) {
            errors.push(
              `❌ quantity must be greater than 0 in colors[${colorIndex}].`
            );
          }
        });
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
}
