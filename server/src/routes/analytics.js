import { Router } from 'express';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';
const router = Router(); router.use(protect);
router.get('/dashboard', async (req, res) => {
  const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1); const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const match = { user: req.user._id, date: { $gte: start, $lt: next } };
  const [summary] = await Transaction.aggregate([{ $match: match }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]);
  const totals = await Transaction.aggregate([{ $match: match }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]);
  const income = totals.find(x => x._id === 'income')?.total || 0; const expenses = totals.find(x => x._id === 'expense')?.total || 0;
  const [categories, trends, recent] = await Promise.all([
    Transaction.aggregate([{ $match: { ...match, type: 'expense' } }, { $group: { _id: '$category', value: { $sum: '$amount' } } }, { $sort: { value: -1 } }, { $limit: 8 }]),
    Transaction.aggregate([{ $match: { user: req.user._id, date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } }, { $group: { _id: { month: { $dateToString: { format: '%b', date: '$date' } }, type: '$type' }, value: { $sum: '$amount' } } }, { $sort: { '_id.month': 1 } }]),
    Transaction.find({ user: req.user._id }).sort('-date').limit(5)
  ]);
  const trendMap = {}; trends.forEach(x => { trendMap[x._id.month] ||= { month: x._id.month, income: 0, expense: 0 }; trendMap[x._id.month][x._id.type] = x.value; });
  res.json({ summary: { income, expenses, balance: income - expenses }, categories: categories.map(x => ({ name: x._id, value: x.value })), trends: Object.values(trendMap), recent });
});
export default router;
