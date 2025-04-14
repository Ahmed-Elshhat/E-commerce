const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

// const slugify = require("slugify");
// const ApiError = require("../utils/apiError");
// const ApiFeatures = require("../utils/apiFeatures");
const factory = require("./handlersFactory");
const Product = require("../models/productModel");
const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const ApiFeatures = require("../utils/apiFeatures");

exports.uploadProductImages = uploadMixOfImages([
  {
    name: "coverImage",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 10,
  },
]);

exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  //1- Image processing for coverImage
  if (req.files.coverImage) {
    const coverImageFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.coverImage[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 75 })
      .toFile(`uploads/products/${coverImageFileName}`);

    // Save image into our db
    req.body.coverImage = coverImageFileName;
  }
  //2- Image processing for images
  if (req.files.images) {
    req.body.images = [];

    const imagesArray = req.files.images.slice(0, 10); // الحد الأقصى 10 صور

    await Promise.all(
      imagesArray.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

        await sharp(img.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 95 })
          .toFile(`uploads/products/${imageName}`);

        req.body.images.push({
          // _id: new mongoose.Types.ObjectId(),
          url: imageName,
        });
      })
    );
  }
  next();
});

// @desc    Get list of products
// @route    GET /api/v1/products
// @access    Public
exports.getProducts = factory.getAll(Product, "Products", "reviews");
// exports.getProducts = asyncHandler(async (req, res) => {
//   // // 1) Filtering
//   // const queryStringObj = { ...req.query };
//   // const excludesFields = ["page", "sort", "limit", "fields", "keyword"];
//   // excludesFields.forEach((field) => delete queryStringObj[field]);

//   // // Apply Filtration using [gte, gt, lte, lt]
//   // let queryStr = JSON.stringify(queryStringObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

//   // // 1) Pagination
//   // const page = +req.query.page;
//   // const limit = +req.query.limit;
//   // const skip = (page - 1) * limit;

//   // 2) Build query
//   const documentsCounts = await Product.countDocuments();
//   const apiFeatures = new ApiFeatures(Product.find(), req.query)
//     .Paginate(documentsCounts)
//     .filter()
//     .search("Products")
//     .limitFields()
//     .sort();

//   // 6) Execute query
//   const { mongooseQuery, paginationResults } = apiFeatures;
//   const products = await mongooseQuery;
//   res
//     .status(200)
//     .json({ results: products.length, paginationResults, data: products });

//   // let mongooseQuery = Product.find(JSON.parse(queryStr))
//   //   // .where("price")
//   //   // .equals(req.query.price)
//   //   // .where("ratingsAverage")
//   //   // .equals(req.query.ratingsAverage)

//   // // 3) Sorting
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(",").join(" ");
//   //   mongooseQuery = mongooseQuery.sort(sortBy);
//   // } else {
//   //   mongooseQuery = mongooseQuery.sort("-createAt");
//   // }

//   // 4) Fields Limiting
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(",").join(" ");
//   //   mongooseQuery = mongooseQuery.select(`${fields}`);
//   // } else {
//   //   mongooseQuery = mongooseQuery.select(`-__v`);
//   // }

//   // // 5) Search
//   // if (req.query.keyword) {
//   //   let query = {};
//   //   query.$or = [
//   //     { title: { $regex: req.query.keyword, $options: "i" } },
//   //     { description: { $regex: req.query.keyword, $options: "i" } },
//   //   ];
//   //   mongooseQuery = mongooseQuery.find(query);
//   // }
// });

// @desc    Get specific product by id
// @route    GET /api/v1/products/:id
// @access    Public
exports.getProduct = factory.getOne(Product, "reviews");

// @desc    Create product
// @route    POST /api/v1/products
// @access    Private
exports.createProduct = factory.createOne(Product, "product");

// @desc    Update specific product
// @route    PUT /api/v1/products/:id
// @access    Private
exports.updateProduct = factory.updateOne(Product, "reviews");

// @desc    Delete specific product
// @route    PUT /api/v1/products/:id
// @access    Private
exports.deleteProduct = factory.deleteOne(Product);

// @desc    Search for products
// @route    GET /api/v1/products/productSearch
// @access    protected
exports.productSearch = asyncHandler(async (req, res) => {
  const { s } = req.query;
  if (!s) return res.json([]);

  const categories = await Category.find({
    name: { $regex: s, $options: "i" },
  });

  const brands = await Brand.find({
    name: { $regex: s, $options: "i" },
  });

  const categoryIds = categories.map((cat) => cat._id);
  const brandIds = brands.map((brand) => brand._id);

  const filterObj = {
    $or: [
      { title: { $regex: s, $options: "i" } },
      { category: { $in: categoryIds } },
      { brand: { $in: brandIds } },
    ],
  };

  let apiFeatures = new ApiFeatures(Product.find(filterObj), req.query)
    .sort()
    .filter();

  const filteredCount = await apiFeatures.mongooseQuery
    .clone()
    .countDocuments();
  apiFeatures.Paginate(filteredCount);

  const { mongooseQuery, paginationResults } = apiFeatures;
  const products = await mongooseQuery
    .populate("category", "name")
    .populate("brand", "name");

  res.json({ results: products.length, paginationResults, products });
});
