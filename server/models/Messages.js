const mongoose = require("mongoose");

//Creating the Schema For the User
const messageSchema = mongoose.Schema({
  conversationId: { type: string },
  senderId: { typr: string },
  message: { type: string },
  
});

const Message = mongoose.model("Message", messageSchema);
module.exports = messageSchema;
