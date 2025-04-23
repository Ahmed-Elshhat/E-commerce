const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");

const calcTotalCartPrice = (cart) => {
  let totalPrice = 0;

  cart.cartItems.forEach((item) => {
    totalPrice += item.quantity * item.price;
  });

  cart.totalCartPrice = totalPrice;
  cart.totalPriceAfterDiscount = undefined;
  return totalPrice;
};

// @desc    Add product to cart
// @route   POST /api/v1/cart
// @access  Private/User
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  // Step 1: Extract productId, color, and size from the request body
  const { productId, color, size } = req.body;

  // Step 2: Fetch the product from the database using the provided productId
  const product = await Product.findById(productId);
  if (!product) {
    // Error: Product not found in the database
    return next(new ApiError("Product not found", 404));
  }

  // Step 3: Determine if the product supports colors or sizes
  const hasColors = product.colors && product.colors.length > 0;
  const hasSizes = product.sizes && product.sizes.length > 0;

  let finalPrice; // Stores the final price or discounted price if available
  let availableQuantity; // Stores available quantity for the selected size/color

  // Step 4: Handle products that have size variations
  if (hasSizes) {
    // Step 4.1: Ensure the user selected a size
    if (!size) {
      // Error: Product requires size selection
      return next(
        new ApiError("This product requires a size to be selected", 400)
      );
    }

    // Step 4.2: Find the selected size inside the product's sizes array
    const selectedSize = product.sizes.find((s) => s.size === size);
    if (!selectedSize) {
      // Error: Invalid size selected by the user
      return next(
        new ApiError(`Size '${size}' is not available for this product`, 400)
      );
    }

    // Step 4.3: Determine the price for this size (with discount if available)
    finalPrice =
      selectedSize.priceAfterDiscount != null
        ? selectedSize.priceAfterDiscount
        : selectedSize.price;

    // Step 4.4: Check if this size supports color variations
    if (selectedSize.colors && selectedSize.colors.length > 0) {
      // Step 4.4.1: Require user to select a color for this size
      if (!color) {
        // Error: Color is required for the selected size
        return next(new ApiError("You must select a color for this size", 400));
      }

      // Step 4.4.2: Validate that the selected color exists
      const selectedColor = selectedSize.colors.find((c) => c.color === color);
      if (!selectedColor) {
        // Error: Invalid color selected for the specified size
        return next(
          new ApiError(
            `Color '${color}' is not available for size '${size}'`,
            400
          )
        );
      }

      // Step 4.4.3: Get quantity available for the selected color
      availableQuantity = selectedColor.quantity ?? 0;
    } else {
      // Step 4.5: If size doesn't support colors, reject if color is provided
      if (color) {
        // Error: Color should not be provided for this size
        return next(new ApiError("This size does not support colors", 400));
      }

      // Step 4.5.1: Get quantity available for the selected size
      availableQuantity = selectedSize.quantity ?? 0;
    }
  } else {
    // Step 5: Handle products that do not have sizes
    if (size) {
      // Error: Size should not be provided for this product
      return next(new ApiError("This product does not support sizes", 400));
    }

    // Step 5.1: Determine product-level price (with discount if available)
    finalPrice =
      product.priceAfterDiscount != null
        ? product.priceAfterDiscount
        : product.price;

    if (hasColors) {
      // Step 5.2: Require user to select a color
      if (!color) {
        // Error: Color is required for this product
        return next(
          new ApiError("You must select a color for this product", 400)
        );
      }

      // Step 5.2.1: Validate the selected color
      const selectedColor = product.colors.find((c) => c.color === color);
      if (!selectedColor) {
        // Error: Invalid color selected
        return next(
          new ApiError(
            `Color '${color}' is not available for this product`,
            400
          )
        );
      }

      // Step 5.2.2: Get quantity available for the selected color
      availableQuantity = selectedColor.quantity ?? 0;
    } else {
      // Step 5.3: Reject color if product doesn't support colors
      if (color) {
        // Error: Color should not be provided
        return next(new ApiError("This product does not support colors", 400));
      }

      // Step 5.3.1: Use general product quantity
      availableQuantity = product.quantity ?? 0;
    }
  }

  // Step 6: Look for an existing cart for the user
  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    // Step 6.1: No cart exists, create a new cart if item is in stock
    if (availableQuantity < 1) {
      // Error: No stock available
      return next(
        new ApiError("This product is out of stock and cannot be added", 400)
      );
    }

    // Step 6.2: Create a new cart with the product
    cart = await Cart.create({
      user: req.user.id,
      cartItems: [
        { product: productId, color, size, price: finalPrice, quantity: 1 },
      ],
    });
  } else {
    // Step 7: Cart exists, check if the same product (with same size/color) is already in the cart
    const productIndex = cart.cartItems.findIndex((item) => {
      const itemProductId = item.product._id
        ? item.product._id.toString()
        : item.product.toString();

      // Match product by ID, color, and size (if applicable)
      return (
        itemProductId === productId &&
        item.color === color &&
        (item.size === size || (!item.size && !size))
      );
    });

    if (productIndex > -1) {
      // Step 7.1: Product with same options already exists in the cart

      // Get current quantity of this product in the cart
      const currentQty = cart.cartItems[productIndex].quantity;

      // Step 7.1.1: Prevent adding more than available stock
      if (currentQty + 1 > availableQuantity) {
        //  Error: User is trying to add more items than are available in stock for the selected color and size
        return next(
          new ApiError(
            `Cannot add more than ${availableQuantity} items of this product with color '${color}'${size ? ` and size '${size}'` : ""}`,
            400
          )
        );
      }

      // Step 7.1.2: Increase the quantity by 1
      cart.cartItems[productIndex].quantity += 1;
    } else {
      // Step 7.2: Product not in cart yet, attempt to add it

      // Step 7.2.1: Check if item is in stock before adding
      if (availableQuantity < 1) {
        // Error: Product is not in stock, prevent adding it to the cart
        return next(
          new ApiError("This product is out of stock and cannot be added", 400)
        );
      }

      // Step 7.2.2: Add new product entry to the cart
      cart.cartItems.push({
        product: productId,
        color,
        size,
        price: finalPrice,
        quantity: 1,
      });
    }
  }

  // Step 8: Recalculate the total price of the cart
  calcTotalCartPrice(cart);

  // Step 9: Save the updated cart to the database
  await cart.save();

  // Step 10: Send a success response with cart info
  res.status(201).json({
    status: "success",
    message: "Product added to cart successfully",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Update specific cart item quantity
// @route   PUT /api/v1/cart/:itemId
// @access  Private/User
exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  // 1) Get Cart for logged user
  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ApiError(`There is no cart for user ${req.user._id}`, 404));
  }

  // 2) Find the product in cart by itemId
  const productIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === req.params.itemId
  );

  if (productIndex === -1) {
    return next(
      new ApiError(`There is no item for this id: ${req.params.itemId}`, 404)
    );
  }

  const cartItem = cart.cartItems[productIndex];

  // 3) Get the product data from the cartItem
  const product = cartItem.product;
  if (!product) {
    return next(new ApiError("Product not found", 404));
  }

  // 4) Determine available quantity
  let availableQuantity;
  if (cartItem.size) {
    const selectedSize = product.sizes.find((s) => s.size === cartItem.size);
    if (!selectedSize) {
      return next(
        new ApiError(`Size '${cartItem.size}' is no longer available`, 400)
      );
    }

    const hasSizeColors = selectedSize.colors && selectedSize.colors.length > 0;

    if (hasSizeColors && cartItem.color) {
      const selectedColor = selectedSize.colors.find(
        (c) => c.color === cartItem.color
      );

      if (!selectedColor) {
        return next(
          new ApiError(
            `Color '${cartItem.color}' is not available for size '${cartItem.size}'`,
            400
          )
        );
      }

      availableQuantity = selectedColor.quantity ?? 0;
    } else if (hasSizeColors && !cartItem.color) {
      return next(
        new ApiError(`This size requires a color to be selected`, 400)
      );
    } else if (!hasSizeColors && cartItem.color) {
      return next(new ApiError("This size does not support colors", 400));
    } else {
      availableQuantity = selectedSize.quantity ?? 0;
    }
  } else if (cartItem.color) {
    const hasColors = product.colors && product.colors.length > 0;

    if (!hasColors) {
      return next(new ApiError("This product does not support colors", 400));
    }

    const selectedColor = product.colors.find(
      (c) => c.color === cartItem.color
    );

    if (!selectedColor) {
      return next(
        new ApiError(
          `Color '${cartItem.color}' is not available for this product`,
          400
        )
      );
    }

    availableQuantity = selectedColor.quantity ?? 0;
  } else {
    availableQuantity = product.quantity ?? 0;
  }

  // 5) Check if requested quantity is allowed
  if (quantity > availableQuantity) {
    return next(
      new ApiError(
        `Cannot set quantity more than available: ${availableQuantity}`,
        400
      )
    );
  }

  // 6) Update the quantity
  cartItem.quantity = quantity;
  cart.cartItems[productIndex] = cartItem;

  // 7) Recalculate cart total
  calcTotalCartPrice(cart);
  await cart.save();

  res.status(200).json({
    status: "success",
    message: "Cart item quantity updated successfully",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Get logged user cart
// @route   GET /api/v1/cart
// @access  Private/User
exports.getLoggedUserCart = asyncHandler(async (req, res, next) => {
  // Find the cart associated with the user by user ID
  const cart = await Cart.findOne({ user: req.user.id });

  // If no cart is found for the user
  if (!cart) {
    return next(
      new ApiError(`There is no cart for this user id : ${req.user.id}`, 404)
    );
  }

  res.status(200).json({
    status: "success",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Remove specific cart item
// @route   DELETE /api/v1/cart/:itemId
// @access  Private/User
exports.removeSpecificCartItem = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;
  let cart = await Cart.findOneAndUpdate(
    { user: req.user.id, "cartItems._id": itemId },
    {
      $pull: { cartItems: { _id: itemId } },
    },
    { new: true }
  );

  if (!cart) {
    return next(new ApiError(`there is no item for this id :${itemId}`, 404));
  }

  // Calculate total cart price
  calcTotalCartPrice(cart);
  await cart.save();
  res.status(200).json({
    status: "success",
    message: "Product deleted to cart successfully",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    clear logged user cart
// @route   DELETE /api/v1/cart
// @access  Private/User
exports.clearCart = asyncHandler(async (req, res, next) => {
  // Find the cart associated with the user and delete it
  const cart = await Cart.findOneAndDelete(
    { user: req.user.id }, // Search for the cart by user ID
    { new: true } // Ensure the new document is returned (not needed here, as we're deleting)
  );

  // If no cart was found for the user
  if (!cart) {
    return next(
      new ApiError(`There is no cart for this user id : ${req.user.id}`, 404)
    );
  }

  res.status(204).send();
});

// @desc    Apply coupon on logged user cart
// @route   PUT /api/v1/cart/applyCoupon
// @access  Private/User
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  // 1) Get coupon based on coupon name
  const coupon = await Coupon.findOne({
    name: req.body.coupon,
    expire: { $gt: Date.now() },
  });

  if (!coupon) {
    return next(new ApiError(`Coupon is invalid or expired`));
  }

  // 2) Get logged user cart to get total cart price
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ApiError("Empty cart", 404));
  }

  const totalPrice = cart.totalCartPrice;

  // 3) Calculate price after priceAfterDiscount
  const totalPriceAfterDiscount = (
    totalPrice -
    (totalPrice * coupon.discount) / 100
  ).toFixed(2); // 99.23

  cart.totalPriceAfterDiscount = Number(totalPriceAfterDiscount);
  await cart.save();

  res.status(200).json({
    status: "success",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});
