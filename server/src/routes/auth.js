import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendPasswordResetEmail } from '../services/mailer.js';
const router = Router();
const credentials = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(8) }), query: z.any(), params: z.any() });
const signup = z.object({ body: z.object({ name: z.string().trim().min(2).max(60), email: z.string().email(), password: z.string().min(8).max(100) }), query: z.any(), params: z.any() });
const tokenFor = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const response = (user) => ({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
router.post('/register', validate(signup), async (req, res) => {
  const { name, email, password } = req.validated.body;
  if (await User.exists({ email })) return res.status(409).json({ message: 'Email is already registered' });
  const user = await User.create({ name, email, password });
  res.status(201).json(response(user));
});
router.post('/login', validate(credentials), async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Incorrect email or password' });
  res.json(response(user));
});
router.post('/forgot-password', validate(z.object({ body: z.object({ email: z.string().email() }), query: z.any(), params: z.any() })), async (req, res) => {
  const { email } = req.validated.body;
  const user = await User.findOne({ email });
  // Do not reveal whether an email address has a FinTrack account.
  if (!user) return res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  try {
    await sendPasswordResetEmail({ recipient: user.email, name: user.name, resetUrl: `${process.env.CLIENT_URL}/?reset=${rawToken}` });
  } catch (err) {
    user.passwordResetToken = undefined; user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw err;
  }
  res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
});
router.post('/reset-password/:token', validate(z.object({ body: z.object({ password: z.string().min(8).max(100) }), query: z.any(), params: z.object({ token: z.string().length(64) }) })), async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: new Date() } }).select('+passwordResetToken +passwordResetExpires');
  if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired. Please request another one.' });
  user.password = req.validated.body.password;
  user.passwordResetToken = undefined; user.passwordResetExpires = undefined;
  await user.save();
  res.json(response(user));
});
router.get('/me', protect, (req, res) => res.json({ user: req.user }));
export default router;
