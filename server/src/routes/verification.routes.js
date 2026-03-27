import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { VerificationRequest } from '../models/VerificationRequest.js';
import { User } from '../models/User.js';

const router = Router();

router.post('/submit', requireAuth, async (req, res) => {
  const { name, rollNo, year, department, idCardUrl } = req.body || {};
  if (!name?.trim() || !rollNo?.trim() || !year?.trim() || !department?.trim() || !idCardUrl?.trim()) {
    return res.status(400).json({ message: 'All verification fields are required' });
  }

  const payload = {
    userId: req.user._id,
    name: name.trim(),
    rollNo: rollNo.trim(),
    year: year.trim(),
    department: department.trim(),
    idCardUrl: idCardUrl.trim(),
    status: 'pending',
    reviewNote: '',
    reviewedBy: null,
    reviewedAt: null,
  };

  const verification = await VerificationRequest.findOneAndUpdate(
    { userId: req.user._id },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.findByIdAndUpdate(req.user._id, {
    verificationStatus: 'pending',
    name: payload.name,
    rollNo: payload.rollNo,
    year: payload.year,
    department: payload.department,
  });

  return res.status(201).json({ verification });
});

router.get('/status', requireAuth, async (req, res) => {
  const verification = await VerificationRequest.findOne({ userId: req.user._id }).lean();
  return res.json({
    verificationStatus: req.user.verificationStatus,
    verification: verification || null,
  });
});

router.get('/admin/requests', requireAuth, requireAdmin, async (req, res) => {
  const { status = 'pending' } = req.query;
  const query = ['pending', 'approved', 'rejected'].includes(String(status))
    ? { status: String(status) }
    : {};
  const items = await VerificationRequest.find(query).sort({ createdAt: -1 }).lean();
  return res.json({ items });
});

router.post('/admin/requests/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const requestId = req.params.id;
  const note = String(req.body?.note || '').trim();

  const request = await VerificationRequest.findById(requestId);
  if (!request) return res.status(404).json({ message: 'Verification request not found' });

  request.status = 'approved';
  request.reviewNote = note;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();

  await User.findByIdAndUpdate(request.userId, { verificationStatus: 'approved' });
  return res.json({ message: 'Student approved', request });
});

router.post('/admin/requests/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  const requestId = req.params.id;
  const note = String(req.body?.note || '').trim();

  const request = await VerificationRequest.findById(requestId);
  if (!request) return res.status(404).json({ message: 'Verification request not found' });

  request.status = 'rejected';
  request.reviewNote = note;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();

  await User.findByIdAndUpdate(request.userId, { verificationStatus: 'rejected' });
  return res.json({ message: 'Student rejected', request });
});

export default router;

