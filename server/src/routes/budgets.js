import { Router } from 'express';
import { z } from 'zod';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
const router = Router(); router.use(protect);
const schema = z.object({ body: z.object({ category: z.string().trim().min(1).max(40), amount: z.coerce.number().positive(), month: z.string().regex(/^\d{4}-\d{2}$/) }), query: z.any(), params: z.any() });
router.put('/', validate(schema), async (req, res) => { const b = await Budget.findOneAndUpdate({ user: req.user._id, category: req.validated.body.category, month: req.validated.body.month }, { ...req.validated.body, user: req.user._id }, { upsert: true, new: true, runValidators: true }); res.json({ budget: b }); });
router.get('/', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const budgets = await Budget.find({ user: req.user._id, month }).sort('category');
  const [year, m] = month.split('-').map(Number); const start = new Date(Date.UTC(year, m - 1, 1)); const end = new Date(Date.UTC(year, m, 1));
  const spent = await Transaction.aggregate([{ $match: { user: req.user._id, type: 'expense', date: { $gte: start, $lt: end } } }, { $group: { _id: '$category', spent: { $sum: '$amount' } } }]);
  const lookup = Object.fromEntries(spent.map(x => [x._id, x.spent]));
  res.json({ budgets: budgets.map(b => ({ ...b.toObject(), spent: lookup[b.category] || 0 })) });
});
router.delete('/:id', async (req, res) => { const b = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id }); if (!b) return res.status(404).json({ message: 'Budget not found' }); res.status(204).end(); });
export default router;
