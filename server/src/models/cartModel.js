const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
  cartItems: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        default: 1,
      },
      color: String,
      size: String,
      price: Number,
      isAvailable: {
        type: Boolean,
        default: true,
      },
    },
  ],

  totalCartPrice: Number,
  totalPriceAfterDiscount: Number,

  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

cartSchema.pre(/^find/, function (next) {
  this.populate("cartItems.product");
  next();
});

cartSchema.post("save", async (doc, next) => {
  await doc.populate("cartItems.product");
  next();
});


const CartModel = mongoose.model("Cart", cartSchema);

module.exports = CartModel;
