const mongoose = require("mongoose");

// 1- Create Schema
const categorySchema = new mongoose.Schema(
  {
    nameAr: {
      type: String,
      required: [true, "The category name in Arabic is required"],
      unique: [true, "The category name in Arabic must be unique"],
      minlength: [3, "The Arabic name is too short, min 3 chars"],
      maxlength: [32, "The Arabic name is too long, max 32 chars"],
    },
    nameEn: {
      type: String,
      required: [true, "The category name in English is required"],
      unique: [true, "The category name in English must be unique"],
      minlength: [3, "The English name is too short, min 3 chars"],
      maxlength: [32, "The English name is too long, max 32 chars"],
    },
    image: String,
  },
  { timestamps: true }
);

const setImageURL = (doc) => {
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/categories/${doc.image}`;
    doc.image = imageUrl;
  }
};

// findOne, findAll and update
categorySchema.post("init", (doc) => {
  setImageURL(doc);
});

// create
categorySchema.post("save", (doc) => {
  setImageURL(doc);
});

// 2- Create model
const CategoryModel = mongoose.model("Category", categorySchema);

module.exports = CategoryModel;
