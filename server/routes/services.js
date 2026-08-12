import { Router } from 'express';
import Service from '../models/Service.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/services  (public — active only unless ?all=1 as admin)
router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.all === '1' ? {} : { active: true };
    const services = await Service.find(filter).sort({ category: 1, price: 1 });
    res.json({ services });
  } catch (err) {
    next(err);
  }
});

// GET /api/services/:id
router.get('/:id', async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found.' });
    res.json({ service });
  } catch (err) {
    next(err);
  }
});

// Admin CRUD
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ service });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) return res.status(404).json({ message: 'Service not found.' });
    res.json({ service });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    // Soft delete keeps historical bookings intact
    const service = await Service.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!service) return res.status(404).json({ message: 'Service not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
