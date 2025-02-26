const asyncHandler = require("express-async-handler");
// const { v4: uuidv4 } = require("uuid");
// const sharp = require("sharp");
const bcrypt = require("bcryptjs");

const ApiError = require("../utils/apiError");
const factory = require("./handlersFactory");
// const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const User = require("../models/userModel");

// // Upload single image
// exports.uploadUserImage = uploadSingleImage("profileImg");

// // Image processing
// exports.resizeImage = asyncHandler(async (req, res, next) => {
//   const fileName = `user-${uuidv4()}-${Date.now()}.jpeg`;

//   if (req.file) {
//     await sharp(req.file.buffer)
//       .resize(600, 600)
//       .toFormat("jpeg")
//       .jpeg({ quality: 95 })
//       .toFile(`uploads/users/${fileName}`);

//     // Save image into our db
//     req.body.profileImg = fileName;
//   }
//   next();
// });

exports.createFilterObj = async (req, res, next) => {
  req.filterObj = { role: "employee" };
  next();
};

// @desc    Get list of users
// @route    GET /api/v1/users
// @access    Private
exports.getUsers = factory.getAll(User, "Users");

// @desc    Get specific user by id
// @route    GET /api/v1/users/:id
// @access    Private
exports.getUser = factory.getOne(User, "", "users");

// transform time format to number
function getHour(time) {
  let match = time.match(/^0?(\d+):/); // التقاط الرقم بدون الصفر الأول إن وجد
  return match ? +match[1] : null; // إرجاع الرقم الصحيح
}

// Middleware because transform time format to number for StartShift and EndShift
exports.createUserValidatorMiddleware = (req, res, next) => {
  let errors = {};
  let startShiftHour = getHour(req.body.startShift);
  let endShiftHour = getHour(req.body.endShift);

  if (!startShiftHour || startShiftHour > 24) {
    errors.startShift =
      "Invalid start shift time must be between 1 and 24 example(01:00 Or 24:00)";
  }

  if (!endShiftHour || endShiftHour > 24) {
    errors.endShift =
      "Invalid end shift time must be between 1 and 24 example(01:00 Or 24:00)";
  }

  if (startShiftHour === endShiftHour) {
    errors.shiftMatch = "Start shift and end shift cannot be the same.";
  }

  if (Object.keys(errors).length > 0) {
    return next(new ApiError("Shift Errors", 400, errors));
  }

  req.body.startShift = startShiftHour;
  req.body.endShift = endShiftHour;
  next();
};

// @desc    Create user
// @route    POST /api/v1/users
// @access    Private
exports.createUser = factory.createOne(User, "users");

// @desc    Update specific user
// @route    PUT /api/v1/users/:id
// @access    Private
exports.updateUser = factory.updateOne(User, "", "users");

exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.password) {
    return next(new ApiError("Password is required to update", 400));
  }
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    { new: true }
  );

  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

// @desc    Delete specific user
// @route    PUT /api/v1/users/:id
// @access    Private
exports.deleteUser = factory.deleteOne(User);

exports.getOneWithToken = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});
