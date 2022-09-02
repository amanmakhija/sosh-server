const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
    {
        trigger: {
            type: String,
            required: true
        },
        senderId: {
            type: String,
            required: true
        },
        message: {
            type: String
        },
        receiverId: {
            type: String,
            required: true
        },
        postId: {
            type: String
        }
    }
);

module.exports = mongoose.model("Notification", NotificationSchema);
