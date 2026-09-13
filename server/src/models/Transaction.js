import mongoose from 'mongoose';
const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true, index: true },
  amount: { type: Number, required: true, min: 0.01 },
  category: { type: String, required: true, trim: true, maxlength: 40, index: true },
  note: { type: String, trim: true, maxlength: 250, default: '' },
  date: { type: Date, required: true, default: Date.now, index: true }
}, { timestamps: true });
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, category: 1 });
export default mongoose.model('Transaction', transactionSchema);
