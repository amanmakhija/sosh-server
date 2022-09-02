const mongoose = require("mongoose");

const FriendRequestSchema = new mongoose.Schema(
    {
        senderId: {
            type: String
        },
        trigger: {
            type: String
        },
        receiverId: {
            type: String
        }
    }
);

module.exports = mongoose.model("FriendRequest", FriendRequestSchema);
