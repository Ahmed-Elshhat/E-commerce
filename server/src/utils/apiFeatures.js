class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.queryString = queryString;
    this.mongooseQuery = mongooseQuery;
  }

  filter() {
    // 1) Filtering
    const queryStringObj = { ...this.queryString };
    const excludesFields = ["page", "sort", "limit", "fields", "keyword"];
    excludesFields.forEach((field) => delete queryStringObj[field]);

    // Apply Filtration using [gte, gt, lte, lt]
    let queryStr = JSON.stringify(queryStringObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    // 3) Sorting
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(`${fields}`);
    } else {
      this.mongooseQuery = this.mongooseQuery.select(`-__v`);
    }
    return this;
  }

  search(modelName) {
    // 5) Search
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (this.queryString.keyword) {
      const safeKeyword = escapeRegExp(this.queryString.keyword);
      let query = {};
      if (modelName === "Products") {
        query.$or = [
          { title: { $regex: safeKeyword, $options: "i" } },
          { description: { $regex: safeKeyword, $options: "i" } },
        ];
      } else {
        query = { name: { $regex: safeKeyword, $options: "i" } };
      }
      this.mongooseQuery = this.mongooseQuery.find(query);
    }
    return this;
  }

  Paginate(countDocuments) {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 5;
    const skip = (page - 1) * limit;
    const endIndex = page * limit;

    // Pagination result
    const pagination = {};
    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.numberOfPages = Math.ceil(countDocuments / limit);

    // next page
    if (endIndex < countDocuments) {
      pagination.next = page + 1;
    }

    if (skip > 0) {
      pagination.prev = page - 1;
    }

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    this.paginationResults = pagination;
    return this;
  }
}

module.exports = ApiFeatures;
