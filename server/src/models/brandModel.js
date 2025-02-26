const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand name is required"],
      unique: [true, "Brand name must be unique"],
      minlength: [2, "Too short Brand name"],
      maxlength: [32, "Too long Brand name"],
    },
    slug: {
      type: String,
      lowercase: true,
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
