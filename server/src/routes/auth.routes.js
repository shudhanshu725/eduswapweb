import { Router } from 'express';
import bcrypt from 'bcryptjs';
import isEmail from 'validator/lib/isEmail.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const router = Router();

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  verificationStatus: user.verificationStatus,
  year: user.year,
  department: user.department,
  rollNo: user.rollNo,
  avatarUrl: user.avatarUrl,
});

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (!isEmail(email.trim())) {
    return res.status(400).json({ message: 'Invalid email' });
  }
  if (password.trim().length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const exists = await User.findOne({ email: email.trim().toLowerCase() }).lean();
  if (exists) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password.trim(), 10);
  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    verificationStatus: 'approved',
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return res.status(201).json({
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
    message: 'Signup successful.',
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password.trim(), user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return res.json({ user: sanitizeUser(user), accessToken, refreshToken });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user || payload.tokenVersion !== user.refreshTokenVersion) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const accessToken = signAccessToken(user);
    const nextRefresh = signRefreshToken(user);
    return res.json({ accessToken, refreshToken: nextRefresh });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});

export default router;
