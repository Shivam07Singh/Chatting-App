const http = require("http");
const express = require("express");
const connectDB = require("./connection/db");
const cors = require("cors");
const Users = require("./models/Users");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Conversations = require("./models/Conversation");
const Messages = require("./models/Messages");
const PORT = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: ["https://chitchat108.netlify.app"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ✅ DB Connection
connectDB();

app.get("/api/verify", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    res.status(200).json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

// app.get("/", (req, res) => {
//   res.send("Welcome");
// });

//Socket.io
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "https://chitchat108.netlify.app",
    methods: ["GET", "POST"],
  },
});

let users = [];
io.on("connection", (socket) => {
  console.log("User Connected", socket.id);
  socket.on("addUser", (userId) => {
    const isUserExist = users.find((user) => user.userId === userId);
    if (!isUserExist) {
      const user = { userId, socketId: socket.id };
      users.push(user);
    }
    io.emit("getUsers", users);
  });

  socket.on("sendMessage", async ({ senderId, receiverId, message, conversationId, timestamp }) => {
    try {
      const user = await Users.findById(senderId);
      if (!user) {
        console.error("Sender not found");
        return;
      }

      const messagePayload = {
        senderId,
        message,
        conversationId,
        receiverId,
        timestamp,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
        },
      };

      const receiver = users.find((user) => user.userId === receiverId);
      if (receiver) {
        socket.to(receiver.socketId).emit("getMessage", messagePayload);
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
    }
  });

  socket.on("disconnect", () => {
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit("getUsers", users);
  });
  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });
});

// ✅ Enhanced Registration Route
app.post("/api/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const isUserExist = await Users.findOne({ email });
    if (isUserExist) {
      return res.status(409).json({ message: "User already exists" });
    }

    const newUser = new Users({ fullName, email });

    bcryptjs.hash(password, 8, async (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: "Error hashing password" });
      }
      newUser.set("password", hashedPassword);

      const payload = { userId: newUser._id, email: newUser.email };
      const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "Shivam@project";

      jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: 84600 }, async (err, token) => {
        if (err) {
          return res.status(500).json({ message: "Error generating token" });
        }

        newUser.token = token;
        await newUser.save();

        return res.status(201).json({
          user: { id: newUser._id, email: newUser.email, fullName: newUser.fullName },
          token: token,
          message: "User registered successfully",
        });
      });
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Login Route (optimized error messages)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const validateUser = await bcryptjs.compare(password, user.password);
    if (!validateUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = { userId: user._id, email: user.email };
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "Shivam@project";

    jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: 84600 }, async (err, token) => {
      if (err) {
        return res.status(500).json({ message: "Error generating token" });
      }

      user.token = token;
      await user.save();

      return res.status(200).json({
        user: { id: user._id, email: user.email, fullName: user.fullName },
        token: token,
        message: "Login successful",
      });
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Create Conversation Route
app.post("/api/conversation", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "Missing sender or receiver ID" });
    }

    const existingConversation = await Conversations.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (existingConversation) {
      return res.status(200).json({
        message: "Conversation already exists",
        conversation: existingConversation,
      });
    }

    const newConversation = new Conversations({ members: [senderId, receiverId] });
    const savedConversation = await newConversation.save();

    return res.status(201).json({
      message: "Conversation created successfully",
      conversation: savedConversation,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: "Failed to create conversation", details: error.message });
  }
});

// ✅ Get Conversations by User ID
app.get("/api/conversation/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversations = await Conversations.find({ members: { $in: [userId] } });

    const conversationUserData = await Promise.all(
      conversations.map(async (conversation) => {
        const receiverId = conversation.members.find((member) => member !== userId);
        if (!receiverId) return null;

        const user = await Users.findById(receiverId);
        if (!user) return null;

        return {
          user: {
            receiverId: user._id,
            email: user.email,
            fullName: user.fullName,
          },
          conversationId: conversation._id,
        };
      })
    );

    const filteredData = conversationUserData.filter((data) => data !== null);
    return res.status(200).json(filteredData);
  } catch (error) {
    console.error("Error fetching conversations:", error.message);
    return res.status(500).json({ error: "An error occurred" });
  }
});

// ✅ Send Message Route
app.post("/api/message", async (req, res) => {
  try {
    const { conversationId, senderId, message, receiverId } = req.body;

    if (!senderId || !message) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    let existingConversation = null;

    if (conversationId) {
      existingConversation = await Conversations.findById(conversationId);
    }

    if (!existingConversation && receiverId) {
      existingConversation = await Conversations.findOne({
        members: { $all: [senderId, receiverId] },
      });

      if (!existingConversation) {
        existingConversation = new Conversations({ members: [senderId, receiverId] });
        await existingConversation.save();
        console.log("New conversation created:", existingConversation._id);
      }
    }

    if (!existingConversation) {
      return res.status(400).json({ message: "No valid conversation found or created" });
    }

    const newMessage = new Messages({
      conversationId: existingConversation._id,
      senderId,
      message,
    });

    await newMessage.save();

    return res.status(200).json({
      message: "Message sent successfully",
      conversationId: existingConversation._id,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ message: "Failed to send message" });
  }
});

// ✅ Get Messages by Conversation ID
app.get("/api/message/:conversationId", async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const messages = await Messages.find({ conversationId });

    const messageUserData = await Promise.all(
      messages.map(async (message) => {
        const user = await Users.findById(message.senderId);
        return {
          user: { id: user._id, email: user.email, fullName: user.fullName },
          message: message.message,
          timestamp: message.createdAt,
        };
      })
    );

    return res.status(200).json(messageUserData);
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// ✅ Get All Users
app.get("/api/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const users = await Users.find({ _id: { $ne: userId } });
    const userData = Promise.all(
      users.map(async (user) => {
        return {
          user: {
            email: user.email,
            fullName: user.fullName,
            receiverId: user._id,
          },
          userId: user._id,
        };
      })
    );

    return res.status(200).json(await userData);
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ message: "Failed to retrieve users" });
  }
});

// ✅ Start Server
server.listen(PORT, () => {
  console.log(`Server started on port: ${PORT}`);
});
