const mongoose = require("mongoose");

//Creating the Schema For the User
const conversationSchema = mongoose.Schema({
  members: { type: Array, required: true },  //store user who is logged in  and to whom he chats 
});

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
