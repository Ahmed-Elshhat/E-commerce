const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const { validateExactFields } = require("../validateFields");

exports.getLoggedUserAddressesValidator = [
  validateExactFields(),
  validatorMiddleware,
];

exports.addAddressValidator = [
  validateExactFields(["alias", "details", "phone", "city", "postalCode"]),
  body("alias")
    .notEmpty()
    .withMessage("Alias is required")
    .isLength({ min: 3 })
    .withMessage("Too short alias, Must be longer than 3 characters")
    .isLength({ max: 40 })
    .withMessage("Too long alias, Must be shorter than 40 characters"),
  body("details")
    .notEmpty()
    .withMessage("Details is required")
    .isLength({ min: 5 })
    .withMessage("Too short details, Must be longer than 5 characters")
    .isLength({ max: 90 })
    .withMessage("Too long details, Must be shorter than 90 characters"),
  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .isMobilePhone(["ar-EG"])
    .withMessage("Invalid phone number only accepted Egy Phone numbers"),
  body("city")
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 5 })
    .withMessage("Too short city, Must be longer than 5 characters")
    .isLength({ max: 20 })
    .withMessage("Too long city, Must be shorter than 20 characters"),
  body("postalCode")
    .notEmpty()
    .withMessage("Postal Code is required")
    .matches(/^\d{5}$/)
    .withMessage(
      "Invalid postal code format for Egypt. It should be exactly 5 digits."
    ),
  validatorMiddleware,
];

exports.updateAddressValidator = [
  validateExactFields(
    ["alias", "details", "phone", "city", "postalCode"],
    ["addressId"]
  ),
  body("alias")
    .optional()
    .notEmpty()
    .withMessage("Alias is required")
    .isLength({ min: 3 })
    .withMessage("Too short alias, Must be longer than 3 characters")
    .isLength({ max: 40 })
    .withMessage("Too long alias, Must be shorter than 40 characters"),
  body("details")
    .optional()
    .notEmpty()
    .withMessage("Details is required")
    .isLength({ min: 5 })
    .withMessage("Too short details, Must be longer than 5 characters")
    .isLength({ max: 90 })
    .withMessage("Too long details, Must be shorter than 90 characters"),
  body("phone")
    .optional()
    .notEmpty()
    .withMessage("Phone is required")
    .isMobilePhone(["ar-EG"])
    .withMessage("Invalid phone number only accepted Egy Phone numbers"),
  body("city")
    .optional()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 5 })
    .withMessage("Too short city, Must be longer than 5 characters")
    .isLength({ max: 20 })
    .withMessage("Too long city, Must be shorter than 20 characters"),
  body("postalCode")
    .optional()
    .notEmpty()
    .withMessage("Postal Code is required")
    .matches(/^\d{5}$/)
    .withMessage(
      "Invalid postal code format for Egypt. It should be exactly 5 digits."
    ),
  validatorMiddleware,
];

exports.removeAddressValidator = [
  validateExactFields([], ["addressId"]),
  check("addressId")
    .notEmpty()
    .withMessage("Id is required")
    .isMongoId()
    .withMessage("Invalid address id format"),
  validatorMiddleware,
];
