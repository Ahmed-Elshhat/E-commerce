const factory = require("./handlersFactory");
const Review = require("../models/reviewModel");
const ApiError = require("../utils/apiError");
const Product = require("../models/productModel");

// Nested route
// GET /api/v1/products/:productId/reviews
exports.createFilterObj = async(req, res, next) => {
  let filterObject = {};
  if (req.params.productId) {
    filterObject = { product: req.params.productId };
  } else if (req.query.product) {
    filterObject = { product: req.query.product };
  } else {
    next(new ApiError("The product id is required", 400));
  }

  const product = await Product.findById(filterObject.product);

  if (!product) {
    return next(
      new ApiError(`No product for this id ${filterObject.product}`, 404)
    );
  }
  req.filterObj = filterObject;
  next();
};

// @desc    Get list of reviews
// @route   GET /api/v1/reviews
// @access  Public
exports.getReviews = factory.getAll(Review, "Reviews");

// @desc    Get specific review by id
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = factory.getOne(Review);

// Nested route (Create)
exports.setProductIdAndUserIdToBody = (req, res, next) => {
  if (!req.body.product) req.body.product = req.params.productId;
  if (req.user) req.body.user = req.user.id;
  next();
};

// @desc    Create review
// @route   POST  /api/v1/reviews
// @access  Private/Protect/User
exports.createReview = factory.createOne(Review);

// @desc    Update specific review
// @route   PUT /api/v1/reviews/:id
// @access  Private/Protect/User
exports.updateReview = factory.updateOne(Review);

// @desc    Delete specific review
// @route   DELETE /api/v1/reviews/:id
// @access  Private/Protect/User-Admin-Manager
exports.deleteReview = factory.deleteOne(Review);
