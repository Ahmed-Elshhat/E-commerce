const fs = require("fs");

require("colors");

const dotenv = require("dotenv");
const Category = require("../../models/categoryModel");
const SubCategory = require('../../models/subCategoryModel');
const Brand = require('../../models/brandModel');
const Product = require('../../models/productModel');
const dbConnection = require("../../config/database");

dotenv.config({ path: "../../config.env" });

// connect to DB
dbConnection();

// Read data
const categories = JSON.parse(fs.readFileSync("./categories.json"));
const subCategories = JSON.parse(fs.readFileSync('./subCategories.json'));
const brands = JSON.parse(fs.readFileSync('./brands.json'));
const products = JSON.parse(fs.readFileSync('./products.json'));

// Insert data into DB
const insertData = async () => {
  try {
    await Category.create(categories);
    await SubCategory.create(subCategories);
    await Brand.create(brands);
    await Product.create(products);

    console.log("Data Inserted".green.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// Delete data from DB
const destroyData = async () => {
  try {
    await Category.deleteMany();
    await SubCategory.deleteMany();
    await Brand.deleteMany();
    await Product.deleteMany();
    console.log("Data Destroyed".red.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// node seeder.js -d
if (process.argv[2] === "-i") {
  insertData();
} else if (process.argv[2] === "-d") {
  destroyData();
}
