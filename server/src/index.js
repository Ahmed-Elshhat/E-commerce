const path = require("path");
const fs = require("fs");

const express = require("express");
const dotenv = require("dotenv");
// To Logging API Requests
const morgan = require("morgan");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const passport = require("passport");
const session = require("express-session");
const { swaggerUi, specs } = require("../swagger");

dotenv.config({ path: "config.env" });
require("./config/passport");
const ApiError = require("./utils/apiError");
const globalError = require("./middlewares/errorMiddleware");
const dbConnection = require("./config/database");
// Create uploads directory and subdirectories if they don't exist
const baseUploadsPath = path.join(__dirname, "..", "uploads");
const folders = ["brands", "categories", "products"];

if (!fs.existsSync(baseUploadsPath)) {
  fs.mkdirSync(baseUploadsPath);
}

folders.forEach((folder) => {
  const folderPath = path.join(baseUploadsPath, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }
});

// Routes
const mountRoutes = require("./routes");
const UserModel = require("./models/userModel");
// Connect With DB
dbConnection();

// Express App
const app = express();
// const port = process.env.PORT || 8000;
const port = 8000 || process.env.PORT;

// app.use(
//   cors({
//     origin: "https://idyllic-marshmallow-df4195.netlify.app",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

app.use(cors());
app.options("*", cors());

// compress all responses
app.use(compression());

// Middleware
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(express.json({ limit: '20kb' }));

app.use(express.static(path.join(__dirname, "..", "uploads")));
// // app.use("/uploads", express.static("uploads"));
// app.use("/videos", express.static("videos"));
// app.use("/images", express.static("images"));
// app.use("/audios", express.static("audios"));
// app.use("/others", express.static("others"));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

// Limit each IP to 5 requests per `window` (here, per 5 minutes)
const limiter = rateLimit({
  windowMs: 10 * 1000, // 5 minutes
  max: 5,
  message:
    "Too many accounts created from this IP, please try again after an 5 minutes",
});

// Apply the rate limiting middleware to all requests
// app.use('/api/v1/auth/login', limiter);
// app.use('/api/v1/auth/signup', limiter);
const authRoutes = ["/api/v1/auth/login", "/api/v1/auth/signup"];
authRoutes.forEach((route) => {
  app.use(route, limiter);
});

// Middleware to protect against HTTP Parameter Pollution attacks
app.use(
  hpp({
    whitelist: [
      "price",
      "sold",
      "quantity",
      "ratingsAverage",
      "ratingsQuantity",
    ],
    checkBody: true,
    checkQuery: true,
  })
);

// إعداد middleware للجلسة قبل Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret", // يمكن أن تكون هذه قيمة مشفرة
    resave: false, // لا تعيد حفظ الجلسة إذا لم تتغير
    saveUninitialized: false, // لا تحفظ الجلسة إذا لم تكن مبدوءة
  })
);

// إعداد passport
app.use(passport.initialize());
app.use(passport.session());

// Serve Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Mount Routes
mountRoutes(app);

// async function o() {
  // await UserModel.findOneAndDelete({ role: "user" });

  // UserModel.create({
  //   name: "Ahmed",
  //   email: "a7medelshhat@gmail.com",
  //   password: "pass123",
  //   role: "admin",
  // });

//   await UserModel.insertMany([
//     {
//       name: "manar mohamed",
//       email: "manar@gmail.com",
//       password: "pass123",
//       role: "employee",
//       startShift: {
//         hour: 11,
//         minutes: 5,
//       },
//       endShift: {
//         hour: 9,
//         minutes: 4,
//       },
//     },
//     {
//       name: "ahmed",
//       email: "a7med1@gmail.com",
//       password: "pass123",
//       role: "user",
//       startShift: {
//         hour: 10,
//         minutes: 6,
//       },
//       endShift: {
//         hour: 9,
//         minutes: 5,
//       },
//       phone: "01123579361",
//     },
//     {
//       name: "ahmed mohamed2",
//       email: "a7med2@gmail.com",
//       password: "pass123",
//       role: "user",
//       startShift: {
//         hour: 10,
//         minutes: 9,
//       },
//       endShift: {
//         hour: 8,
//         minutes: 8,
//       },
//       phone: "01123579361",
//     },
//     {
//       name: "mohamed",
//       email: "mohamed@gmail.com",
//       password: "pass123",
//       role: "employee",
//       startShift: {
//         hour: 12,
//         minutes: 0,
//       },
//       endShift: {
//         hour: 1,
//         minutes: 2,
//       },
//       phone: "01123579361",
//     },
//     {
//       name: "kalid mohamed",
//       email: "kalid@gmail.com",
//       password: "pass123",
//       role: "user",
//     },
//     {
//       accessToken:
//         "ya29.A0AS3H6Ny3pXZtAe3f1svIBnfRLEVwsXNAM3-bRKMlbYEcsmlCFkaLkDxlSz9LprrzaDUTlFfQqaEkyUYz49KpnZiwhr6Zr6_O-SV7MUfTGGeGK08Y-rZxcJz3No7QtyjcggPBlmCZ9sljfdz1SIhKz50AZSeZnNV2YydDJNGvR0MshYhxIbksEDh4HdUNQoY-UOK6WkkaCgYKATUSARYSFQHGX2MiI8YBKGj8EuXkXItwqH9wuA0206",
//       googleId: "101139685235643250003",
//       name: "Ahmed Mohamed",
//       email: "am01158168611@gmail.com",
//       password: "pass123",
//       role: "user",
//     },
//     {
//       accessToken:
//         "ya29.A0AS3H6Nzl6UB3viwMMGjCSY4oeKw3O9l0fN_EyfdeJCTW5GECObrLqYENjjTn8e5CGycj8Tt8TlvaNNG6E9nYuW15YXD1TERZuwFhyykwQOtbn92Rq3xXS_TZtT5P-I4GLaf9mCjuaUEe9i__RsqLRaTGESWvZ3RLtJIVFYY1d22pYGsgmDcPV3gA6a-_q4TBSzfFZ0waCgYKAW0SARcSFQHGX2Mim0rCSdtS5N30YPYWawGpwA0206",
//       googleId: "105291596743922200437",
//       name: "Ahmed Mohamed",
//       email: "aalshhat5@gmail.com",
//       password: "pass123",
//       role: "user",
//     },
//     {
//       name: "asdfsdaf",
//       email: "ahmed@gmail.com",
//       password: "pass123",
//       role: "employee",
//       startShift: {
//         hour: 13,
//         minutes: 14,
//       },
//       endShift: {
//         hour: 16,
//         minutes: 14,
//       },
//     },
//   ]);

//   const data = await UserModel.find();
//   console.log(data);
// }

// o();

app.all("*", (req, res, next) => {
  // Create error and send it to error handling middleware
  // const err = new Error(`Can't find this route: ${req.originalUrl}`);
  // next(err.message);
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handling middleware for express
app.use(globalError);

const server = app.listen(port, () => {
  console.log(`App running in port ${port} http://localhost:${port}/`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});

// Handle rejection outside express
// Events => list => callback(err)
process.on("unhandledRejection", (err) => {
  console.log(`unhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error("Shutting down......");
    process.exit(1);
  });
});
