import { Router } from 'express';
import { z } from 'zod';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
const router = Router(); router.use(protect);
const body = z.object({ type: z.enum(['income', 'expense']), amount: z.coerce.number().positive(), category: z.string().trim().min(1).max(40), note: z.string().trim().max(250).optional().default(''), date: z.coerce.date() });
const txSchema = z.object({ body, query: z.any(), params: z.any() });
router.post('/', validate(txSchema), async (req, res) => res.status(201).json({ transaction: await Transaction.create({ ...req.validated.body, user: req.user._id }) }));
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, type, category, search, startDate, endDate, sort = '-date' } = req.query;
  const safePage = Math.max(1, Number(page)); const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const filter = { user: req.user._id };
  if (type && ['income', 'expense'].includes(type)) filter.type = type;
  if (category) filter.category = category;
  if (search) filter.$or = [{ note: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } }];
  if (startDate || endDate) filter.date = { ...(startDate && { $gte: new Date(startDate) }), ...(endDate && { $lte: new Date(endDate) }) };
  const allowedSort = ['date', '-date', 'amount', '-amount', 'category', '-category'];
  const [transactions, total] = await Promise.all([Transaction.find(filter).sort(allowedSort.includes(sort) ? sort : '-date').skip((safePage - 1) * safeLimit).limit(safeLimit), Transaction.countDocuments(filter)]);
  res.json({ transactions, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
});
router.patch('/:id', validate(z.object({ body: body.partial(), query: z.any(), params: z.object({ id: z.string() }) })), async (req, res) => {
  const transaction = await Transaction.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.validated.body, { new: true, runValidators: true });
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' }); res.json({ transaction });
});
router.delete('/:id', async (req, res) => { const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id }); if (!tx) return res.status(404).json({ message: 'Transaction not found' }); res.status(204).end(); });
export default router;
