const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    nameAr: {
      type: String,
      required: [true, "The brand name in Arabic is required"],
      unique: [true, "The brand name in Arabic must be unique"],
      minlength: [2, "The Arabic name is too short, min 3 chars"],
      maxlength: [32, "The Arabic name is too long, max 32 chars"],
    },
    nameEn: {
      type: String,
      required: [true, "The brand name in English is required"],
      unique: [true, "The brand name in English must be unique"],
      minlength: [2, "The English name is too short, min 3 chars"],
      maxlength: [32, "The English name is too long, max 32 chars"],
    },
    image: String,
  },
  { timestamps: true }
);

const setImageURL = (doc) => {
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/brands/${doc.image}`;
    doc.image = imageUrl;
  }
};

brandSchema.post("init", (doc) => {
  setImageURL(doc);
});

brandSchema.post("save", (doc) => {
  setImageURL(doc);
});

const BrandModel = mongoose.model("Brand", brandSchema);

module.exports = BrandModel;
