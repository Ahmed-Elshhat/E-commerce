const categoryRoute = require("./categoryRoute");
const subCategoryRoute = require("./subCategoryRoute");
const brandRoute = require("./brandRoute");
const productRoute = require("./productRoute");
const reviewRoute = require("./reviewRoute");
const userRoute = require("./userRoute");
const cartRoute = require("./cartRoute");
const addressRoute = require("./addressRoute");
const couponRoute = require("./couponRoute");
const orderRoute = require("./orderRoute");
const authRoute = require("./authRoute");

const mountRoutes = (app) => {
  app.use("/api/v1/categories", categoryRoute);
  app.use("/api/v1/subcategories", subCategoryRoute);
  app.use("/api/v1/brands", brandRoute);
  app.use("/api/v1/products", productRoute);
  app.use('/api/v1/reviews', reviewRoute);
  app.use("/api/v1/users", userRoute);
  app.use("/api/v1/cart", cartRoute);
  app.use('/api/v1/addresses', addressRoute);
  app.use('/api/v1/coupons', couponRoute);
  app.use('/api/v1/orders', orderRoute);
  app.use("/api/v1/auth", authRoute);
};

module.exports = mountRoutes;
