import React, { useEffect, useState } from "react";
import axios from "axios";
import userLogo from "../assets/user-solid.svg";
import tree from "../assets/tree.jpg";
import Input from "../components/Input";
import {io} from "socket.io-client"

const Dashboard = () => {
  const [socket, setSocket] = useState(null)
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user:details")));
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // New state to track selected user before conversation creation


  useEffect(() => {
    setSocket(io('http://localhost:5173/'))
  },[])

  // Fetch all conversations for the logged-in user
  const fetchConversations = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:8000/api/conversation/${user.id}`);
      console.log("Conversations =>", data);
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users except the logged-in user
  const fetchUsers = async () => {
    if (!user?.id) return;

    try {
      const { data } = await axios.get(`http://localhost:8000/api/users/${user?.id}`);
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, [user?.id]);

  // Handle clicking on an existing conversation
  const handleConversationClick = async (conversationId, receiverUser) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:8000/api/message/${conversationId}`);

      setMessages({
        messages: data,
        receiver: receiverUser,
        conversationId: conversationId,
      });
      setSelectedUser(null); // Clear any selected user
    } catch (error) {
      console.error("Error fetching messages:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking on a user from the Users list (right sidebar)
  const handleUserClick = async (receiverUser) => {
    // Check if a conversation already exists with this user
    const existingConversation = conversations.find(
      (conv) => conv.user.receiverId === receiverUser.receiverId
    );

    if (existingConversation) {
      // If conversation exists, just load it
      handleConversationClick(existingConversation.conversationId, existingConversation.user);
    } else {
      // If no conversation exists, just select the user without creating a conversation yet
      setSelectedUser(receiverUser);
      setMessages({
        messages: [],
        receiver: receiverUser,
        conversationId: null, // No conversation ID yet
      });
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!message) return;

    try {
      let conversationId = messages.conversationId;

      // If there's a selected user but no conversation yet, create the conversation
      if (!conversationId && selectedUser) {
        const { data } = await axios.post(`http://localhost:8000/api/conversation`, {
          senderId: user?.id,
          receiverId: selectedUser.receiverId,
        });

        conversationId = data.conversation._id;
      }

      // Send the message
      const { data } = await axios.post(`http://localhost:8000/api/message`, {
        conversationId: conversationId,
        senderId: user?.id,
        message,
        receiverId: selectedUser?.receiverId || messages?.receiver?.receiverId,
      });

      console.log("Message sent =>", data);

      // If this was a new conversation, update the conversationId in messages state
      if (!messages.conversationId) {
        setMessages((prev) => ({
          ...prev,
          conversationId: data.conversationId,
        }));
      }

      // Update the messages state with the new message
      setMessages((prev) => ({
        ...prev,
        messages: [
          ...(prev.messages || []),
          {
            user: { id: user?.id, fullName: user?.fullName, email: user?.email },
            message,
            timestamp: new Date(),
          },
        ],
      }));

      // Clear the message input and selected user
      setMessage("");
      setSelectedUser(null);

      // Refresh conversations to ensure the latest message is shown
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
    }
  };

  // Handle keypress in message input (send on Enter)
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="box-border w-screen flex">
      {/* Left Sidebar - Conversations */}
      <div className="h-screen w-[25%] bg-gray-100 overflow-y-auto">
        <div className="flex items-center my-[20px] mx-14">
          <div
            className="border-2 border-blue-400 rounded-full overflow-hidden"
            style={{ width: "50px", height: "50px" }}
          >
            <img src={tree} alt="userLogo" className="w-full h-full object-cover" />
          </div>

          <div className="ml-8">
            <p className="text-2xl">{user?.fullName}</p>
            <p className="text-lg font-light">My Account</p>
          </div>
        </div>
        <hr />
        <div className="mx-14 mt-7">
          <div className="text-blue-400 text-lg">Messages</div>
          <div>
            {loading ? (
              <div className="text-center py-4">Loading conversations...</div>
            ) : conversations.length > 0 ? (
              conversations.map(({ conversationId, user: conversationUser }) => (
                <div
                  key={conversationId}
                  className={`flex items-center py-[20px] border-b border-b-gray-300 cursor-pointer ${
                    messages?.conversationId === conversationId ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleConversationClick(conversationId, conversationUser)}
                >
                  <div className="border border-black p-[4px] rounded-full overflow-hidden">
                    <img src={userLogo} width={35} height={35} alt="userLogo" />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-semibold">{conversationUser?.fullName}</h3>
                    <p className="text-sm text-gray-400 font-light">{conversationUser?.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-lg font-semibold mt-24">No Conversations</div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Window - Middle */}
      <div className="h-screen w-[50%] bg-white flex flex-col items-center">
        {/* Chat Header */}
        {(messages?.receiver?.fullName || selectedUser?.fullName) && (
          <div className="w-[75%] bg-gray-100 h-[80px] mt-4 mb-6 rounded-full flex items-center px-14">
            <div className="cursor-pointer">
              <img src={userLogo} alt="userLogo" width={40} height={40} />
            </div>
            <div className="ml-6 mr-auto">
              <h3 className="text-lg">{selectedUser?.fullName || messages?.receiver?.fullName}</h3>
              <p className="text-sm text-gray-400 font-light">
                {selectedUser?.email || messages?.receiver?.email}
              </p>
            </div>
            <div className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5l1.5-2.5 5 2v4a2 2 0 0 1-2 2 16 16 0 0 1-15-15 2 2 0 0 1 2-2"></path>
              </svg>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="h-[75%] w-full overflow-y-auto pr-4 scrollbar-hide">
          <div className="p-12">
            {loading ? (
              <div className="text-center py-4">Loading messages...</div>
            ) : messages?.messages?.length > 0 ? (
              messages.messages.map(({ message, user: messageUser }, index) => (
                <div
                  key={index}
                  className={`max-w-[40%] rounded-b-xl p-4 mb-4 ${
                    messageUser?.id === user?.id
                      ? "bg-blue-400 rounded-tl-xl ml-auto text-white"
                      : "bg-gray-200 rounded-tr-xl"
                  }`}
                >
                  {message}
                </div>
              ))
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                {messages?.receiver?.fullName || selectedUser?.fullName
                  ? "No messages yet. Start a conversation!"
                  : "Select a conversation or user to start chatting"}
              </div>
            )}
          </div>
        </div>

        {/* Message Input */}
        {(messages?.receiver?.fullName || selectedUser?.fullName) && (
          <div className="p-8 w-full flex items-center">
            <div
              className={`p-2 cursor-pointer bg-light rounded-full ${
                !message ? "text-gray-400 pointer-events-none" : "text-blue-500"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0 -18 0"></path>
                <path d="M9 12h6"></path>
                <path d="M12 9v6"></path>
              </svg>
            </div>
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-[75%]"
              inputClassName="p-4 border border-gray-300 shadow-md !rounded-full bg-light focus:ring-0 focus:border-blue-400 outline-none"
            />
            <div
              className={`ml-4 p-2 cursor-pointer rounded-full ${
                !message ? "text-gray-400 pointer-events-none" : "text-blue-500 hover:bg-blue-100"
              }`}
              onClick={sendMessage}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M10 14l11 -11"></path>
                <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"></path>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Users List */}
      <div className="min-h-screen w-[25%] bg-green-100 px-8 py-16 overflow-y-auto">
        <div className="text-blue-400 text-lg font-semibold mb-4">People</div>
        {users.length > 0 ? (
          users.map(({ userId, user: listUser }) => (
            <div
              key={userId}
              className={`flex items-center py-[20px] border-b border-b-gray-300 cursor-pointer hover:bg-green-200 ${
                messages?.receiver?.receiverId === listUser.receiverId ||
                selectedUser?.receiverId === listUser.receiverId
                  ? "bg-green-200"
                  : ""
              }`}
              onClick={() => handleUserClick(listUser)}
            >
              <div className="border border-black p-[4px] rounded-full overflow-hidden">
                <img src={userLogo} width={35} height={35} alt="userLogo" />
              </div>
              <div className="ml-6">
                <h3 className="text-lg font-semibold">{listUser?.fullName}</h3>
                <p className="text-sm text-gray-400 font-light">{listUser?.email}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-lg font-semibold mt-24">No Users Found</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
