const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

// const slugify = require("slugify");
// const ApiError = require("../utils/apiError");
// const ApiFeatures = require("../utils/apiFeatures");
const factory = require("./handlersFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const Brand = require("../models/brandModel");

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
// exports.getBrands = asyncHandler(async (req, res) => {
//   // 1) Build query
//   const documentsCounts = await Brand.countDocuments();
//   const apiFeatures = new ApiFeatures(Brand.find(), req.query)
//     .Paginate(documentsCounts)
//     .filter()
//     .search("Brands")
//     .limitFields()
//     .sort();

//   // 2) Execute query
//   const { mongooseQuery, paginationResults } = apiFeatures;
//   const brands = await mongooseQuery;
//   res
//     .status(200)
//     .json({ results: brands.length, paginationResults, data: brands });
// });

// @desc    Get specific brand by id
// @route    GET /api/v1/brands/:id
// @access    Public
exports.getBrand = factory.getOne(Brand);
// exports.getBrand = asyncHandler(async (req, res, next) => {
//   const { id } = req.params;
//   const brand = await Brand.findById(id);
//   if (!brand) {
//     return next(new ApiError(`No brand for this id ${id}`, 404));
//   }
//   res.status(200).json({ data: brand });
// });

// @desc    Create brand
// @route    POST /api/v1/brands
// @access    Private
exports.createBrand = factory.createOne(Brand);
// exports.createBrand = asyncHandler(async (req, res) => {
//   const { name } = req.body;
//   const brand = await Brand.create({ name, slug: slugify(name) });
//   res.status(201).json({ data: brand });
// });

// @desc    Update specific brand
// @route    PUT /api/v1/brands/:id
// @access    Private
exports.updateBrand = factory.updateOne(Brand);
// exports.updateBrand = asyncHandler(async (req, res, next) => {
//   const { id } = req.params;
//   const { name } = req.body;
//   const brand = await Brand.findOneAndUpdate(
//     { _id: id },
//     { name, slug: slugify(name) },
//     { new: true } // If true , returns the updated document And if false returns the original document
//   );
//   if (!brand) {
//     return next(new ApiError(`No brand for this id ${id}`, 404));
//   }
//   res.status(200).json({ data: brand });
// });

// @desc    Delete specific brand
// @route    PUT /api/v1/brands/:id
// @access    Private
exports.deleteBrand = factory.deleteOne(Brand);
// exports.deleteBrand = asyncHandler(async (req, res, next) => {
//   const { id } = req.params;
//   const brand = await Brand.findByIdAndDelete(id);
//   if (!brand) {
//     return next(new ApiError(`No brand for this id ${id}`, 404));
//   }
//   res.status(204).send();
// });
