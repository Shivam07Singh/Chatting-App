const mongoose = require("mongoose");

//Creating the Schema For the User
const conversationSchema = mongoose.Schema({
  members: { type: Array, required: true },
});

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = conversationSchema;
