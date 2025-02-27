const mongoose = require("mongoose");
const url = "mongodb://localhost:27017/";

//Conection to DB
const connectDB = async () => {
  try {
    await mongoose.connect(url).then(() => {
      console.log("MongoDB connection Sucessful");
    });
  } catch (error) {
    console.log("Error connecting MongoDB", error);
  }
};

module.exports = connectDB;
