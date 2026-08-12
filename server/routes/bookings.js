import { Router } from 'express';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Stylist from '../models/Stylist.js';
import { protect } from '../middleware/auth.js';
import { buildSlots, toMinutes, toTime, todayStr, overlaps } from '../utils/time.js';
import { sendMail } from '../utils/mailer.js';

const router = Router();

const LEAD_MIN = () => Number(process.env.LEAD_TIME_MIN || 60);
const CANCEL_MIN = () => Number(process.env.CANCEL_WINDOW_MIN || 120);
const MAX_DAYS_AHEAD = 60;

const dateOk = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

function withinBookingWindow(date) {
  const today = todayStr();
  if (date < today) return false;
  const max = new Date();
  max.setDate(max.getDate() + MAX_DAYS_AHEAD);
  return date <= todayStr(max);
}

async function slotsForStylist(stylist, date, duration) {
  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const day = stylist.schedule.find((d) => d.day === dayOfWeek);
  if (!day || day.off) return [];

  const taken = await Booking.find({
    stylist: stylist._id,
    date,
    isActive: true,
    status: { $in: ['pending', 'confirmed'] },
  }).select('start end');

  return buildSlots({
    workStart: day.start,
    workEnd: day.end,
    duration,
    taken,
    date,
    leadMin: LEAD_MIN(),
  });
}

// GET /api/bookings/availability?serviceId=&date=&stylistId=(optional)
router.get('/availability', async (req, res, next) => {
  try {
    const { serviceId, date, stylistId } = req.query;
    if (!serviceId || !date) return res.status(400).json({ message: 'serviceId and date are required.' });
    if (!dateOk(date)) return res.status(400).json({ message: 'Date must be YYYY-MM-DD.' });
    if (!withinBookingWindow(date)) {
      return res.status(400).json({ message: `Bookings open up to ${MAX_DAYS_AHEAD} days ahead.` });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.active) return res.status(404).json({ message: 'Service not found.' });

    if (stylistId) {
      const stylist = await Stylist.findById(stylistId);
      if (!stylist || !stylist.active) return res.status(404).json({ message: 'Barber not found.' });
      const slots = await slotsForStylist(stylist, date, service.duration);
      return res.json({ slots });
    }

    // "No preference": availability for every active barber
    const stylists = await Stylist.find({ active: true });
    const byStylist = [];
    for (const s of stylists) {
      const slots = await slotsForStylist(s, date, service.duration);
      byStylist.push({ stylist: { _id: s._id, name: s.name }, slots });
    }
    res.json({ byStylist });
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings
router.post('/', protect, async (req, res, next) => {
  try {
    const { serviceId, stylistId, date, start, notes = '' } = req.body;
    if (!serviceId || !stylistId || !date || !start) {
      return res.status(400).json({ message: 'Service, barber, date and time are all required.' });
    }
    if (!dateOk(date) || !/^\d{2}:\d{2}$/.test(start)) {
      return res.status(400).json({ message: 'Invalid date or time format.' });
    }
    if (!withinBookingWindow(date)) {
      return res.status(400).json({ message: `Bookings open up to ${MAX_DAYS_AHEAD} days ahead.` });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.active) return res.status(404).json({ message: 'Service not found.' });
    const stylist = await Stylist.findById(stylistId);
    if (!stylist || !stylist.active) return res.status(404).json({ message: 'Barber not found.' });

    // Re-validate the slot server-side (never trust the client)
    const available = await slotsForStylist(stylist, date, service.duration);
    if (!available.includes(start)) {
      return res.status(409).json({ message: 'That time was just taken. Please pick another slot.' });
    }

    const end = toTime(toMinutes(start) + service.duration);

    let booking;
    try {
      booking = await Booking.create({
        user: req.user._id,
        service: service._id,
        stylist: stylist._id,
        serviceName: service.name,
        price: service.price,
        duration: service.duration,
        date,
        start,
        end,
        notes,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'That time was just taken. Please pick another slot.' });
      }
      throw err;
    }

    await sendMail({
      to: req.user.email,
      subject: `Trueman Grooming Co. — booking request for ${date} at ${start}`,
      text:
        `Hi ${req.user.name},\n\nWe received your request:\n` +
        `${service.name} with ${stylist.name}\n${date} at ${start} (${service.duration} min) — $${service.price}\n\n` +
        `You will get a confirmation shortly. Need to change it? Manage your booking from "My bookings".`,
    });

    const populated = await booking.populate('stylist', 'name title photo');
    res.status(201).json({ booking: populated });
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/mine
router.get('/mine', protect, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ date: -1, start: -1 })
      .populate('stylist', 'name title photo');
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const isOwner = String(booking.user) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not your booking.' });

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: `This booking is already ${booking.status}.` });
    }

    if (isOwner && !isAdmin) {
      const startAt = new Date(`${booking.date}T${booking.start}:00`);
      const minutesAway = (startAt - new Date()) / 60000;
      if (minutesAway < CANCEL_MIN()) {
        return res.status(400).json({
          message: `Online cancellation closes ${CANCEL_MIN() / 60} hours before the appointment. Please call the shop.`,
        });
      }
    }

    booking.status = 'cancelled';
    booking.isActive = false;
    booking.cancelledBy = isAdmin && !isOwner ? 'admin' : 'client';
    await booking.save();
    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

export default router;
