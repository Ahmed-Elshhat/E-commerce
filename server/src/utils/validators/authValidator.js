const { body } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const User = require("../../models/userModel");
const { validateExactFields } = require("../validateFields");

exports.signupValidator = [
  validateExactFields(["name", "email", "password", "confirmPassword"]),
  body("name")
    .notEmpty()
    .withMessage("name is required")
    .isLength({ min: 3 })
    .withMessage("Too short User name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("Email already exists"));
        }
      })
    ),
  body("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 6 })
    .withMessage("Too short password, Must be longer than 6 characters")
    .custom((val, { req }) => {
      if (val !== req.body.confirmPassword) {
        throw new Error("Confirmation password does not match.");
      }
      return true;
    }),
  body("confirmPassword")
    .notEmpty()
    .withMessage("confirmation Password is required")
    .isLength({ min: 6 })
    .withMessage(
      "Too short confirmation password, Must be longer than 6 characters"
    ),
  validatorMiddleware,
];

exports.loginValidator = [
  validateExactFields(["email", "password"]),
  body("email")
    .notEmpty()
    .withMessage("User is required")
    .isEmail()
    .withMessage("Invalid email address"),
  body("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 6 })
    .withMessage("Too short password, Must be longer than 6 characters"),
  validatorMiddleware,
];

exports.forgotPasswordValidator = [
  validateExactFields(["email"]),
  body("email")
    .notEmpty()
    .withMessage("User is required")
    .isEmail()
    .withMessage("Invalid email address"),
  validatorMiddleware,
];

exports.verifyPassResetCodeValidator = [
  validateExactFields(["resetCode"]),
  body("resetCode")
    .notEmpty()
    .withMessage("Reset code is required.")
    .isLength({ min: 6, max: 6 })
    .withMessage("The reset code must be 6 digits long."),
  validatorMiddleware,
];

exports.resetPasswordValidator = [
  validateExactFields(["email", "resetCode", "newPassword", "confirmPassword"]),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Too short new password, Must be longer than 6 characters")
    .custom((val, { req }) => {
      if (val !== req.body.confirmPassword) {
        throw new Error("Confirmation password does not match");
      }
      return true;
    }),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirmation password is required")
    .isLength({ min: 6 })
    .withMessage(
      "Too short confirmation password, Must be longer than 6 characters"
    ),
  body("resetCode")
    .notEmpty()
    .withMessage("Reset code is required.")
    .isLength({ min: 6, max: 6 })
    .withMessage("The reset code must be 6 digits long."),
  validatorMiddleware,
];
