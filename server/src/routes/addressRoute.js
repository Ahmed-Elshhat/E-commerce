const express = require("express");

const router = express.Router();

const authService = require("../controllers/authController");
const {
  addAddressValidator,
  updateAddressValidator,
  removeAddressValidator,
  getLoggedUserAddressesValidator,
} = require("../utils/validators/addressValidator");

const {
  addAddress,
  getLoggedUserAddresses,
  updateAddress,
  removeAddress,
} = require("../controllers/addressController");

router.use(authService.protect, authService.allowedTo("user"));

router
  .route("/")
  .post(addAddressValidator, addAddress)
  .get(getLoggedUserAddressesValidator, getLoggedUserAddresses);

router
  .route("/:addressId")
  .put(updateAddressValidator, updateAddress)
  .delete(removeAddressValidator, removeAddress);

module.exports = router;
