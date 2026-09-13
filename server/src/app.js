import express from 'express'; import cors from 'cors'; import helmet from 'helmet'; import rateLimit from 'express-rate-limit'; import morgan from 'morgan'; import 'express-async-errors';
import auth from './routes/auth.js'; import transactions from './routes/transactions.js'; import budgets from './routes/budgets.js'; import analytics from './routes/analytics.js'; import { errorHandler, notFound } from './middleware/error.js';
const app = express();
app.use(helmet()); app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || true })); app.use(express.json({ limit: '20kb' })); app.use(morgan('dev')); app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' })); app.use('/api/auth', auth); app.use('/api/transactions', transactions); app.use('/api/budgets', budgets); app.use('/api/analytics', analytics); app.use(notFound); app.use(errorHandler); export default app;
