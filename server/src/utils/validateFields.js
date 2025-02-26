const { body, param, query } = require("express-validator");

exports.validateExactFields = (
  allowedBodyFields = [],
  allowedParamsFields = [],
  allowedQueryFields = []
) => [
  body().custom((_, { req }) => {
    const receivedFields = Object.keys(req.body);
    const unexpectedFields = receivedFields.filter(
      (field) => !allowedBodyFields.includes(field)
    );
    if (unexpectedFields.length > 0) {
      throw new Error(`Unexpected body fields: ${unexpectedFields.join(", ")}`);
    }
    return true;
  }),

  param().custom((_, { req }) => {
    const receivedFields = Object.keys(req.params);
    const unexpectedFields = receivedFields.filter(
      (field) => !allowedParamsFields.includes(field)
    );
    if (unexpectedFields.length > 0) {
      throw new Error(
        `Unexpected params fields: ${unexpectedFields.join(", ")}`
      );
    }
    return true;
  }),

  query().custom((_, { req }) => {
    const receivedFields = Object.keys(req.query);
    const unexpectedFields = receivedFields.filter(
      (field) => !allowedQueryFields.includes(field)
    );
    if (unexpectedFields.length > 0) {
      throw new Error(
        `Unexpected query fields: ${unexpectedFields.join(", ")}`
      );
    }
    return true;
  }),
];