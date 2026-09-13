import dotenv from 'dotenv'; dotenv.config();
import app from './app.js'; import { connectDB } from './config/db.js';
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be set to a random value at least 32 characters long');
connectDB().then(() => app.listen(process.env.PORT || 5000, () => console.log(`API listening on ${process.env.PORT || 5000}`))).catch(err => { console.error(err); process.exit(1); });
