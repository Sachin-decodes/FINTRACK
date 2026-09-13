import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
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
router.get('/me', protect, (req, res) => res.json({ user: req.user }));
export default router;
