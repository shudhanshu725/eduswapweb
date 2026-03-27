import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import { Listing } from '../models/Listing.js';

const router = Router();

router.get('/', async (req, res) => {
  const { type, status = 'available', search = '' } = req.query;
  const query = {};

  if (type) query.type = String(type);
  if (status) query.status = String(status);
  if (search) {
    query.$or = [
      { title: { $regex: String(search), $options: 'i' } },
      { description: { $regex: String(search), $options: 'i' } },
      { category: { $regex: String(search), $options: 'i' } },
    ];
  }

  const listings = await Listing.find(query).sort({ createdAt: -1 }).lean();
  return res.json({ items: listings });
});

router.post('/', requireAuth, async (req, res) => {
  const { title, description, type, category, price, contact, files } = req.body || {};
  if (!title?.trim() || !description?.trim() || !type?.trim()) {
    return res.status(400).json({ message: 'title, description and type are required' });
  }

  const payload = {
    title: title.trim(),
    description: description.trim(),
    type: type.trim(),
    category: category?.trim() || 'General',
    price: Number(price || 0),
    sellerId: req.user._id,
    studentSnapshot: {
      name: req.user.name,
      year: req.user.year || 'NA',
      department: req.user.department || 'NA',
    },
    contact: {
      phone: String(contact?.phone || '').trim(),
      whatsapp: String(contact?.whatsapp || '').trim(),
      instagram: String(contact?.instagram || '').trim(),
      telegram: String(contact?.telegram || '').trim(),
    },
    files: Array.isArray(files) ? files : [],
  };

  const listing = await Listing.create(payload);
  return res.status(201).json({ listing });
});

router.patch('/:id/complete', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid listing id' });

  const listing = await Listing.findOneAndUpdate(
    { _id: id, sellerId: req.user._id },
    { status: 'completed' },
    { new: true }
  );
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  return res.json({ listing });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid listing id' });

  const deleted = await Listing.findOneAndDelete({ _id: id, sellerId: req.user._id });
  if (!deleted) return res.status(404).json({ message: 'Listing not found' });
  return res.json({ message: 'Listing deleted' });
});

export default router;
