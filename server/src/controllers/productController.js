const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

// const slugify = require("slugify");
// const ApiError = require("../utils/apiError");
// const ApiFeatures = require("../utils/apiFeatures");
const factory = require("./handlersFactory");
const Product = require("../models/productModel");
const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");

exports.uploadProductImages = uploadMixOfImages([
  {
    name: "imageCover",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 5,
  },
]);

exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  //1- Image processing for imageCover
  if (req.files.imageCover) {
    const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/products/${imageCoverFileName}`);

    // Save image into our db
    req.body.imageCover = imageCoverFileName;
  }
  //2- Image processing for images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

        await sharp(img.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 95 })
          .toFile(`uploads/products/${imageName}`);

        // Save image into our db
        req.body.images.push(imageName);
      })
    );
  }
  next();
});

// upgrade for resizeProductImages
// exports.resizeProductImages = asyncHandler(async (req, res, next) => {
//   const { productId } = req.params; // افترضنا أنك تمرر productId في مسار الطلب
//   let currentProduct = null;

//   // إذا كان الطلب للتحديث، احضر المنتج الحالي من قاعدة البيانات
//   if (productId) {
//     const Product = require('../models/productModel'); // استيراد الموديل
//     currentProduct = await Product.findById(productId);

//     if (!currentProduct) {
//       return next(new ApiError('Product not found', 404));
//     }
//   }

//   // 1- Image processing for imageCover
//   if (req.files.imageCover) {
//     const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;

//     await sharp(req.files.imageCover[0].buffer)
//       .resize(2000, 1333)
//       .toFormat('jpeg')
//       .jpeg({ quality: 95 })
//       .toFile(`uploads/products/${imageCoverFileName}`);

//     // Save image into our db
//     req.body.imageCover = imageCoverFileName;
//   } else if (currentProduct) {
//     // احتفظ بالغلاف القديم إذا لم يتم إرسال غلاف جديد
//     req.body.imageCover = currentProduct.imageCover;
//   }

//   // 2- Image processing for images
//   if (req.files.images) {
//     req.body.images = currentProduct?.images || []; // نسخ الصور القديمة (لو كانت موجودة)
//     const newImages = [];

//     await Promise.all(
//       req.files.images.map(async (img, index) => {
//         const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

//         await sharp(img.buffer)
//           .resize(2000, 1333)
//           .toFormat('jpeg')
//           .jpeg({ quality: 95 })
//           .toFile(`uploads/products/${imageName}`);

//         // Add new image to the list
//         newImages.push(imageName);
//       })
//     );

//     // دمج الصور القديمة مع الجديدة
//     req.body.images = [...req.body.images, ...newImages];
//   } else if (currentProduct) {
//     // احتفظ بالصور القديمة إذا لم يتم إرسال صور جديدة
//     req.body.images = currentProduct.images;
//   }

//   next();
// });

// this feares optional

// إزالة الصور القديمة:

// إذا كنت تريد استبدال صورة قديمة بأخرى جديدة، يمكنك حذف الصورة القديمة من مجلد التخزين.
// javascript
// نسخ
// تحرير
// const fs = require('fs');
// fs.unlink(`uploads/products/${oldImageName}`, (err) => {
//   if (err) console.error('Failed to delete image:', err);
// });
// تحقق من الصور المكررة:

// إذا كانت هناك صور مكررة في الطلب الجديد، يمكن تجنب إضافتها.

// ملاحظات إضافية:
// إذا كنت تسمح بتحديد أي الصور يتم تحديثها أو حذفها، يمكن إرسال IDs أو أسماء الصور في الطلب (body) لتحديد ما الذي سيتم فعله.
// على سبيل المثال:
// json
// نسخ
// تحرير
// {
//   "removeImages": ["old-image1.jpeg", "old-image2.jpeg"],
//   "addImages": ["new-image1.jpeg", "new-image2.jpeg"]
// }
// لو عاوز توضيح أكتر أو تعديل مخصص، أنا جاهز! 😊

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
exports.createProduct = factory.createOne(Product);

// @desc    Update specific product
// @route    PUT /api/v1/products/:id
// @access    Private
exports.updateProduct = factory.updateOne(Product, "reviews");

// @desc    Delete specific product
// @route    PUT /api/v1/products/:id
// @access    Private
exports.deleteProduct = factory.deleteOne(Product);
