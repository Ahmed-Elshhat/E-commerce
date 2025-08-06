if (addSizes != null && Array.isArray(addSizes) && addSizes.length > 0) {
  const addSizesValidation = addSizes.some((size) => {
    // size: String,
    // quantity: Number,
    // price: Number,
    // priceAfterDiscount: Number,
    // colors: [
    //   {
    //     color: String,
    //     quantity: Number,
    //   },
    // ],

    if (size.size == null) {
      next(new ApiError(``, 400));

      return true;
    }

    if (size.size != null && typeof size.size !== "string") {
      next(new ApiError(``, 400));

      return true;
    }

    if (size.size != null && typeof size.size === "string") {
      const sizeIsExist = product.sizes.find(
        (s) => s.size.toLowerCase() === size.size.toLowerCase()
      );

      if (sizeIsExist) {
        next(new ApiError(``, 400));

        return true;
      }

      if (seenNewSizeNames.includes(size.size.toLowerCase())) {
        next(new ApiError(``, 400));

        return true;
      }
    }

    if (size.price == null) {
      next(new ApiError(``, 400));

      return true;
    }

    if (size.price != null && typeof size.price !== "number") {
      next(new ApiError(``, 400));

      return true;
    }

    if (
      size.price != null &&
      typeof size.price === "number" &&
      size.price <= 0
    ) {
      next(new ApiError(``, 400));

      return true;
    }

    if (
      size.priceAfterDiscount != null &&
      typeof size.priceAfterDiscount !== "number"
    ) {
      next(new ApiError(``, 400));

      return true;
    }

    if (
      size.priceAfterDiscount != null &&
      typeof size.priceAfterDiscount === "number" &&
      size.priceAfterDiscount <= 0
    ) {
      next(new ApiError(``, 400));

      return true;
    }

    if (
      size.priceAfterDiscount != null &&
      typeof size.priceAfterDiscount === "number" &&
      size.priceAfterDiscount > size.price
    ) {
      next(new ApiError(``, 400));

      return true;
    }

    if (size.quantity != null && typeof size.quantity !== "number") {
      next(new ApiError(``, 400));

      return true;
    }

    if (
      size.quantity != null &&
      typeof size.quantity === "number" &&
      size.quantity <= 0
    ) {
      next(new ApiError(``, 400));

      return true;
    }

    if (
      size.quantity != null &&
      typeof size.quantity === "number" &&
      size.colors != null
    ) {
      next(new ApiError(``, 400));

      return true;
    }

    if (size.quantity == null && size.colors == null) {
      next(new ApiError(``, 400));

      return true;
    }

    if (
      size.quantity == null &&
      size.colors != null &&
      !Array.isArray(size.colors)
    ) {
      next(new ApiError(``, 400));

      return true;
    }

    if (
      size.quantity == null &&
      size.colors != null &&
      Array.isArray(size.colors) &&
      size.colors.length === 0
    ) {
      next(new ApiError(``, 400));

      return true;
    }

    if (
      size.quantity == null &&
      size.colors != null &&
      Array.isArray(size.colors) &&
      size.colors.length > 0
    ) {
      const seenColorNames = [];
      const colorsValidation = size.colors.some((c) => {
        if (c.color == null) {
          next(new ApiError(``, 400));

          return true;
        }

        if (c.color != null && typeof c.color !== "string") {
          next(new ApiError(``, 400));

          return true;
        }

        if (seenColorNames.includes(c.color.toLowerCase())) {
          next(new ApiError(``, 400));

          return true;
        }

        if (c.quantity == null) {
          next(new ApiError(``, 400));

          return true;
        }

        if (c.quantity != null && typeof c.quantity !== "number") {
          next(new ApiError(``, 400));

          return true;
        }

        if (
          c.quantity != null &&
          typeof c.quantity === "number" &&
          c.quantity <= 0
        ) {
          next(new ApiError(``, 400));

          return true;
        }

        seenColorNames.push(c.color.toLowerCase());
        return false;
      });

      if (colorsValidation) return true;
    }

    return false;
  });

  if (addSizesValidation) updateStatus = false;
}
