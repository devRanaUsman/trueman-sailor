import { Router } from 'express';
import Booking from '../models/Booking.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { todayStr } from '../utils/time.js';
import { sendMail } from '../utils/mailer.js';

const router = Router();
router.use(protect, adminOnly);

// GET /api/admin/bookings?status=&date=
router.get('/bookings', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) filter.date = req.query.date;
    const bookings = await Booking.find(filter)
      .sort({ date: 1, start: 1 })
      .limit(300)
      .populate('user', 'name email phone')
      .populate('stylist', 'name');
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/bookings/:id/status  { status }
router.patch('/bookings/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const booking = await Booking.findById(req.params.id).populate('user', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    booking.status = status;
    booking.isActive = status !== 'cancelled';
    if (status === 'cancelled') booking.cancelledBy = 'admin';
    await booking.save();

    if (status === 'confirmed' && booking.user?.email) {
      await sendMail({
        to: booking.user.email,
        subject: `Confirmed — ${booking.serviceName} on ${booking.date} at ${booking.start}`,
        text: `Hi ${booking.user.name}, your appointment is confirmed. See you at the shop.`,
      });
    }
    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const today = todayStr();
    const monthStart = today.slice(0, 8) + '01';

    const [todayCount, upcomingCount, pendingCount, revenueAgg] = await Promise.all([
      Booking.countDocuments({ date: today, status: { $in: ['pending', 'confirmed', 'completed'] } }),
      Booking.countDocuments({ date: { $gte: today }, status: { $in: ['pending', 'confirmed'] } }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.aggregate([
        { $match: { status: 'completed', date: { $gte: monthStart, $lte: today } } },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]),
    ]);

    res.json({
      todayCount,
      upcomingCount,
      pendingCount,
      monthRevenue: revenueAgg[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
