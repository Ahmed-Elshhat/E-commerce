const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// تعريف إعدادات Swagger
const options = {
  definition: {
    openapi: "3.0.0", // تحديد إصدار OpenAPI
    info: {
      title: "E-commerce", // عنوان التوثيق
      version: "1.0.0", // إصدار API
      description: "API documentation for E-commerce application",
    },
    servers: [
      {
        url: "http://localhost:8000", // رابط السيرفر المحلي
        description: "Local server",
      },
    ],
  },
  apis: ["./src/docs/*.js"], // تحديد الملفات التي تحتوي على توثيق الـ API
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
