const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const io = require("socket.io")(8900, {
  cors: {
    origin: "http://localhost:3000"
  }
});

//Models
const Conversation = require("./models/Conversation");
const FR = require("./models/FriendRequest");
const Message = require("./models/Message");
const Notification = require("./models/Notification");
const Post = require("./models/Post");
const User = require("./models/User");

dotenv.config();

mongoose.connect(
  process.env.DATABASE_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to MongoDB");
  }
);
app.use("/images", express.static(path.join(__dirname, "public/images")));

//middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json("File uploded successfully");
  } catch (error) {
    console.error(error);
  }
});

///Routes
app.get("/", (req, res) => {
  res.send("Server is running");
});

//REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    //generate new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    //create new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });

    //save user and respond
    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err)
  }
});

//LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    !user && res.status(404).json("user not found");

    const validPassword = await bcrypt.compare(req.body.password, user.password)
    !validPassword && res.status(400).json("wrong password")

    res.status(200).json(user)
  } catch (err) {
    res.status(500).json(err)
  }
});

//New Conversation
app.post("/api/conversations", async (req, res) => {
  const newConversation = new Conversation({
    members: [req.body.senderId, req.body.receiverId]
  });

  try {
    const savedConversation = await newConversation.save();
    res.status(200).json(savedConversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Get Conversation of a User
app.get("/api/conversations/:userId", async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.params.userId] }
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Get Conversation includes two userId
app.get("/api/conversations/find/:firstUserId/:secondUserId", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] }
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Add FR Notification
app.post("/api/friendRequests", async (req, res) => {
  const newFR = new FR(req.body);

  try {
    const savedFR = await newFR.save();
    res.status(200).json(savedFR);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Get FR Notification
app.get("/api/friendRequests/:receiverId", async (req, res) => {
  try {
    const newFR = await FR.find({
      receiverId: req.params.receiverId
    });
    res.status(200).json(newFR);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Add Message
app.post("/api/messages", async (req, res) => {
  const newMessage = new Message(req.body);

  try {
    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Get Message
app.get("/api/messages/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Delete Message
app.put("/api/messages/:conversationId/:userId", async (req, res) => {
  try {
    const message = await Message.findById(req.params.conversationId);
    if (message.sender === req.params.userId) {
      await message.updateOne({ $set: req.body });
      res.status(200).json("Message Deleted");
    } else {
      res.status(403).json("Message can only be deleted by it's owner only")
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//Add Notification
app.post("/api/notifications", async (req, res) => {
  if (req.body.senderId !== req.body.receiverId) {
    const newNotification = new Notification(req.body);

    try {
      const savedNotification = await newNotification.save();
      res.status(200).json(savedNotification);
    } catch (err) {
      res.status(500).json(err);
    }
  }
});

//Get Notification
app.get("/api/notifications/:receiverId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiverId: req.params.receiverId
    });
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json(err);
  }
});

//create a post
app.post("/api/posts", async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

//update a post
app.put("/api/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.updateOne({ $set: req.body });
      res.status(200).json("the post has been updated");
    } else {
      res.status(403).json("you can update only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//delete a post
app.delete("/api/posts/:id/:userId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.params.userId) {
      await post.deleteOne();
      res.status(200).json("the post has been deleted");
    } else {
      res.status(403).json("you can delete only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//like a post
app.put("/api/posts/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.likes.includes(req.body.userId)) {
      res.status(403).json("The post has already been liked");
    } else {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json("The post has been liked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//dislike a post
app.put("/api/posts/:id/dislike", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.likes.includes(req.body.userId)) {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("The post has been disliked");
    } else {
      res.status(403).json("The post has already been disliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//get a post
app.get("/api/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get timeline posts
app.get("/api/posts/timeline/:userId", async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);
    const userPosts = await Post.find({ userId: currentUser._id });
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    res.status(200).json(userPosts.concat(...friendPosts));
  } catch (err) {
    res.status(500).json(err);
  }
});

//get user's all posts
app.get("/api/posts/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const posts = await Post.find({ userId: user._id });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

//update user
app.put("/api/users/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    try {
      const user = await User.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      });
      res.status(200).json("Account has been updated");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can update only your account!");
  }
});

//delete user
app.delete("/api/users/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("Account has been deleted");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can delete only your account!");
  }
});

//get a user
app.get("/api/users", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username: username });
    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get friends
app.get("/api/users/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await Promise.all(
      user.followings.map((friendId) => {
        return User.findById(friendId);
      })
    );
    let friendList = [];
    friends.map((friend) => {
      const { _id, username, profilePicture } = friend;
      friendList.push({ _id, username, profilePicture });
    });
    res.status(200).json(friendList)
  } catch (err) {
    res.status(500).json(err);
  }
});

//follow a user
app.put("/api/users/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (!user.followers.includes(req.body.userId)) {
        await user.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        res.status(200).json("user has been followed");
      } else {
        res.status(403).json("you allready follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant follow yourself");
  }
});

//unfollow a user
app.put("/api/users/:id/unfollow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (user.followers.includes(req.body.userId)) {
        await user.updateOne({ $pull: { followers: req.body.userId } });
        await currentUser.updateOne({ $pull: { followings: req.params.id } });
        res.status(200).json("user has been unfollowed");
      } else {
        res.status(403).json("you dont follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant unfollow yourself");
  }
});

app.listen(process.env.PORT || 8800, () => {
  console.log("Backend server is running!");
});

///Socket
let users = [];

const addUser = (userId, socketId) => {
  !users.some(user => user.userId === userId) &&
    users.push({ userId, socketId });
}

const removeUser = (socketId) => {
  users = users.filter(user => user.socketId !== socketId);
}

const getUser = (userId) => {
  return users.find(user => user.userId === userId);
}

io.on("connection", (socket) => {
  //When Connected
  console.log("User Connected");

  //take  userId and socketId from user
  socket.on("addUser", userId => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //Send and Get Message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);

    io.to(user.socketId).emit("getMessage", {
      senderId,
      text
    });
  });

  //When Disconnected
  socket.on("disconnect", () => {
    console.log("User Disconnected");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});