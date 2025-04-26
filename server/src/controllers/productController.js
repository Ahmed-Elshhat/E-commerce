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
// @access   Private
exports.createProduct = asyncHandler(async (req, res, next) => {
  // step 1: Copy the body data from the request
  let body = { ...req.body };

  // step 2: Attempt to convert the sizes data into JSON objects
  try {
    body.sizes = JSON.parse(body.sizes); // Convert sizes from string to JSON
  } catch (error) {
    // step 3: If conversion fails, return an error stating that the sizes format is invalid
    return next(new ApiError("Invalid sizes format.", 400));
  }

  // step 4: Extract the values from the body that were sent
  let { sizes, colors, quantity, price, priceAfterDiscount } = body;

  // step 5: Check if sizes exist
  if (sizes) {
    // step 6: Ensure that quantity is not sent for products with sizes
    if (quantity) {
      return next(
        new ApiError(`Cannot send quantity for product with sizes.`, 400)
      );
    }
    // step 7: Ensure that price is not sent for products with sizes
    if (price) {
      return next(
        new ApiError(`Cannot send price for product with sizes.`, 400)
      );
    }
    // step 8: Ensure that priceAfterDiscount is not sent for products with sizes
    if (priceAfterDiscount) {
      return next(
        new ApiError(
          `Cannot send priceAfterDiscount for product with sizes.`,
          400
        )
      );
    }

    // step 9: Ensure that general colors are not sent with sizes
    if (colors && colors.length > 0) {
      return next(new ApiError(`Cannot send general colors with sizes.`, 400));
    }

    // step 10: Check the validity of the sizes sent, ensuring each size has a name and price
    sizes.forEach((size, idx) => {
      // step 11: Ensure a size name exists
      if (!size.size) {
        return next(
          new ApiError(`Size name is required for size index ${idx}`, 400)
        );
      }
      // step 12: Ensure there is a price for each size
      if (!size.price) {
        return next(
          new ApiError(`Price is required for size "${size.size}"`, 400)
        );
      }

      // step 13: If the size has colors, validate them
      if (size.colors && size.colors.length > 0) {
        let total = 0;

        // step 14: Validate the colors within the size and calculate the total quantities
        size.colors.forEach((colorObj, colorIdx) => {
          // step 15: Ensure a color name exists
          if (!colorObj.color) {
            return next(
              new ApiError(
                `Color name is required for color at size "${size.size}"`,
                400
              )
            );
          }
          // step 16: Ensure there is a quantity for each color
          if (colorObj.quantity == null) {
            return next(
              new ApiError(
                `Color quantity is required for color "${colorObj.color}" at size "${size.size}"`,
                400
              )
            );
          }
          total += colorObj.quantity; // step 17: Add the quantity to the total quantity
        });

        // step 18: Ensure that quantity is not directly sent with the size if there are colors
        if (size.quantity) {
          return next(
            new ApiError(
              `Do not send quantity directly for size "${size.size}" with colors`,
              400
            )
          );
        }

        // step 19: Update the size with the total quantity
        body.sizes[idx] = { ...size, quantity: total };
      } else if (size.quantity == null) {
        // step 20: If there are no colors, ensure there is a quantity for the size
        return next(
          new ApiError(
            `Quantity is required for size "${size.size}" without colors`,
            400
          )
        );
      }
    });
  } else {
    // step 21: If there are no sizes but there are colors, validate the colors
    if (colors && colors.length > 0) {
      // step 22: Ensure that a general quantity is not sent with the colors
      if (quantity) {
        return next(
          new ApiError(`Cannot send general quantity with colors`, 400)
        );
      }

      let total = 0;

      // step 23: Validate the colors and calculate the total quantities
      colors.forEach((colorObj, colorIdx) => {
        // step 24: Ensure a color name exists
        if (!colorObj.color) {
          return next(
            new ApiError(
              `Color name is required for color index ${colorIdx}`,
              400
            )
          );
        }
        // step 25: Ensure there is a quantity for each color
        if (colorObj.quantity == null) {
          return next(
            new ApiError(
              `Color quantity is required for color "${colorObj.color}"`,
              400
            )
          );
        }
        total += colorObj.quantity; // step 26: Add the quantity to the total quantity
      });

      // step 27: Update the general quantity based on the colors
      body.quantity = total;
    }

    // step 28: Ensure that a quantity is provided when there are no sizes or colors
    if ((!colors || colors.length === 0) && quantity == null) {
      return next(
        new ApiError(`Quantity is required when no sizes and no colors.`, 400)
      );
    }
  }

  // step 29: Create the product in the database
  const product = await Product.create(body);

  // step 30: Return the created product with a 201 status (created successfully)
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
