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
// @route   Post /api/v1/cart
// @access  Private/User
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  const { productId, color } = req.body;
  const product = await Product.findById(productId);

  if (!product) {
    return next(new ApiError("Product not found", 404));
  }

  // 1) Get Cart for logged user
  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    // create cart fot logged user with product
    cart = await Cart.create({
      user: req.user.id,
      cartItems: [{ product: productId, color, price: product.price }],
    });
  } else {
    // check if product already exists in cart
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId && item.color === color
    );

    if (productIndex > -1) {
      // product exist in cart, update product quantity
      const cartItem = cart.cartItems[productIndex];
      cartItem.quantity += 1;
      cart.cartItems[productIndex] = cartItem;
    } else {
      // product not exist in cart,  push product to cartItems array
      cart.cartItems.push({ product: productId, color, price: product.price });
    }
  }

  // Calculate total cart price
  calcTotalCartPrice(cart);
  await cart.save();
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
  const cart = await Cart.findOne({ user: req.user.id });

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
  const cart = await Cart.findOneAndDelete(
    { user: req.user.id },
    { new: true }
  );
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

  const totalPrice = cart.totalCartPrice;

  // 3) Calculate price after priceAfterDiscount
  const totalPriceAfterDiscount = (
    totalPrice -
    (totalPrice * coupon.discount) / 100
  ).toFixed(2); // 99.23

  cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
  await cart.save();

  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});
