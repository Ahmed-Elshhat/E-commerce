const asyncHandler = require("express-async-handler");
// const slugify = require("slugify");
const SubCategory = require("../models/subCategoryModel");
// const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");
const factory = require("./handlersFactory");

// Nested route
// GET /api/v1/categories/:categoryId/subcategories
exports.createFilterObj = (req, res, next) => {
  let filterObj = {};
  if (req.params.categoryId) filterObj = { category: req.params.categoryId };
  req.filterObj = filterObj;
  next();
};
// @desc    Get list of subCategory
// @route    GET /api/v1/subcategories
// @access    Public
exports.getSubCategories = factory.getAll(SubCategory, "SubCategories");
// exports.getSubCategories = asyncHandler(async (req, res) => {
//   // 1) Build query
//   const apiFeatures = new ApiFeatures(
//     SubCategory.find(req.filterObj),
//     req.query
//   )
//     .filter()
//     .search("SubCategory")
//     .limitFields()
//     .sort();

//   const filteredCount = await apiFeatures.mongooseQuery
//     .clone()
//     .countDocuments();
//   apiFeatures.Paginate(filteredCount);

//   // 2) Execute query
//   const { mongooseQuery, paginationResults } = apiFeatures;
//   const subCategories = await mongooseQuery; // .populate({ path: "category", select: "name-_id" });
//   res
//     .status(200)
//     .json({
//       results: subCategories.length,
//       paginationResults,
//       data: subCategories,
//     });
// });

// @desc    Get specific subCategory by id
// @route    GET /api/v1/subcategories/:id
// @access    Public
exports.getSubCategory = factory.getOne(SubCategory);
// exports.getSubCategory = asyncHandler(async (req, res, next) => {
//   const { id } = req.params;
//   const subCategory = await SubCategory.findById(id);
//   // .populate(
//   //   /* "category" */ {
//   //     path: "category",
//   //     select: "name-_id",
//   //   }
//   // );
//   if (!subCategory) {
//     return next(new ApiError(`No subcategory for this id ${id}`, 404));
//   }
//   res.status(200).json({ data: subCategory });
// });

// Nested route
// POST /api/v1/categories/:categoryId/subcategories


exports.setCategoryIdToBody = (req, res, next) => {
  // Nested route
  if (!req.body.category) req.body.category = req.params.categoryId;
  next();
};

// @desc    Create subCategory
// @route    POST /api/v1/subcategories
// @access    Private
exports.createSubCategory = factory.createOne(SubCategory);

// @desc    Update specific subCategory
// @route    PUT /api/v1/subcategories/:id
// @access    Private
exports.updateSubCategory = factory.updateOne(SubCategory);

// @desc    Delete specific subCategory
// @route    PUT /api/v1/subcategories/:id
// @access    Private
exports.deleteSubCategory = factory.deleteOne(SubCategory);
