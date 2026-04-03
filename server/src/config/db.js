const mongoose = require("mongoose");

const connectDb = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGODB_URI);
};

module.exports = { connectDb };
