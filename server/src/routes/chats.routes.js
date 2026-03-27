import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id }).sort({ lastMessageAt: -1 }).lean();
  return res.json({ items: chats });
});

router.post('/start', requireAuth, async (req, res) => {
  const { peerId } = req.body || {};
  if (!peerId || !mongoose.isValidObjectId(peerId)) {
    return res.status(400).json({ message: 'Valid peerId is required' });
  }
  if (String(peerId) === String(req.user._id)) {
    return res.status(400).json({ message: 'Cannot chat with self' });
  }

  const sorted = [String(req.user._id), String(peerId)].sort();
  let chat = await Chat.findOne({ participants: { $all: sorted, $size: 2 } });
  if (!chat) {
    chat = await Chat.create({ participants: sorted });
  }
  return res.status(201).json({ chat });
});

router.get('/:chatId/messages', requireAuth, async (req, res) => {
  const { chatId } = req.params;
  if (!mongoose.isValidObjectId(chatId)) return res.status(400).json({ message: 'Invalid chat id' });

  const chat = await Chat.findById(chatId).lean();
  if (!chat || !chat.participants.some((id) => String(id) === String(req.user._id))) {
    return res.status(404).json({ message: 'Chat not found' });
  }

  const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean();
  return res.json({ items: messages });
});

router.post('/:chatId/messages', requireAuth, async (req, res) => {
  const { chatId } = req.params;
  const text = String(req.body?.text || '').trim();
  if (!mongoose.isValidObjectId(chatId)) return res.status(400).json({ message: 'Invalid chat id' });
  if (!text) return res.status(400).json({ message: 'Message text is required' });

  const chat = await Chat.findById(chatId);
  if (!chat || !chat.participants.some((id) => String(id) === String(req.user._id))) {
    return res.status(404).json({ message: 'Chat not found' });
  }

  const message = await Message.create({
    chatId,
    senderId: req.user._id,
    text,
    readBy: [req.user._id],
  });

  chat.lastMessageAt = new Date();
  await chat.save();

  return res.status(201).json({ message });
});

export default router;
