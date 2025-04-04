import userLogo from "../assets/user-solid.svg";
import tree from "../assets/tree.jpg";
import Input from "../components/Input";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Navigate } from "react-router-dom";
// const apiUrl = process.env.REACT_APP_API_URL || "https://chatting-app-ntgk.onrender.com";
const apiUrl = "https://chatting-app-ntgk.onrender.com";

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

  // Responsive UI states
  const [showSidebar, setShowSidebar] = useState(true);
  const [showUsersList, setShowUsersList] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size on mount and window resize
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // On mobile, hide both sidebars by default
      if (mobile) {
        setShowSidebar(false);
        setShowUsersList(false);
      } else {
        setShowSidebar(true);
        setShowUsersList(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
    console.log("Connecting to Socket.IO to:", apiUrl); // Debug log

    const newSocket = io(apiUrl, {
      auth: { token }, // Added token authentication
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // timeout: 5000,
      transports: ["websocket"],
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
      console.log("Cleaning up socket");
      newSocket.disconnect();
    };
  }, [user?.id, token]);

  // Connection status - preserved original styling
  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <div className="fixed top-0 left-0 w-full bg-red-500 text-white p-2 text-center z-50">
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

      // On mobile, hide sidebar after selecting a conversation
      if (isMobile) {
        setShowSidebar(false);
        setShowUsersList(false);
      }
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

      // On mobile, hide users list after selecting a user
      if (isMobile) {
        setShowSidebar(false);
        setShowUsersList(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      let conversationId = messages.conversationId;
      let isNewConversation = false;

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
        isNewConversation = true;
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

      // After successfully sending the message:
      if (isNewConversation) {
        // Add the new conversation to the conversations list
        setConversations((prevConversations) => [
          ...prevConversations,
          {
            conversationId: conversationId,
            user: {
              receiverId: selectedUser.receiverId,
              fullName: selectedUser.fullName,
              email: selectedUser.email,
            },
          },
        ]);
      }

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

  // Toggle sidebar visibility for mobile
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
    if (isMobile && !showSidebar) {
      setShowUsersList(false);
    }
  };

  // Toggle users list visibility for mobile
  const toggleUsersList = () => {
    setShowUsersList(!showUsersList);
    if (isMobile && !showUsersList) {
      setShowSidebar(false);
    }
  };

  return (
    <div className="relative">
      {renderConnectionStatus()}

      {/* Mobile Navigation Bar */}
      {isMobile && (
        <div className="fixed top-0 left-0 w-full bg-white shadow-md flex justify-between items-center p-3 z-40">
          <button
            onClick={toggleSidebar}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
          >
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
              <path d="M3 12h18M3 6h18M3 18h18"></path>
            </svg>
          </button>

          <div className="text-xl font-bold text-blue-600">Chat App</div>

          <button
            onClick={toggleUsersList}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
          >
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </button>
        </div>
      )}

      <div className="box-border w-screen flex relative">
        {/* Left Sidebar - Conversations */}
        <div
          className={`${
            showSidebar ? "translate-x-0" : "-translate-x-full"
          } transform transition-transform duration-300 ease-in-out fixed md:static top-0 left-0 z-30 md:z-0 h-screen w-full md:w-1/4 lg:w-1/4 bg-gradient-to-br from-slate-100 via-white to-blue-100 overflow-y-auto shadow-xl ${
            isMobile ? "pt-16" : ""
          }`}
        >
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          )}

          <div className="flex items-center my-5 md:my-6 mx-4 md:mx-8 space-x-4 md:space-x-6">
            <div
              className="border-3 border-blue-500 rounded-full overflow-hidden shadow-lg transition-transform hover:scale-105"
              style={{ width: "50px", height: "50px" }}
            >
              <img src={tree} alt="userLogo" className="w-full h-full object-cover" />
            </div>

            <div>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{user?.fullName}</p>
              <p className="text-sm md:text-md text-gray-600">My Account</p>
            </div>
          </div>

          <hr className="border-t-2 border-blue-200 mx-4 md:mx-8" />

          <div className="mx-4 md:mx-8 mt-5 md:mt-7">
            <div className="text-blue-600 text-lg font-bold mb-4">Messages</div>
            <div>
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading conversations...</div>
              ) : conversations.length > 0 ? (
                conversations.map(({ conversationId, user: conversationUser }) => (
                  <div
                    key={conversationId}
                    className={`flex items-center px-3 py-4 md:py-5 mb-2 border-b border-b-gray-300 cursor-pointer rounded-xl transition-all hover:bg-blue-100 hover:shadow-md ${
                      messages?.conversationId === conversationId ? "bg-blue-200 shadow-md" : ""
                    }`}
                    onClick={() => handleConversationClick(conversationId, conversationUser)}
                  >
                    <div className="border-3 border-blue-400 p-1 rounded-full overflow-hidden shadow-md">
                      <img
                        src={userLogo}
                        width={36}
                        height={36}
                        alt="userLogo"
                        className="rounded-full"
                      />
                    </div>
                    <div className="ml-4 md:ml-6">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900">
                        {conversationUser?.fullName}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600">{conversationUser?.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-lg font-semibold mt-12 md:mt-24 text-gray-500">
                  No Conversations
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Window - Middle */}
        <div
          className={`h-screen w-full md:w-1/2 lg:w-1/2 bg-white flex flex-col items-center shadow-inner ${
            isMobile ? "pt-16" : ""
          }`}
        >
          {(messages?.receiver?.fullName || selectedUser?.fullName) && (
            <div className="w-11/12 md:w-3/4 bg-gradient-to-r from-white to-blue-100 h-16 md:h-20 mt-2 md:mt-4 mb-2 md:mb-6 rounded-xl flex items-center px-4 md:px-8 shadow-lg">
              <div className="cursor-pointer">
                <img
                  src={userLogo}
                  alt="userLogo"
                  width={40}
                  height={40}
                  className="rounded-full border-3 border-blue-400 shadow-lg"
                />
              </div>
              <div className="ml-4 md:ml-6 mr-auto">
                <h3 className="text-lg md:text-xl font-bold text-gray-900">
                  {selectedUser?.fullName || messages?.receiver?.fullName}
                </h3>
                <p className="text-xs md:text-sm text-gray-600">
                  {selectedUser?.email || messages?.receiver?.email}
                </p>
              </div>
              <div className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors">
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

          <div className="h-[75%] w-full overflow-y-auto pr-2 md:pr-4 scrollbar-hide">
            <div className="p-4 md:p-8 lg:p-12">
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading messages...</div>
              ) : messages?.messages?.length > 0 ? (
                <>
                  {messages.messages.map(({ message, user: messageUser }, index) => (
                    <React.Fragment key={index}>
                      <div
                        className={`max-w-[70%] md:max-w-[60%] lg:max-w-[40%] rounded-2xl p-3 md:p-4 mb-3 md:mb-4 shadow-lg ${
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
                <div className="text-center text-lg font-semibold mt-12 md:mt-24 text-gray-500">
                  {messages?.receiver?.fullName || selectedUser?.fullName
                    ? "No messages yet. Start a conversation!"
                    : "Select a conversation or user to start chatting"}
                </div>
              )}
            </div>
          </div>

          {(messages?.receiver?.fullName || selectedUser?.fullName) && (
            <div className="p-3 md:p-6 w-full flex items-center space-x-2 md:space-x-4">
              <div
                className={`p-1 md:p-2 cursor-pointer rounded-full transition-colors ${
                  !message ? "text-gray-400 pointer-events-none" : "text-blue-600 hover:bg-blue-100"
                }`}
              >
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
                className="w-[80%] md:w-[75%]"
                inputClassName="p-3 md:p-4 border-3 border-blue-300 shadow-md rounded-full bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
              />
              <div
                className={`p-1 md:p-2 cursor-pointer rounded-full transition-all ${
                  !message
                    ? "text-gray-400 pointer-events-none"
                    : "text-blue-600 hover:bg-blue-100 hover:scale-110"
                }`}
                onClick={sendMessage}
              >
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
                  <path d="M10 14l11 -11"></path>
                  <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"></path>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Users List */}
        <div
          className={`${
            showUsersList ? "translate-x-0" : "translate-x-full"
          } transform transition-transform duration-300 ease-in-out fixed md:static top-0 right-0 z-30 md:z-0 h-screen w-full md:w-1/4 lg:w-1/4 bg-gradient-to-br from-slate-100 via-white to-green-100 px-4 md:px-6 py-8 md:py-16 overflow-scroll shadow-xl ${
            isMobile ? "pt-16" : ""
          }`}
        >
          {isMobile && (
            <button
              onClick={toggleUsersList}
              className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          )}

          <div className="text-blue-600 text-lg font-bold mb-4">People</div>
          {users.length > 0 ? (
            users.map(({ userId, user: listUser }) => (
              <div
                key={userId}
                className={`flex items-center py-4 md:py-5 px-3 mb-2 border-b border-b-gray-300 cursor-pointer hover:bg-green-100 rounded-xl transition-all hover:shadow-md ${
                  messages?.receiver?.receiverId === listUser.receiverId ||
                  selectedUser?.receiverId === listUser.receiverId
                    ? "bg-green-200 shadow-md"
                    : ""
                }`}
                onClick={() => handleUserClick(listUser)}
              >
                <div className="border-3 border-green-400 p-1 rounded-full overflow-hidden shadow-md">
                  <img
                    src={userLogo}
                    width={36}
                    height={36}
                    alt="userLogo"
                    className="rounded-full"
                  />
                </div>
                <div className="ml-4 md:ml-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">
                    {listUser?.fullName}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600">{listUser?.email}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-lg font-semibold mt-12 md:mt-24 text-gray-500">
              No Users Found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
