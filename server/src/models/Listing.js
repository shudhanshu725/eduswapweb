import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    instagram: { type: String, default: '' },
    telegram: { type: String, default: '' },
  },
  { _id: false }
);

const studentSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    year: { type: String, required: true },
    department: { type: String, required: true },
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: ['sell', 'swap', 'donate', 'resource'], required: true },
    category: { type: String, default: 'General' },
    price: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['available', 'completed'], default: 'available' },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentSnapshot: { type: studentSnapshotSchema, required: true },
    contact: { type: contactSchema, default: () => ({}) },
    files: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Listing = mongoose.model('Listing', listingSchema);

