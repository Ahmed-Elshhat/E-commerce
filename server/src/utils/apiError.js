// @dec    this class is responsible about operation errors (errors that i can predict)

class ApiError extends Error {
  constructor(message, statusCode, errors) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(4) ? "fail" : "error";
    this.isOperational = true;
    this.errors = errors;
  }
}

module.exports = ApiError;
