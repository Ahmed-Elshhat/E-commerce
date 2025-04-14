const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    titleEn: {
      type: String,
      required: [true, "Product title in English is required."],
      trim: true,
      minlength: [
        3,
        "Product title in English must be at least 3 characters long.",
      ],
      maxlength: [
        100,
        "Product title in English cannot exceed 100 characters.",
      ],
    },
    titleAr: {
      type: String,
      required: [true, "Product title in Arabic is required."],
      trim: true,
      minlength: [
        3,
        "Product title in Arabic must be at least 3 characters long.",
      ],
      maxlength: [100, "Product title in Arabic cannot exceed 100 characters."],
    },
    descriptionEn: {
      type: String,
      required: [true, "Product description in English is required."],
      minlength: [
        20,
        "Product description in English must be at least 20 characters long.",
      ],
      maxlength: [
        2000,
        "Product description in English must not exceed 2000 characters.",
      ],
    },
    descriptionAr: {
      type: String,
      required: [true, "Product description in Arabic is required."],
      minlength: [
        20,
        "Product description in Arabic must be at least 20 characters long.",
      ],
      maxlength: [
        2000,
        "Product description in Arabic must not exceed 2000 characters.",
      ],
    },
    quantity: {
      type: Number,
      required: [true, "product quantity is required"],
    },
    sold: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "product price is required"],
      trim: true,
      max: [200000, "Too long product price"],
    },
    priceAfterDiscount: {
      type: Number,
    },
    colors: [String],
    sizes: [
      {
        size: String,
        quantity: Number,
        price: Number,
      },
    ],
    coverImage: {
      type: String,
      required: [true, "Product Image cover is required"],
    },
    images: [
      {
        // _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        url: { type: String },
      },
    ],
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "Product must be belong to category"],
    },
    brand: {
      type: mongoose.Schema.ObjectId,
      ref: "Brand",
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Rating must be above or equal 1.0"],
      max: [5, "Rating must be below or equal 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // to enable virtual populate
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

productSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: "category",
      select: "-__v",
    },
    {
      path: "brand",
      select: "-__v",
    },
  ]);
  next();
});

const setImageURL = (doc) => {
  if (doc.coverImage) {
    const imageUrl = `${process.env.BASE_URL}/products/${doc.coverImage}`;
    doc.coverImage = imageUrl;
  }
  if (doc.images) {
    const imagesList = [];
    doc.images.forEach((image) => {
      const imageUrl = {
        _id: image._id,
        url: `${process.env.BASE_URL}/products/${image.url}`,
      };
      imagesList.push(imageUrl);
    });
    doc.images = imagesList;
  }
};

// findOne, findAll and update
productSchema.post("init", (doc) => {
  setImageURL(doc);
});

// create
productSchema.post("save", (doc) => {
  setImageURL(doc);
});

const ProductModel = mongoose.model("Product", productSchema);

module.exports = ProductModel;
