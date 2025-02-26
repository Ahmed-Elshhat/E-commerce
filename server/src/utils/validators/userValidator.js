const { check, body, param } = require("express-validator");
const slugify = require("slugify");
const bcrypt = require("bcryptjs");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const User = require("../../models/userModel");
const { validateExactFields } = require("../validateFields");

exports.getUsersValidator = [
  validateExactFields([], [], ["page", "limit", "keyword", "name", "email"]),
  validatorMiddleware,
];

exports.getUserValidator = [
  validateExactFields([], ["id"]),
  param("id").isMongoId().withMessage("Invalid user id format"),
  validatorMiddleware,
];

exports.createUserValidator = [
  validateExactFields([
    "name",
    "email",
    "password",
    "passwordConfirm",
    "phone",
    "startShift",
    "endShift",
  ]),
  body("name")
    .notEmpty()
    .withMessage("name is required")
    .isLength({ min: 4 })
    .withMessage("Too short User name, Must be longer than 4 characters")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  body("email")
    .notEmpty()
    .withMessage("User is required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("E-mail already in user"));
        }
      })
    ),
  body("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 6 })
    .withMessage("Too short password, Must be longer than 6 characters")
    .custom((val, { req }) => {
      if (val !== req.body.passwordConfirm) {
        throw new Error("Confirm password does not match");
      }
      return true;
    }),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation required"),

  body("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),
  validatorMiddleware,
];

exports.updateUserValidator = [
  check("id").isMongoId().withMessage("Invalid user id format"),
  body("name")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check("email")
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val, { req }) => {
      if (req.user.role !== "admin") {
        if (req.user.id.toString() !== req.params.id) {
          throw new Error("You do not have permission to edit this user!");
        }
      }

      return User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("E-mail already in user"));
        }
      });
    }),

  check("password").custom((value, { req }) => {
    if (value) {
      throw new Error("Password should not be provided");
    }
    return true;
  }),

  check("passwordConfirm").custom((value, { req }) => {
    if (value) {
      throw new Error("passwordConfirm should not be provided");
    }
    return true;
  }),

  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),

  check("profileImg").optional(),
  check("role").optional(),
  validatorMiddleware,
];

exports.deleteUserValidator = [
  check("id").isMongoId().withMessage("Invalid user id format"),
  validatorMiddleware,
];

exports.changeUserPasswordValidator = [
  check("id").isMongoId().withMessage("Invalid User id format"),
  body("currentPassword")
    .notEmpty()
    .withMessage("You must enter your current password"),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("You must enter the password confirm"),
  body("password")
    .notEmpty()
    .withMessage("You must enter new password")
    .custom(async (val, { req }) => {
      // 1) Verify current password
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new Error("There is no user for this id");
      }
      const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      if (!isCorrectPassword) {
        throw new Error("Incorrect current password");
      }

      // 2) Verify password confirm
      if (val !== req.body.passwordConfirm) {
        throw new Error("Password Confirmation incorrect");
      }
      return true;
    }),
  validatorMiddleware,
];


