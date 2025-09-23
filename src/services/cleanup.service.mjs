import User from '../models/User.mjs';
import Appointment from '../models/Appointment.mjs';
import Conversation from '../models/Conversation.mjs';
import ConversationMember from '../models/ConversationMember.mjs';
import InboxMessage from '../models/InboxMessage.mjs';

export async function clearDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Appointment.deleteMany({}),
    Conversation.deleteMany({}),
    ConversationMember.deleteMany({}),
    InboxMessage.deleteMany({})
  ]);
}