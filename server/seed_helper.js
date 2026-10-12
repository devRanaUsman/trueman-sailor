import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Service from './models/Service.js';
import Stylist from './models/Stylist.js';
import Booking from './models/Booking.js';
import Review from './models/Review.js';

const week = (offDays = []) =>
  [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    start: '10:00',
    end: '21:00',
    off: offDays.includes(day),
  }));

const img = (id) => `https://images.unsplash.com/${id}?q=80&w=1200&auto=format&fit=crop`;

export async function seedData() {
  await Promise.all([
    User.deleteMany({}),
    Service.deleteMany({}),
    Stylist.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // Pre-hash passwords so they work in both real MongoDB and in-memory mock modes
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const demoHash = await bcrypt.hash('Demo@123', 10);

  const admin = await User.create({
    name: 'Shop Manager',
    email: 'admin@trueman.co',
    phone: '800-456-7890',
    password: adminHash,
    role: 'admin',
  });
  const demo = await User.create({
    name: 'Demo Client',
    email: 'demo@trueman.co',
    phone: '555-010-2233',
    password: demoHash,
  });

  const services = await Service.insertMany([
    { name: 'Classic Haircut', category: 'haircut', duration: 45, price: 35, description: 'Consultation, precision cut, hot lather neck shave and style.' },
    { name: 'Skin Fade', category: 'haircut', duration: 60, price: 45, description: 'Razor-sharp fade blended to zero, finished with product and pointers.', popular: true },
    { name: 'Kids Cut (under 12)', category: 'haircut', duration: 30, price: 22, description: 'Patient, kid-friendly cut in the big chair.' },
    { name: 'Beard Trim & Shape', category: 'beard', duration: 30, price: 25, description: 'Line-up, sculpt and condition with beard oil finish.' },
    { name: 'Hot Towel Shave', category: 'shave', duration: 45, price: 40, description: 'Straight razor, two hot towels, pre-shave oil and cold towel close.', popular: true },
    { name: 'Head Shave & Scalp Treatment', category: 'shave', duration: 45, price: 38, description: 'Full razor head shave with exfoliating scalp treatment.' },
    { name: 'Haircut + Beard Combo', category: 'combo', duration: 75, price: 55, description: 'The full works — our most-booked appointment.', popular: true },
    { name: 'Grey Blending', category: 'extras', duration: 30, price: 30, description: 'Subtle camo colour that softens grey without looking dyed.' },
  ]);

  const stylists = await Stylist.insertMany([
    {
      name: 'Martin Cole', title: 'Master Barber',
      bio: 'Nearly two decades behind the chair. If it involves clippers, Martin has mastered it.',
      photo: img('photo-1472099645785-5658abf4ff4e'),
      specialties: ['Skin fades', 'Classic cuts', 'Consultations'],
      schedule: week([0]),
    },
    {
      name: 'Ray Donovan', title: 'Straight-Razor Specialist',
      bio: 'Trained in traditional wet shaving. The hot towel ritual is his religion.',
      photo: img('photo-1500648767791-00dcc994a43e'),
      specialties: ['Hot towel shaves', 'Beard design'],
      schedule: week([1]),
    },
    {
      name: 'Leo Grant', title: 'Senior Barber',
      bio: 'Scissor-work purist with a soft spot for pompadours and mid-century styles.',
      photo: img('photo-1506794778202-cad84cf45f1d'),
      specialties: ['Scissor cuts', 'Pompadours', 'Styling'],
      schedule: week([0]),
    },
    {
      name: 'Silas Ward', title: 'Barber & Colourist',
      bio: 'The one to see for texture, curls and grey blending done right.',
      photo: img('photo-1531891437562-4301cf35b7e4'),
      specialties: ['Grey blending', 'Texture & curls'],
      schedule: week([2]),
    },
  ]);

  const quotes = [
    { s: 0, r: 5, c: 'Being in this business for almost a decade, I can tell this place is absolutely worth your time and money. Great incredible job, keep it up boys!' },
    { s: 1, r: 5, c: 'The hot towel shave is a ritual. Forty-five minutes later I walked out a new man.' },
    { s: 2, r: 5, c: 'First barber who actually listened before picking up the clippers. Booked my next three cuts on the spot.' },
    { s: 3, r: 4, c: 'Grey blending looks completely natural. My wife noticed something was different but could not say what.' },
  ];
  for (const q of quotes) {
    await Review.create({
      user: demo._id,
      stylist: stylists[q.s]._id,
      authorName: ['Martin C.', 'Dave R.', 'Tom H.', 'Peter W.'][q.s],
      rating: q.r,
      comment: q.c,
    });
  }

  console.log('\nSeed complete.');
  console.log('  Admin login:  admin@trueman.co / Admin@123');
  console.log('  Client login: demo@trueman.co / Demo@123');
  console.log(`  ${services.length} services, ${stylists.length} barbers, ${quotes.length} reviews\n`);
}
