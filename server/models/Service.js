import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['haircut', 'shave', 'beard', 'combo', 'extras'],
      default: 'haircut',
    },
    duration: { type: Number, required: true, min: 15, max: 240 }, // minutes
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    popular: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Service', serviceSchema);
