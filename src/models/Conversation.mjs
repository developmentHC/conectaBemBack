import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
  conversation: { type: String, unique: true, index: true, required: true },

  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }
  ],

  lastMessage: {
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: Date
  }
}, {
  collection: "conversations",
  timestamps: { createdAt: true, updatedAt: true }
});

export default mongoose.model("Conversation", ConversationSchema);
