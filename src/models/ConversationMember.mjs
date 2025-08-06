import mongoose from "mongoose";

const ConversationMemberSchema = new mongoose.Schema({
  conversation: { type: String, index: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  unreadCount: { type: Number, default: 0 },
  lastReadMessageId: { type: mongoose.Schema.Types.ObjectId, ref: "InboxMessage", default: null }
}, {
  collection: "conversation_members",
  timestamps: true
});

ConversationMemberSchema.index({ conversation: 1, user: 1 }, { unique: true });

export default mongoose.model("ConversationMember", ConversationMemberSchema);
