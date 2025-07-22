  const asyncHandler = require("express-async-handler");
  const { v4: uuidv4 } = require("uuid");
  const sharp = require("sharp");

  const ApiError = require("../utils/apiError");
  const factory = require("./handlersFactory");
  const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
  const Category = require("../models/categoryModel");
  const Product = require('../models/productModel');

  // Upload single image
  exports.uploadCategoryImage = uploadSingleImage("image");

  // Image processing
  exports.resizeImage = asyncHandler(async (req, res, next) => {
    const fileName = `category-${uuidv4()}-${Date.now()}.jpeg`;

    if (req.file) {
      await sharp(req.file.buffer)
        .resize(600, 600)
        .toFormat("jpeg")
        .jpeg({ quality: 100 })
        .toFile(`uploads/categories/${fileName}`);

      // Save image into our db
      req.body.image = fileName;
    }
    next();
  });

  // @desc    Get list of categories
  // @route    GET /api/v1/categories
  // @access    Public
  exports.getCategories = factory.getAll(Category, "Categories");

  // @desc    Get specific category by id
  // @route    GET /api/v1/categories/:id
  // @access    Public
  exports.getCategory = factory.getOne(Category);

  // @desc    Create category
  // @route    POST /api/v1/categories
  // @access    Private
  exports.createCategory = factory.createOne(Category);

  // @desc    Update specific category
  // @route    PUT /api/v1/categories/:id
  // @access    Private
  exports.updateCategory = factory.updateOne(Category);

  // @desc    Delete specific category
  // @route   PUT /api/v1/categories/:id
  // @access  Private

  exports.deleteCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // Check if the category exists
    const category = await Category.findById(id);
    if (!category) {
      return next(new ApiError(`No category for this id ${id}`, 404));
    }

    // Check if any product is linked to this category
    const productsWithCategory = await Product.findOne({ category: id });
    if (productsWithCategory) {
      return next(
        new ApiError(`Category cannot be deleted as it is linked to products.`, 400)
      );
    }

    // Delete the category
    await Category.findByIdAndDelete(id);

    res.status(204).send(); // No Content
  });

