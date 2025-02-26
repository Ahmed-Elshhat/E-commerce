  const asyncHandler = require("express-async-handler");
  const { v4: uuidv4 } = require("uuid");
  const sharp = require("sharp");

  // const slugify = require("slugify");
  // const ApiError = require("../utils/apiError");
  // const ApiFeatures = require("../utils/apiFeatures");
  const factory = require("./handlersFactory");
  const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
  const Category = require("../models/categoryModel");

  // Upload single image
  exports.uploadBrandImage = uploadSingleImage("image");

  // Image processing
  exports.resizeImage = asyncHandler(async (req, res, next) => {
    const fileName = `category-${uuidv4()}-${Date.now()}.jpeg`;

    if (req.file) {
      await sharp(req.file.buffer)
        .resize(600, 600)
        .toFormat("jpeg")
        .jpeg({ quality: 100 })
        .toFile(`src/uploads/categories/${fileName}`);

      // Save image into our db
      req.body.image = fileName;
    }
    next();
  });

  // @desc    Get list of categories
  // @route    GET /api/v1/categories
  // @access    Public
  exports.getCategories = factory.getAll(Category, "Categories");
  // exports.getCategories = asyncHandler(async (req, res) => {
  //   // 1) Build query
  //   const documentsCounts = await Category.countDocuments();
  //   const apiFeatures = new ApiFeatures(Category.find(), req.query)
  //     .Paginate(documentsCounts)
  //     .filter()
  //     .search("Categories")
  //     .limitFields()
  //     .sort();

  //   // 2) Execute query
  //   const { mongooseQuery, paginationResults } = apiFeatures;
  //   const categories = await mongooseQuery;
  //   res
  //     .status(200)
  //     .json({ results: categories.length, paginationResults, data: categories });
  // });

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
  // @route    PUT /api/v1/categories/:id
  // @access    Private
  exports.deleteCategory = factory.deleteOne(Category);
