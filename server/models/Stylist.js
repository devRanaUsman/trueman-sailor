import mongoose from 'mongoose';

const daySchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    start: { type: String, default: '10:00' },
    end: { type: String, default: '21:00' },
    off: { type: Boolean, default: false },
  },
  { _id: false }
);

const defaultWeek = () =>
  [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, start: '10:00', end: '21:00', off: false }));

const stylistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, default: 'Barber' },
    bio: { type: String, default: '' },
    photo: { type: String, default: '' },
    specialties: [{ type: String }],
    instagram: { type: String, default: '' },
    schedule: { type: [daySchema], default: defaultWeek },
    rating: {
      avg: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Stylist', stylistSchema);
