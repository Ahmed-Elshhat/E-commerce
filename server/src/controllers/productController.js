const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

const factory = require("./handlersFactory");
const Product = require("../models/productModel");
const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const ApiFeatures = require("../utils/apiFeatures");
const ApiError = require("../utils/apiError");

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

exports.parseJSON = asyncHandler(async (req, res, next) => {
  if (req.body.sizes) {
    try {
      req.body.sizes = JSON.parse(req.body.sizes); // Convert sizes from string to JSON
    } catch (error) {
      // step 3: If conversion fails, return an error stating that the sizes format is invalid
      return next(new ApiError("Invalid sizes format.", 400));
    }
  }

  if (req.body.colors) {
    try {
      req.body.colors = JSON.parse(req.body.colors); // Convert colors from string to JSON
    } catch (error) {
      // step 5: If conversion fails, return an error stating that the colors format is invalid
      return next(new ApiError("Invalid colors format.", 400));
    }
  }

  next();
});

// @desc    Get list of products
// @route    GET /api/v1/products
// @access    Public
exports.getProducts = factory.getAll(Product, "Products", "reviews");

// @desc    Get specific product by id
// @route    GET /api/v1/products/:id
// @access    Public
exports.getProduct = factory.getOne(Product, "reviews");

// @desc    Create product
// @route    POST /api/v1/products
// @access   Private
exports.createProduct = asyncHandler(async (req, res, next) => {
  let body = { ...req.body };

  let { sizes, colors } = body;

  if (sizes) {
    sizes.forEach((size, idx) => {
      if (size.colors && size.colors.length > 0) {
        let total = 0;

        size.colors.forEach((color) => {
          total += color.quantity; // step 22: Add the quantity to the total quantity
        });

        body.sizes[idx] = { ...size, quantity: total };
      }
    });
  } else if (colors && colors.length > 0) {
    let total = 0;

    colors.forEach((color) => {
      total += color.quantity;
    });

    body.quantity = total;
  }

  const product = await Product.create(body);

  res.status(201).json({ data: product });
});

// @desc    Update specific product
// @route    PUT /api/v1/products/:id
// @access    Private
exports.updateProduct =   asyncHandler(async (req, res, next) => {













  
    let query = Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // if (populationOpt) {
    //   query = query.populate({ path: populationOpt, select: "-__v" });
    // }

    const product = await query;
    if (!product) {
      return next(
        new ApiError(`No product for this id ${req.params.id}`, 404)
      );
    }
    res.status(200).json({ data: product });
  });

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
