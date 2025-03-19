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
app.use(cors());

// ✅ DB Connection
connectDB();

app.get("/", (req, res) => {
  res.send("Welcome");
});

// ✅ Registration Route
app.post("/api/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // ✅ Fix: Correct `if` condition
    if (!fullName || !email || !password) {
      return res.status(400).send("Fill all required fields");
    }

    const isUserExist = await Users.findOne({ email });
    if (isUserExist) {
      return res.status(400).send("User already exists");
    }

    const newUser = new Users({ fullName, email });

    bcryptjs.hash(password, 8, async (err, hashedPassword) => {
      if (err) {
        return res.status(500).send("Error hashing password");
      }
      newUser.set("password", hashedPassword);
      await newUser.save();
      return res.status(201).send("User registered successfully");
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).send("Internal server error");
  }
});

// ✅ Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Fill all required fields" });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User email or password is incorrect" });
    }

    const validateUser = await bcryptjs.compare(password, user.password);
    if (!validateUser) {
      return res.status(401).json({ message: "User email or password is incorrect" });
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
      });
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Create Conversation Route
app.post("/api/conversation", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "Missing sender or receiver ID" });
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
        const user = await Users.findById(receiverId);
        return {
          user: { email: user.email, fullName: user.fullName },
          conversationId: conversation._id,
        };
      })
    );

    return res.status(200).json(conversationUserData);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ error: "An error occurred" });
  }
});

// ✅ Send Message Route
app.post("/api/message", async (req, res) => {
  try {
    const { conversationId, senderId, message, receiverId } = req.body;

    if (!senderId || !message) {
      return res.status(400).send("Please fill all required fields");
    }

    if (!conversationId && receiverId) {
      const newConversation = new Conversations({ members: [senderId, receiverId] });
      await newConversation.save();
      const newMessage = new Messages({ conversationId: newConversation._id, senderId, message });
      await newMessage.save();
      return res.status(200).send("Message sent successfully");
    }

    const newMessage = new Messages({ conversationId, senderId, message });
    await newMessage.save();

    return res.status(200).send("Message sent successfully");
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).send("Failed to send message");
  }
});

// ✅ Get Messages by Conversation ID
app.get("/api/message/:conversationId", async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    console.log("Fetching messages for conversationId:", conversationId);

    if (!conversationId) return res.status(200).json([]);

    const messages = await Messages.find({ conversationId });
    console.log("Messages fetched from DB:", messages);

    const messageUserData = await Promise.all(
      messages.map(async (message) => {
        const user = await Users.findById(message.senderId);
        return {
          user: { id: user._id, email: user.email, fullName: user.fullName },
          message: message.message,
        };
      })
    );

    console.log("Final message data:", messageUserData);

    res.status(200).json(messageUserData);
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});


// ✅ Get All Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await Users.find();
    const userData = await Promise.all(
      users.map((user) => ({
        user: { email: user.email, fullName: user.fullName },
        userId: user._id,
      }))
    );

    return res.status(200).json(userData);
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: "Failed to retrieve users" });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server started on port: ${PORT}`);
});
