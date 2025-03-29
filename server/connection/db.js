const mongoose = require("mongoose");
require("dotenv").config(); 

const url = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connection successful");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  }
};

module.exports = connectDB;
