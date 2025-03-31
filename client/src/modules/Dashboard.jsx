import userLogo from "../assets/user-solid.svg";
import tree from "../assets/tree.jpg";
import Input from "../components/Input";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Navigate } from "react-router-dom";
const apiUrl = process.env.REACT_APP_API_URL || "https://chatting-app-ntgk.onrender.com";

const Dashboard = () => {
  // Authentication check - preserved original logic
  const token = localStorage.getItem("user:token");
  if (!token) {
    return <Navigate to="/users/sign_in" />;
  }

  // State initialization - preserved original structure
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user:details")));
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom - preserved original implementation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages?.messages]);

  // Token verification - new security addition
  useEffect(() => {
    const verifyToken = async () => {
      try {
        await axios.get(`${apiUrl}/api/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("user:token");
          localStorage.removeItem("user:details");
          window.location.href = "/users/sign_in";
        }
      }
    };
    verifyToken();
  }, [token]);

  // Socket connection - preserved original structure with security enhancement
  useEffect(() => {
    console.log("Connecting to Socket.IO at:", apiUrl); // Debug log

    const newSocket = io(apiUrl, {
      auth: { token }, // Added token authentication
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // timeout: 5000,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connected!");
      setIsConnected(true);
      // setConnectionError(null);
      if (user?.id) {
        newSocket.emit("addUser", user.id);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
      // setConnectionError("Could not connect to chat server. Retrying...");

      // Auto-retry after delay
      setTimeout(() => newSocket.connect(), 2000); 
    });

    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        newSocket.connect();
      }
    });

    newSocket.on("getMessage", (data) => {
      // Avoid adding your own messages twice
      if (data.senderId === user?.id) return;

      setMessages((prev) => {
        // const existingMessages = prev.messages || [];
        return {
          ...prev,
          messages: [
            ...(prev.messages || []),
            {
              user: data.user,
              message: data.message,
              timestamp: data.timestamp || new Date().toISOString(),
            },
          ],
        };
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id, token]);

  // Connection status - preserved original styling
  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <div className="fixed top-0 left-0 w-full bg-red-500 text-white p-2 text-center">
          Disconnected from chat. Reconnecting...
        </div>
      );
    }
    return null;
  };

  // Data fetching - preserved original structure with auth headers
  const fetchConversations = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data } = await axios.get(`${apiUrl}/api/conversation/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("user:token");
        localStorage.removeItem("user:details");
        window.location.href = "/users/sign_in";
      }
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!user?.id) return;

    try {
      const { data } = await axios.get(`${apiUrl}/api/users/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("user:token");
        localStorage.removeItem("user:details");
        window.location.href = "/users/sign_in";
      }
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, [user?.id, token]);

  // Conversation and message handling - preserved original logic
  const handleConversationClick = async (conversationId, receiverUser) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${apiUrl}/api/message/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages({
        messages: data,
        receiver: receiverUser,
        conversationId: conversationId,
      });
      setSelectedUser(null);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("user:token");
        localStorage.removeItem("user:details");
        window.location.href = "/users/sign_in";
      }
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (receiverUser) => {
    const existingConversation = conversations.find(
      (conv) => conv.user.receiverId === receiverUser.receiverId
    );

    if (existingConversation) {
      handleConversationClick(existingConversation.conversationId, existingConversation.user);
    } else {
      setSelectedUser(receiverUser);
      setMessages({
        messages: [],
        receiver: receiverUser,
        conversationId: null,
      });
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      let conversationId = messages.conversationId;

      if (!conversationId && selectedUser) {
        const { data } = await axios.post(
          `${apiUrl}/api/conversation`,
          {
            senderId: user?.id,
            receiverId: selectedUser.receiverId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        conversationId = data.conversation._id;
      }

      const messageData = {
        senderId: user?.id,
        message,
        receiverId: selectedUser?.receiverId || messages?.receiver?.receiverId,
        conversationId,
        timestamp: new Date().toISOString(),
      };

      socket?.emit("sendMessage", messageData);

      await axios.post(
        `${apiUrl}/api/message`,
        {
          conversationId,
          senderId: user?.id,
          message,
          receiverId: selectedUser?.receiverId || messages?.receiver?.receiverId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => ({
        ...prev,
        conversationId: conversationId,
        messages: [
          ...(prev.messages || []),
          {
            user: { id: user?.id, fullName: user?.fullName, email: user?.email },
            message,
            timestamp: new Date().toISOString(),
          },
        ],
      }));

      setMessage("");
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("user:token");
        localStorage.removeItem("user:details");
        window.location.href = "/users/sign_in";
      }
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // PRESERVED ORIGINAL JSX STRUCTURE AND STYLING
  return (
    <div>
      {renderConnectionStatus()}
      <div className="box-border w-screen flex">
        {/* Left Sidebar - Conversations - Preserved original styling */}
        <div className="h-screen w-[25%] bg-gradient-to-br from-slate-100 via-white to-blue-100 overflow-y-auto shadow-xl">
          <div className="flex items-center my-[20px] mx-14 space-x-6">
            <div
              className="border-3 border-blue-500 rounded-full overflow-hidden shadow-lg transition-transform hover:scale-105"
              style={{ width: "60px", height: "60px" }}
            >
              <img src={tree} alt="userLogo" className="w-full h-full object-cover" />
            </div>

            <div>
              <p className="text-2xl font-bold text-gray-900">{user?.fullName}</p>
              <p className="text-md text-gray-600">My Account</p>
            </div>
          </div>
          <hr className="border-t-2 border-blue-200 mx-10" />
          <div className="mx-14 mt-7">
            <div className="text-blue-600 text-lg font-bold mb-4">Messages</div>
            <div>
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading conversations...</div>
              ) : conversations.length > 0 ? (
                conversations.map(({ conversationId, user: conversationUser }) => (
                  <div
                    key={conversationId}
                    className={`flex items-center px-[5px] py-[20px] mb-[5px] border-b border-b-gray-300 cursor-pointer rounded-xl transition-all hover:bg-blue-100 hover:shadow-md ${
                      messages?.conversationId === conversationId ? "bg-blue-200 shadow-md" : ""
                    }`}
                    onClick={() => handleConversationClick(conversationId, conversationUser)}
                  >
                    <div className="border-3 border-blue-400 p-[2px] rounded-full overflow-hidden shadow-md">
                      <img
                        src={userLogo}
                        width={40}
                        height={40}
                        alt="userLogo"
                        className="rounded-full"
                      />
                    </div>
                    <div className="ml-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {conversationUser?.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">{conversationUser?.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-lg font-semibold mt-24 text-gray-500">
                  No Conversations
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Window - Middle - Preserved original styling */}
        <div className="h-screen w-[50%] bg-white flex flex-col items-center shadow-inner">
          {(messages?.receiver?.fullName || selectedUser?.fullName) && (
            <div className="w-[75%] bg-gradient-to-r from-white to-blue-100 h-[90px] mt-4 mb-6 rounded-xl flex items-center px-14 shadow-lg">
              <div className="cursor-pointer">
                <img
                  src={userLogo}
                  alt="userLogo"
                  width={50}
                  height={50}
                  className="rounded-full border-3 border-blue-400 shadow-lg"
                />
              </div>
              <div className="ml-6 mr-auto">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedUser?.fullName || messages?.receiver?.fullName}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedUser?.email || messages?.receiver?.email}
                </p>
              </div>
              <div className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
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

          <div className="h-[75%] w-full overflow-y-auto pr-4 scrollbar-hide">
            <div className="p-12">
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading messages...</div>
              ) : messages?.messages?.length > 0 ? (
                <>
                  {messages.messages.map(({ message, user: messageUser }, index) => (
                    <React.Fragment key={index}>
                      <div
                        className={`max-w-[40%] rounded-2xl p-4 mb-4 shadow-lg ${
                          messageUser?.id === user?.id
                            ? "bg-blue-600 rounded-bl-none ml-auto text-white"
                            : "bg-slate-200 rounded-br-none text-gray-900"
                        }`}
                      >
                        {message}
                      </div>
                    </React.Fragment>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center text-lg font-semibold mt-24 text-gray-500">
                  {messages?.receiver?.fullName || selectedUser?.fullName
                    ? "No messages yet. Start a conversation!"
                    : "Select a conversation or user to start chatting"}
                </div>
              )}
            </div>
          </div>

          {(messages?.receiver?.fullName || selectedUser?.fullName) && (
            <div className="p-8 w-full flex items-center space-x-4">
              <div
                className={`p-2 cursor-pointer rounded-full transition-colors ${
                  !message ? "text-gray-400 pointer-events-none" : "text-blue-600 hover:bg-blue-100"
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
                inputClassName="p-4 border-3 border-blue-300 shadow-md rounded-full bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
              />
              <div
                className={`p-2 cursor-pointer rounded-full transition-all ${
                  !message
                    ? "text-gray-400 pointer-events-none"
                    : "text-blue-600 hover:bg-blue-100 hover:scale-110"
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

        {/* Right Sidebar - Users List - Preserved original styling */}
        <div className="min-h-screen w-[25%] bg-gradient-to-br from-slate-100 via-white to-green-100 px-8 py-16 overflow-scroll shadow-xl">
          <div className="text-blue-600 text-lg font-bold mb-4">People</div>
          {users.length > 0 ? (
            users.map(({ userId, user: listUser }) => (
              <div
                key={userId}
                className={`flex items-center py-[20px] px-[5px] mb-[5px] border-b border-b-gray-300 cursor-pointer hover:bg-green-100 rounded-xl transition-all hover:shadow-md ${
                  messages?.receiver?.receiverId === listUser.receiverId ||
                  selectedUser?.receiverId === listUser.receiverId
                    ? "bg-green-200 shadow-md"
                    : ""
                }`}
                onClick={() => handleUserClick(listUser)}
              >
                <div className="border-3 border-green-400 p-[2px] rounded-full overflow-hidden shadow-md">
                  <img
                    src={userLogo}
                    width={40}
                    height={40}
                    alt="userLogo"
                    className="rounded-full"
                  />
                </div>
                <div className="ml-6">
                  <h3 className="text-lg font-semibold text-gray-900">{listUser?.fullName}</h3>
                  <p className="text-sm text-gray-600">{listUser?.email}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-lg font-semibold mt-24 text-gray-500">
              No Users Found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
