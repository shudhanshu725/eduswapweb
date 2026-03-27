import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      verificationStatus: user.verificationStatus,
      email: user.email,
    },
    env.accessSecret,
    { expiresIn: env.accessTtl }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      tokenVersion: user.refreshTokenVersion,
    },
    env.refreshSecret,
    { expiresIn: env.refreshTtl }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshSecret);
}

