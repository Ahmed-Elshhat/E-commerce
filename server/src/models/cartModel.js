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
      price: Number,
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

const CartModel = mongoose.model("Cart", cartSchema);

module.exports = CartModel;
