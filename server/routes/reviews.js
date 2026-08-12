import { Router } from 'express';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Stylist from '../models/Stylist.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// GET /api/reviews  — latest reviews for the testimonials wall
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('stylist', 'name');
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews  — only after a completed appointment
router.post('/', protect, async (req, res, next) => {
  try {
    const { bookingId, rating, comment = '' } = req.body;
    const numRating = Number(rating);
    if (!bookingId || !numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'A booking and a 1-5 rating are required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking || String(booking.user) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'You can review once the appointment is completed.' });
    }
    if (booking.reviewed) {
      return res.status(409).json({ message: 'You already reviewed this appointment.' });
    }

    const review = await Review.create({
      user: req.user._id,
      stylist: booking.stylist,
      booking: booking._id,
      authorName: req.user.name,
      rating: numRating,
      comment,
    });

    booking.reviewed = true;
    await booking.save();

    // Keep the barber's average up to date
    const stats = await Review.aggregate([
      { $match: { stylist: booking.stylist } },
      { $group: { _id: '$stylist', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats[0]) {
      await Stylist.findByIdAndUpdate(booking.stylist, {
        rating: { avg: Math.round(stats[0].avg * 10) / 10, count: stats[0].count },
      });
    }

    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
});

export default router;
