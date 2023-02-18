const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    members: {
      type: Array,
    },
    recentMessage: {
      conversationId: {
        type: String,
      },
      sender: {
        type: String,
      },
      text: {
        type: String,
      },
      messageCreatedAt: { type: Date}
    },
    notifications: {
      senderNotifications: {
        count: { type: Number },
        userId: { type: mongoose.Types.ObjectId, ref: "User" },
      },
      receiverNotifications: {
        count: { type: Number },
        userId: { type: mongoose.Types.ObjectId, ref: "User" },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
