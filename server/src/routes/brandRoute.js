const express = require("express");

const router = express.Router();
const {
  getBrandsValidator,
  getBrandValidator,
  createBrandValidator,
  updateBrandValidator,
  deleteBrandValidator,
} = require("../utils/validators/brandValidator");

const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandImage,
  resizeImage,
} = require("../controllers/brandController");

const AuthService = require("../controllers/authController");

router
  .route("")
  .get(getBrandsValidator, getBrands)
  .post(
    AuthService.protect,
    AuthService.allowedTo("admin", "employee"),
    uploadBrandImage,
    resizeImage,
    createBrandValidator,
    createBrand
  );

router
  .route("/:id")
  .get(getBrandValidator, getBrand)
  .put(
    AuthService.protect,
    AuthService.allowedTo("admin", "employee"),
    uploadBrandImage,
    resizeImage,
    updateBrandValidator,
    updateBrand
  )
  .delete(
    AuthService.protect,
    AuthService.allowedTo("admin", "employee"),
    deleteBrandValidator,
    deleteBrand
  );

module.exports = router;
