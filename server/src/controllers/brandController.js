const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

// const slugify = require("slugify");
const ApiError = require("../utils/apiError");
// const ApiFeatures = require("../utils/apiFeatures");
const factory = require("./handlersFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const Brand = require("../models/brandModel");
const Product = require('../models/productModel');

// Upload single image
exports.uploadBrandImage = uploadSingleImage("image");

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const fileName = `brand-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/brands/${fileName}`);

    // Save image into our db
    req.body.image = fileName;
  }
  next();
});

// @desc    Get list of brands
// @route    GET /api/v1/brands
// @access    Public
exports.getBrands = factory.getAll(Brand, "Brands");

// @desc    Get specific brand by id
// @route    GET /api/v1/brands/:id
// @access    Public
exports.getBrand = factory.getOne(Brand);


// @desc    Create brand
// @route    POST /api/v1/brands
// @access    Private
exports.createBrand = factory.createOne(Brand);


// @desc    Update specific brand
// @route    PUT /api/v1/brands/:id
// @access    Private
exports.updateBrand = factory.updateOne(Brand);


// @desc    Delete specific brand
// @route    PUT /api/v1/brands/:id
// @access    Private
exports.deleteBrand = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check if the brand exists
  const brand = await Brand.findById(id);
  if (!brand) {
    return next(new ApiError(`No brand for this id ${id}`, 404));
  }

  // Check if any product is linked to this brand
  const productsWithBrand = await Product.findOne({ brand: id });
  if (productsWithBrand) {
    return next(
      new ApiError(`Brand cannot be deleted as it is linked to products.`, 400)
    );
  }

  // Delete the brand
  await Brand.findByIdAndDelete(id);

  res.status(204).send(); // No Content
});