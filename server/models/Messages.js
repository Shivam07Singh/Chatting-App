const mongoose = require("mongoose");

//Creating the Schema For the User
const messageSchema = mongoose.Schema({
  conversationId: { type: String },
  senderId: { type: String },
  message: { type: String },
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
