const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    id: String,
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Order must be belong to user"],
    },
    employee: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Order must be belong to employee"],
    }
    ,
    cartItems: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
        },
        quantity: Number,
        color: String,
        price: Number,
      },
    ],

    taxPrice: {
      type: Number,
      default: 0,
    },
    shippingAddress: {
      details: String,
      phone: String,
      city: String,
      postalCode: String,
    },
    shippingPrice: {
      type: Number,
      default: 0,
    },
    totalOrderPrice: {
      type: Number,
    },
    paymentMethodType: {
      type: String,
      enum: ["card", "cash"],
      default: "cash",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    status: {
      type: String,
      enum: ["charging", "on the way", "delivered", "cancelled"],
      default: "pending",
    },
    deliveredAt: Date,
  },
  { timestamps: true }
);

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name profileImg email phone",
  }).populate({
    path: "cartItems.product",
    select: "title imageCover ",
  });

  next();
});

const OrderModel = mongoose.model("Order", orderSchema);
module.exports = OrderModel;
