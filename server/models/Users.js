const mongoose = require("mongoose");

//Creating the Schema For the User
const userSchema = mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String },
});

const Users = mongoose.model("User", userSchema);
module.exports = Users;
