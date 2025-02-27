const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");
const User = require("../models/userModel");
const createToken = require("../utils/createToken");
const sendEmail = require("../utils/sendEmail");

// @desc    Signup
// @route   POST /api/v1/auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res, next) => {
  // 1- Create user
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  // 2- Generate token
  const token = createToken(user._id);

  const userObject = user.toObject();
  userObject.id = user._id;
  delete userObject.password;
  delete userObject?.accessToken;
  delete userObject.__v;
  delete userObject._id;

  res.status(201).json({ user: userObject, token });
});

// @desc    Login
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  // 1) check if password and email in the body (validation)
  // 2) check if user exist & check if password is correct
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError("Incorrect email or password", 401));
  }
  // 3) Generate token
  const token = createToken(user._id);
  // 4) Send response to client side

  const userObject = user.toObject();
  userObject.id = user._id;
  delete userObject.password;
  delete userObject?.accessToken;
  delete userObject.__v;
  delete userObject._id;
  res.status(200).json({ user: userObject, token });
});

// @desc    Login with google and return token
// @route   GET /api/v1/auth/google/callback
// @access  Public
exports.googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  const token = createToken(user.id);

  res.cookie("ECT", token, {
    httpOnly: false,
    secure: false,
    sameSite: "strict",
    path: "/",
  });

  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("http://localhost:3000");
    });
  });
});

// @desc Make sure the user is logged in
exports.protect = asyncHandler(async (req, res, next) => {
  // 1) Check if token exist, if exist get
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new ApiError(
        "You are not login, Please login to get access this route",
        401
      )
    );
  }
  // 2) Verify token(no change happens, expired token)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  // 3) Check if user exists
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(
      new ApiError(
        "The user that belong to this token does no longer exist",
        401
      )
    );
  }
  // 4) Check if user change his password after token created
  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );

    // Password changed after token created (Error)
    if (passChangedTimestamp > decoded.iat) {
      return next(
        new ApiError(
          "User recently changed his password. please login again",
          401
        )
      );
    }
  }
  const userObject = currentUser.toObject();
  userObject.id = currentUser._id;
  delete userObject.password;
  delete userObject?.accessToken;
  delete userObject.__v;
  delete userObject._id;
  req.user = userObject;
  next();
});

// @desc Allow certain roles to access certain routes
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // 1) Access roles
    let userRole = req.user.role;
    // 2) Check if user has any of the roles
    if (!roles.includes(userRole)) {
      return next(
        new ApiError("You are not allowed to access this route", 403)
      );
    }
    next();
  });

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotPassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with that email ${req.body.email}`, 404)
    );
  }
  // 2) If user exist, Generate hash reset random 6 digits and save it in db
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // Save hashed password reset code into db
  user.passwordResetCode = hashedResetCode;
  // Add expiration time for password reset code (10 min)
  user.passwordResetExpires = Date.now() + 1 * 60 * 1000;
  user.passwordResetVerified = false;

  await user.save();

  // 3) Send the reset code via email
  const message = `
  <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; text-align: center;">
    <div style="max-width: 500px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #333;">🔐 Reset Your Password</h2>
      <p style="font-size: 16px; color: #666;">Hi <strong>${user.name}</strong>,</p>
      <p style="font-size: 16px; color: #666;">We received a request to reset the password on your <strong>E-shop</strong> account.</p>
      <p style="font-size: 18px; font-weight: bold; background: #007bff; color: white; padding: 10px; border-radius: 5px; display: inline-block;">
        ${resetCode}
      </p>
      <p style="font-size: 16px; color: #666;">Enter this code to complete the reset.</p>
      <p style="font-size: 14px; color: #999;">Thanks for helping us keep your account secure.</p>
      <p style="font-size: 14px; color: #007bff; font-weight: bold;">The E-shop Team</p>
    </div>
  </div>
`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (valid for 10 min)",
      message,
    });
  } catch (err) {
    // 4) clear reset token data
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();
    return next(new ApiError("There is an error in sending email", 500));
  }

  res
    .status(200)
    .json({ status: "Success", message: "Reset code sent to email" });
});

// @desc    Verify password reset code
// @route   POST /api/v1/auth/verifyResetCode
// @access  Public
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  // 1) Hash the reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  // 2) Get user based on reset code
  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError("Reset code invalid or expired"));
  }

  // 3) Reset code valid
  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({
    status: "Success",
  });
});

// @desc    Reset password
// @route   POST /api/v1/auth/resetPassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Hash the reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");
  // 1) Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with email ${req.body.email}`, 404)
    );
  }

  if (user.passwordResetCode !== hashedResetCode) {
    return next(new ApiError(`Invalid password reset code.`, 404));
  }

  // 2) Check if the reset code has expired
  if (!user.passwordResetExpires || user.passwordResetExpires < Date.now()) {
    return next(new ApiError("Reset code has expired", 400));
  }

  // 3) Check if reset code verified
  if (!user.passwordResetVerified) {
    return next(new ApiError("Reset code not verified", 400));
  }

  // 4) Update user password and clear reset token data
  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  // 5) if everything is ok, generate token
  const token = createToken(user._id);
  res.status(200).json({ token });
});
