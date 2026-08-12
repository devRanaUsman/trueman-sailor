import { Router } from 'express';
import Stylist from '../models/Stylist.js';
import Review from '../models/Review.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/stylists
router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.all === '1' ? {} : { active: true };
    const stylists = await Stylist.find(filter).sort({ createdAt: 1 });
    res.json({ stylists });
  } catch (err) {
    next(err);
  }
});

// GET /api/stylists/:id  (profile + latest reviews)
router.get('/:id', async (req, res, next) => {
  try {
    const stylist = await Stylist.findById(req.params.id);
    if (!stylist) return res.status(404).json({ message: 'Barber not found.' });
    const reviews = await Review.find({ stylist: stylist._id }).sort({ createdAt: -1 }).limit(10);
    res.json({ stylist, reviews });
  } catch (err) {
    next(err);
  }
});

// Admin CRUD
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const stylist = await Stylist.create(req.body);
    res.status(201).json({ stylist });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const stylist = await Stylist.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!stylist) return res.status(404).json({ message: 'Barber not found.' });
    res.json({ stylist });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const stylist = await Stylist.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!stylist) return res.status(404).json({ message: 'Barber not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
