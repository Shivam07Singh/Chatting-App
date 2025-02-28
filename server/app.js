const express = require("express");
const connectDB = require("./connection/db");
const Users = require("./models/Users");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Conversations = require('./models/Conversation');
const PORT = process.env.PORT || 8000;

//Middleware
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Connection to DB
connectDB();

//Routing
app.get("/", (req, res) => {
  res.send("Welcome");
});

app.post("/api/register", async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if ((!fullName, !email, !password)) {
      res.send(400).send("Fill all required feilds");
    } else {
      const isUserExist = await Users.findOne({ email: email });
      if (isUserExist) {
        res.status(400).send("User already exists");
      } else {
        const newUser = new Users({
          fullName,
          email,
        });
        bcryptjs.hash(password, 8, (err, hashedPassword) => {
          newUser.set("password", hashedPassword);
          newUser.save();
          next();
        });
        return res.status(201).send("User registerd succssfully");
      }
    }
  } catch (error) {
    console.log("Error:", error);
  }
});


//Login Authentication 
app.post("/api/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).send("Fill all required fields");
    } else {
      const user = await Users.findOne({ email });
      if (!user) {
        res.send("User email, or password is incorrect");
      } else {
        const validateUser = await bcryptjs.compare(password, user.password);
        if (!validateUser) {
          res.send("User email, or password is incorrect");
        } else {
          const payload = {
            userId: user._id,
            email: user.email,
          };
          const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "Shivam@project";

          jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: 84600 }, async (err, token) => {
            await Users.updateOne(
              { _id: user._id },
              {
                $set: { token: token },
              }
            );
            user.save();
            next();
          });
          res.status(200).json({ user:{email:user.email, fullName:user.fullName}, token: user.token });
        }
      }
    }
  } catch (error) {
    console.log("Error:", error);
  }
});

app.post('/api/conversation', async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const newConversation = new Conversations({members:{senderId, receiverId}})
    await newConversation.save()
    res.status(200).send('Conversation created sucessfully')
  } catch (error) {
    console.log("Error:", error )
  }
})

//Creating the PORT
app.listen(PORT, () => {
  console.log("Server started on port : " + PORT);
});
