import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    stylist: { type: mongoose.Schema.Types.ObjectId, ref: 'Stylist', required: true },

    // Snapshots so history stays correct if the catalogue changes later
    serviceName: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },

    date: { type: String, required: true }, // "YYYY-MM-DD" (salon local)
    start: { type: String, required: true }, // "HH:MM"
    end: { type: String, required: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    // true while the booking occupies its slot; flipped off on cancellation
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '', maxlength: 500 },
    reviewed: { type: Boolean, default: false },
    cancelledBy: { type: String, enum: ['client', 'admin', null], default: null },
  },
  { timestamps: true }
);

// Guards against two clients grabbing the exact same slot in a race.
// Overlapping (different start) conflicts are rejected in route logic.
bookingSchema.index(
  { stylist: 1, date: 1, start: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
bookingSchema.index({ user: 1, date: -1 });
bookingSchema.index({ date: 1, status: 1 });

export default mongoose.model('Booking', bookingSchema);
