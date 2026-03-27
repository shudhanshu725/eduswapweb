import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: [(arr) => arr.length === 2, 'Chat must have exactly 2 participants'],
      required: true,
      index: true,
    },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 }, { unique: false });

export const Chat = mongoose.model('Chat', chatSchema);

