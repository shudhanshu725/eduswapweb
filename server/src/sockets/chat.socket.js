import mongoose from 'mongoose';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { verifyAccessToken } from '../utils/jwt.js';

export function configureChatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).lean();
      if (!user) return next(new Error('Unauthorized'));
      socket.user = user;
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('chat:join', async ({ chatId }) => {
      if (!chatId || !mongoose.isValidObjectId(chatId)) return;
      const chat = await Chat.findById(chatId).lean();
      if (!chat) return;
      const allowed = chat.participants.some((id) => String(id) === String(socket.user._id));
      if (!allowed) return;
      socket.join(`chat:${chatId}`);
    });

    socket.on('chat:message', async ({ chatId, text }) => {
      const cleanText = String(text || '').trim();
      if (!chatId || !mongoose.isValidObjectId(chatId) || !cleanText) return;

      const chat = await Chat.findById(chatId);
      if (!chat) return;
      const allowed = chat.participants.some((id) => String(id) === String(socket.user._id));
      if (!allowed) return;

      const message = await Message.create({
        chatId,
        senderId: socket.user._id,
        text: cleanText,
        readBy: [socket.user._id],
      });

      chat.lastMessageAt = new Date();
      await chat.save();

      io.to(`chat:${chatId}`).emit('chat:message', {
        id: message._id,
        chatId,
        senderId: socket.user._id,
        text: message.text,
        createdAt: message.createdAt,
      });
    });
  });
}

