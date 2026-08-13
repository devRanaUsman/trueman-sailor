import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists.' });

    const user = await User.create({ name, email, phone, password });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    let user = await User.findOne({ email: cleanEmail }).select('+password');

    // Support fallback if user typed @trueman.com instead of @trueman.co
    if (!user && cleanEmail.endsWith('@trueman.com')) {
      const altEmail = cleanEmail.replace('@trueman.com', '@trueman.co');
      user = await User.findOne({ email: altEmail }).select('+password');
    }

    if (!user) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    let isMatch = await user.matchPassword(cleanPassword);
    
    // Case-flexible fallback for admin/demo passwords (e.g., admin@123 -> Admin@123 or demo@123 -> Demo@123)
    if (!isMatch && cleanPassword.length > 0) {
      const firstCap = cleanPassword.charAt(0).toUpperCase() + cleanPassword.slice(1);
      const firstLower = cleanPassword.charAt(0).toLowerCase() + cleanPassword.slice(1);
      isMatch = (await user.matchPassword(firstCap)) || (await user.matchPassword(firstLower));
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
