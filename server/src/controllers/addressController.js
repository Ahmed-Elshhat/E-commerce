const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const ApiError = require("../utils/apiError");

// @desc    Add address to user addresses list
// @route   POST /api/v1/addresses
// @access  Protected/User
exports.addAddress = asyncHandler(async (req, res, next) => {
  // $addToSet => add address object to user addresses  array if address not exist
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $addToSet: { addresses: req.body },
    },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    message: "Address added successfully.",
    data: user.addresses,
  });
});

exports.removeAddress = asyncHandler(async (req, res, next) => {
  // $pull => remove address object from user addresses array if addressId exist
  const {addressId} = req.params
  const user = await User.findOneAndUpdate(
    {_id: req.user.id, "addresses._id": addressId },
    {
      $pull: { addresses: { _id: addressId } },
    },
    { new: true }
  );

  console.log(user)
  if (!user) {
    return next(new ApiError("No address found with the provided ID.", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Address removed successfully.",
    data: user.addresses,
  });
});

exports.getLoggedUserAddresses = asyncHandler(async (req, res, next) => {
  // $addToSet => add address object to user addresses  array if address not exist
  const user = await User.findById(req.user.id);

  res.status(200).json({
    status: "success",
    results: user.addresses.length,
    data: user.addresses,
  });
});

exports.updateAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;

  // Build the update object dynamically from req.body
  const updateFields = {};
  Object.keys(req.body).forEach((key) => {
    updateFields[`addresses.$.${key}`] = req.body[key]; // Update values inside the array
  });

  // Find the user and update the address inside the array
  const user = await User.findOneAndUpdate(
    { _id: req.user.id, "addresses._id": addressId }, // Search for the address inside the array
    { $set: updateFields }, // Update only the provided values
    { new: true, runValidators: true } // جلب البيانات الجديدة وتشغيل التحقق من صحة البيانات
  );

  if (!user) {
    return next(new ApiError("No address found with the provided ID.", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Address updated successfully.",
    data: user.addresses,
  });
});