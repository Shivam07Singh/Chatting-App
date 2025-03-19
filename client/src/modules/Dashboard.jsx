import React, { useEffect, useState } from "react";
import axios from "axios";
import userLogo from "../assets/user-solid.svg";
import tree from "../assets/tree.jpg";
import Input from "../components/Input";

const Dashboard = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user:details")));
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user:details"));

    const fetchConversations = async () => {
      if (!loggedInUser?.id) return; // ✅ Prevents API call if id is undefined

      try {
        const { data } = await axios.get(
          `http://localhost:8000/api/conversation/${loggedInUser.id}`
        );
        console.log("Conversations =>", data);

        setConversations(data);
      } catch (error) {
        console.error("Error fetching conversations:", error.response?.data || error.message);
      }
    };

    fetchConversations();
  }, []);

  // ✅ Fixed `fetchMessages` function
  const fetchMessages = async (conversationId, user) => {
    console.log("User=>", user)
    try {
      console.log("Fetching messages for conversationId:", conversationId);
      const { data } = await axios.get(`http://localhost:8000/api/message/${conversationId}`);
      console.log("Fetched Messages:", data);
      setMessages({ messages: data, receiver: user,conversationId });
    } catch (error) {
      console.error("Error fetching messages:", error.message);
    }
  };

  const sendMessage = async () => {
    if (!message) return;

    try {
      const { data } = await axios.post(`http://localhost:8000/api/message`, {
        conversationId: messages?.conversationId, // ✅ Pass existing conversationId
        senderId: user?.id,
        message,
        receiverId: messages?.receiver?.receiverId,
      });

      console.log("resData =>", data);

      setMessages((prev) => ({
        ...prev,
        conversationId: data.conversationId, // ✅ Set new conversationId if created
        messages: [
          ...(prev.messages || []),
          {
            user: { id: user?.id, fullName: user?.fullName, email: user?.email },
            message,
          },
        ],
      }));

      // ✅ Clear input field after sending message
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
    }
  };





  return (
    <div className="box-border w-screen flex">
      {/* Left Sidebar */}
      <div className="h-screen w-[25%] bg-gray-100">
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
            {/* ✅ Proper rendering for conversations */}
            {conversations.length > 0 ? (
              conversations.map(({ conversationId, user }) => (
                <div
                  key={conversationId}
                  className="flex items-center py-[20px] border-b border-b-gray-300 cursor-pointer"
                  onClick={() => fetchMessages(conversationId, user)}
                >
                  <div className="border border-black p-[4px] rounded-full overflow-hidden">
                    <img src={userLogo} width={35} height={35} alt="userLogo" />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-semibold">{user?.fullName}</h3>
                    <p className="text-sm text-gray-400 font-light">{user?.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-lg font-semibold mt-24">No Conversations</div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="h-screen w-[50%] bg-white flex flex-col items-center">
        {/* Header */}
        {messages?.receiver?.fullName && (
          <div className="w-[75%] bg-gray-100 h-[80px] mt-4 mb-6 rounded-full flex items-center px-14">
            <div className="cursor-pointer">
              <img src={userLogo} alt="userLogo" width={40} height={40} />
            </div>
            <div className="ml-6 mr-auto">
              <h3 className="text-lg">{messages?.receiver?.fullName}</h3>
              <p className="text-sm text-gray-400 font-light">{messages?.receiver?.email}</p>
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

        {/* Messages */}
        <div className="h-[75%] w-full overflow-y-scroll !scrollbar-hide shadow-sm pr-4">
          <div className="p-12">
            {/* ✅ Render messages */}
            {messages?.messages?.length > 0 ? (
              messages.messages.map(({ message, user: { id } }, index) => (
                <div
                  key={index}
                  className={`max-w-[40%] rounded-b-xl p-4 mb-4 ${
                    id === user?.id
                      ? "bg-blue-400 rounded-tl-xl ml-auto text-white"
                      : "bg-gray-200 rounded-tr-xl"
                  }`}
                >
                  {message}
                </div>
              ))
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No Messages or No Conversation Selected
              </div>
            )}
            
          </div>
        </div>

        {/* Input */}
        {messages?.receiver?.fullName && (
          <div className="p-8 w-full flex items-center">
            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
              onClick={() => sendMessage()}
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
              className="w-[75%]"
              inputClassName="p-4 border border-gray-300 shadow-md !rounded-full bg-light focus:ring-0 focus:border-blue-400 outline-none"
            />
            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
              onClick={() => sendMessage()}
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

      {/* Right Sidebar */}
      <div className="min-h-screen w-[25%] md:w-1/4 bg-green-100"></div>
    </div>
  );
};

export default Dashboard;
