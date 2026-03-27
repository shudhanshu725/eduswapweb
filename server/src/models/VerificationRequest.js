import mongoose from 'mongoose';

const verificationRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    rollNo: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    idCardUrl: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewNote: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);

