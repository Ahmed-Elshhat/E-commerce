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
// @access    Private
exports.createProduct = asyncHandler(async (req, res, next) => {
  let body = { ...req.body };
  
  try {
    body.sizes = JSON.parse(body.sizes);
  } catch (error) {
    return next(new ApiError("Invalid sizes format.", 400));
  }

  let { sizes, colors, quantity, price, priceAfterDiscount } = body;
  
  if (sizes) {
    if (quantity) {
      return next(
        new ApiError(`Cannot send quantity for product with sizes.`, 400)
      );
    }
    if (price) {
      return next(
        new ApiError(`Cannot send price for product with sizes.`, 400)
      );
    }
    if (priceAfterDiscount) {
      return next(
        new ApiError(
          `Cannot send priceAfterDiscount for product with sizes.`,
          400
        )
      );
    }

    if (colors && colors.length > 0) {
      return next(new ApiError(`Cannot send general colors with sizes.`, 400));
    }

    sizes.forEach((size, idx) => {
      if (!size.size) {
        return next(
          new ApiError(`Size name is required for size index ${idx}`, 400)
        );
      }
      if (!size.price) {
        return next(
          new ApiError(`Price is required for size "${size.size}"`, 400)
        );
      }

      if (size.colors && size.colors.length > 0) {
        let total = 0;

        size.colors.forEach((colorObj, colorIdx) => {
          if (!colorObj.color) {
            return next(
              new ApiError(
                `Color name is required for color at size "${size.size}"`,
                400
              )
            );
          }
          if (colorObj.quantity == null) {
            return next(
              new ApiError(
                `Color quantity is required for color "${colorObj.color}" at size "${size.size}"`,
                400
              )
            );
          }
          total += colorObj.quantity;
        });

        if (size.quantity) {
          return next(
            new ApiError(
              `Do not send quantity directly for size "${size.size}" with colors`,
              400
            )
          );
        }

        body.sizes[idx] = { ...size, quantity: total };
      } else if (size.quantity == null) {
        return next(
          new ApiError(
            `Quantity is required for size "${size.size}" without colors`,
            400
          )
        );
      }
    });
  } else {
    if (colors && colors.length > 0) {
      if (quantity) {
        return next(
          new ApiError(`Cannot send general quantity with colors`, 400)
        );
      }

      let total = 0;

      colors.forEach((colorObj, colorIdx) => {
        if (!colorObj.color) {
          return next(
            new ApiError(
              `Color name is required for color index ${colorIdx}`,
              400
            )
          );
        }
        if (colorObj.quantity == null) {
          return next(
            new ApiError(
              `Color quantity is required for color "${colorObj.color}"`,
              400
            )
          );
        }
        total += colorObj.quantity;
      });

      body.quantity = total;
    }

    if ((!colors || colors.length === 0) && quantity == null) {
      return next(
        new ApiError(`Quantity is required when no sizes and no colors.`, 400)
      );
    }
  }

  const product = await Product.create(body);
  res.status(201).json({ data: product });
});

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
