const express = require("express");

// mergeParams: Allow us to access parameters on other routers
// Ex: We need to access categoryId from category router
const router = express.Router({ mergeParams: true });
const {
  getSubCategoryValidator,
  createSubCategoryValidator,
  updateSubCategoryValidator,
  deleteSubCategoryValidator,
} = require("../utils/validators/subCategoryValidator");

const {
  getSubCategories,
  getSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  setCategoryIdToBody,
  createFilterObj,
} = require("../controllers/subCategoryController");

const AuthService = require("../controllers/authController");

router
  .route("")
  .get(createFilterObj, getSubCategories)
  .post(
    AuthService.protect,
    AuthService.allowedTo("admin", "manager"),
    setCategoryIdToBody,
    createSubCategoryValidator,
    createSubCategory
  );

router
  .route("/:id")
  .get(getSubCategoryValidator, getSubCategory)
  .put(
    AuthService.protect,
    AuthService.allowedTo("admin", "manager"),
    updateSubCategoryValidator,
    updateSubCategory
  )
  .delete(
    AuthService.protect,
    AuthService.allowedTo("admin", "manager"),
    deleteSubCategoryValidator,
    deleteSubCategory
  );

module.exports = router;
