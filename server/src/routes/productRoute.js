const express = require("express");

const router = express.Router();

const {
  getProductValidator,
  createProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require("../utils/validators/productValidator");

const {
  productSearch,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  resizeProductImages,
  parseJSON
} = require("../controllers/productController");

const AuthService = require("../controllers/authController");
const reviewsRoute = require("./reviewRoute");

// POST   /products/jkshjhsdjh2332n/reviews
// GET    /products/jkshjhsdjh2332n/reviews
// GET    /products/jkshjhsdjh2332n/reviews/87487sfww3
router.use("/:productId/reviews", reviewsRoute);
router.get("/productSearch", productSearch);

router
  .route("")
  .get(getProducts)
  .post(
    AuthService.protect,
    AuthService.allowedTo("admin", "manager"),
    uploadProductImages,
    resizeProductImages,
    parseJSON,
    createProductValidator,
    createProduct
  );

router
  .route("/:id")
  .get(getProductValidator, getProduct)
  .put(
    AuthService.protect,
    AuthService.allowedTo("admin", "manager"),
    uploadProductImages,
    resizeProductImages,
    updateProductValidator,
    updateProduct
  )
  .delete(
    AuthService.protect,
    AuthService.allowedTo("admin", "manager"),
    deleteProductValidator,
    deleteProduct
  );

module.exports = router;
