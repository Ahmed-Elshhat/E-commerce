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
  // Extract productId, color, size from the request body
  const { productId, color, size } = req.body;

  // Search for the product in the database using the productId
  const product = await Product.findById(productId);

  // If the product is not found in the database, return an error that the product doesn't exist
  if (!product) {
    return next(new ApiError("Product not found", 404)); // Return 404 error: Product not found
  }

  // Check if the product has available colors
  const hasColors = product.colors && product.colors.length > 0;

  // If the product has available colors
  if (hasColors) {
    // If no color is provided by the user, return an error that color is required
    if (!color) {
      return next(
        new ApiError("This product requires a color to be selected", 400) // Return 400 error: Color is required
      );
    }
    // Check if the color selected by the user is available for this product
    if (!product.colors.includes(color)) {
      return next(
        new ApiError(`Color '${color}' is not available for this product`, 400) // Return 400 error: Color not available
      );
    }
  }
  // If the product does not support colors, but a color is selected by the user
  else if (color) {
    return next(new ApiError("This product does not support colors", 400)); // Return 400 error: Product does not support colors
  }

  // Check if the product has available sizes
  const hasSizes = product.sizes && product.sizes.length > 0;
  let finalPrice;
  let availableQuantity;

  // If the product has sizes
  if (hasSizes) {
    // If no size is selected by the user, return an error that size is required
    if (!size) {
      return next(
        new ApiError("This product requires a size to be selected", 400) // Return 400 error: Size is required
      );
    }

    // Find the selected size in the product's available sizes
    const selectedSize = product.sizes.find((s) => s.size === size);
    // If the selected size is not available for the product, return an error
    if (!selectedSize) {
      return next(
        new ApiError(`Size '${size}' is not available for this product`, 400) // Return 400 error: Size not available
      );
    }

    // Determine the final price of the product based on discount (if available), otherwise use the regular price
    finalPrice =
      selectedSize.priceAfterDiscount != null
        ? selectedSize.priceAfterDiscount
        : selectedSize.price;

    // Determine the available quantity for this size
    availableQuantity = selectedSize.quantity ?? 0; // If quantity is not available, assume 0
  } else {
    // If the product does not have sizes but a size is provided by the user
    if (size) {
      return next(new ApiError("This product does not support sizes", 400)); // Return 400 error: Product does not support sizes
    }

    // Determine the final price of the product based on discount (if available), otherwise use the regular price
    finalPrice =
      product.priceAfterDiscount != null
        ? product.priceAfterDiscount
        : product.price;

    // Determine the available quantity of the product
    availableQuantity = product.quantity ?? 0; // If quantity is not available, assume 0
  }

  // Search for the user's cart in the database
  let cart = await Cart.findOne({ user: req.user.id });

  // If no cart is found for the user
  if (!cart) {
    // If the available quantity is less than 1 (i.e., product is out of stock), return an error
    if (availableQuantity < 1) {
      return next(
        new ApiError("This product is out of stock and cannot be added", 400) // Return 400 error: Product out of stock
      );
    }

    // Create a new cart for the user and add the product to it
    cart = await Cart.create({
      user: req.user.id, // Set the user for whom the cart is being created
      cartItems: [{ product: productId, color, size, price: finalPrice }], // Add the product to the cart
    });
  } else {
    // If the cart exists, check if the product is already in the cart
    const productIndex = cart.cartItems.findIndex((item) => {
      // Compare the productId of the product in the cart with the productId of the product the user wants to add
      const itemProductId = item.product._id
        ? item.product._id.toString()
        : item.product.toString();
      return (
        itemProductId === productId && // Match the productId
        item.color === color && // Match the color
        (item.size === size || (!item.size && !size)) // Match the size (or if sizes are not supported)
      );
    });

    // If the product is already in the cart
    if (productIndex > -1) {
      // Get the current quantity of the product in the cart
      const currentQty = cart.cartItems[productIndex].quantity;

      // If the quantity to be added exceeds the available quantity, return an error
      if (currentQty + 1 > availableQuantity) {
        return next(
          new ApiError(
            `Cannot add more than ${availableQuantity} items of this product`, // Return 400 error: Cannot add more than the available quantity
            400
          )
        );
      }

      // If the quantity is valid, increase the quantity in the cart
      cart.cartItems[productIndex].quantity += 1;
    } else {
      // If the product is not already in the cart
      if (availableQuantity < 1) {
        return next(
          new ApiError("This product is out of stock and cannot be added", 400) // Return 400 error: Product out of stock
        );
      }

      // Add the new product to the cart
      cart.cartItems.push({
        product: productId,
        color,
        size,
        price: finalPrice,
      });
    }
  }

  // Calculate the total price of the cart after adding the product
  calcTotalCartPrice(cart);

  // Save the updated cart in the database
  await cart.save();

  // Send a response to the user indicating the success of the operation with the number of items in the cart and the updated cart data
  res.status(201).json({
    status: "success",
    message: "Product added to cart successfully",
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

// @desc    Update specific cart item quantity
// @route   PUT /api/v1/cart/:itemId
// @access  Private/User
exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  // 1) Get Cart for logged user
  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ApiError(`there is no cart for user ${req.user._id}`, 404));
  }

  // check if product already exists in cart
  const productIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === req.params.itemId
  );

  if (productIndex > -1) {
    // product exist in cart, update product quantity
    const cartItem = cart.cartItems[productIndex];
    cartItem.quantity = quantity;
    cart.cartItems[productIndex] = cartItem;
  } else {
    return next(
      new ApiError(`there is no item for this id :${req.params.itemId}`, 404)
    );
  }

  // Calculate total cart price
  calcTotalCartPrice(cart);
  await cart.save();
  res.status(200).json({
    status: "success",
    message: "Product updated to cart successfully",
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
