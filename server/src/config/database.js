const mongoose = require("mongoose");

const dbConnection = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
    })
    .then((conn) => {
      console.log(`Database Connected Successfully: ${conn.connection.host}`);
    })
};

module.exports = dbConnection;
