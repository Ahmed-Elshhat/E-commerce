const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Coupon name required'],
      unique: [true, 'Coupon name must be unique'],
    },
    expire: {
      type: Date,
      required: [true, 'Coupon expire time required'],
    },
    discount: {
      type: Number,
      enum: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
      required: [true, 'Coupon discount value required'],
    },
  },
  { timestamps: true }
);

const CouponModel = mongoose.model('Coupon', couponSchema);
module.exports = CouponModel

