const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Model.findByIdAndDelete(id);
    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }
    res.status(204).send();
  });

exports.updateOne = (Model, populationOpt) =>
  asyncHandler(async (req, res, next) => {
    let query = Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // If true , returns the updated document And if false returns the original document
    );

    if (populationOpt) {
      query = query.populate({ path: populationOpt, select: "-__v" });
    }

    const document = await query;
    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }
    res.status(200).json({ data: document });
  });

exports.createOne = (Model, modelName) =>
  asyncHandler(async (req, res) => {
    console.log("Before:",req.body)
    let body =
      modelName === "users" ? { ...req.body, role: "employee" } : req.body;
      console.log("After:",body)
    const newDoc = await Model.create(body);
    res.status(201).json({ data: newDoc });
  });

exports.getOne = (Model, populationOpt, modelName) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    let user =
      modelName === "order" && req.user.role === "user" ? req.user.id : null;
    let role = modelName === "users" ? "employee" : null;
    // 1) Build query
    // let query = Model.findById(id);
    let query = Model.findOne({
      _id: id,
      ...(user && { user }),
      ...(role && { role }),
    });
    if (populationOpt) {
      query = query.populate({ path: populationOpt, select: "-__v" });
    }

    // 2) Execute query
    const document = await query;

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }
    res.status(200).json({ data: document });
  });

exports.getAll = (Model, searchKeyWord, populationOpt) =>
  asyncHandler(async (req, res) => {
    const needsFilter = [
      "SubCategories",
      "Reviews",
      "Orders",
      "Users",
    ].includes(searchKeyWord);
    const filterObj = needsFilter ? req.filterObj : {};

    let apiFeatures = new ApiFeatures(Model.find(filterObj), req.query)
      .filter()
      .search(searchKeyWord)
      .limitFields()
      .sort();

    const filteredCount = await apiFeatures.mongooseQuery
      .clone()
      .countDocuments();
    apiFeatures.Paginate(filteredCount);
    if (populationOpt) {
      apiFeatures.mongooseQuery = apiFeatures.mongooseQuery.populate({
        path: populationOpt,
        select: "-__v",
      });
    }

    // 6) Execute query
    const { mongooseQuery, paginationResults } = apiFeatures;
    const documents = await mongooseQuery;
    res
      .status(200)
      .json({ results: documents.length, paginationResults, data: documents });
  });
