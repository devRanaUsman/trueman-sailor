import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stylist: { type: mongoose.Schema.Types.ObjectId, ref: 'Stylist', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', unique: true, sparse: true },
    authorName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', maxlength: 600 },
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
