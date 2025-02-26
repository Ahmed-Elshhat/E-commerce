const express = require("express");

const router = express.Router();
const subCategoryRoute = require("./subCategoryRoute");


const {
  getCategoryValidator,
  getCategoriesValidator,
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("../utils/validators/categoryValidator");

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadBrandImage,
  resizeImage,
} = require("../controllers/categoryController");

const AuthService = require("../controllers/authController");

router.use("/:categoryId/subcategories", subCategoryRoute);


router
  .route("")
  .get(getCategoriesValidator, getCategories)
  .post(
    AuthService.protect,
    AuthService.allowedTo("admin", "employee"),
    uploadBrandImage,
    resizeImage,
    createCategoryValidator,
    createCategory
  );

router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .put(
    AuthService.protect,
    AuthService.allowedTo("admin", "employee"),
    uploadBrandImage,
    resizeImage,
    updateCategoryValidator,
    updateCategory
  )
  .delete(
    AuthService.protect,
    AuthService.allowedTo("admin", "employee"),
    deleteCategoryValidator,
    deleteCategory
  );

module.exports = router;
