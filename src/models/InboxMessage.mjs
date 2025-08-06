import mongoose from "mongoose";

const InboxMessageSchema = new mongoose.Schema({
  conversation: { type: String, required: true },

  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  senderName: { type: String },

  content: { type: String, required: true },

  createdAt: { type: Date, default: Date.now }
}, { collection: "messages" });

export default mongoose.model("InboxMessage", InboxMessageSchema);
