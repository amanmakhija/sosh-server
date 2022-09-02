const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      max: 500,
    },
    img: {
      type: String,
    },
    likes: {
      type: Array,
      default: [],
    },
    location: {
      type: String,
    },
    feeling: {
      name: {
        type: String,
      },
      emoji: {
        type: String,
      }
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostSchema);
