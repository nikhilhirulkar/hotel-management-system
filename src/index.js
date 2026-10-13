import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { MenuItem, Reservation, Order, EventBooking } from './models/index.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
const PORT = process.env.PORT || 5000;

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'The Olive Room API' }));

app.get('/api/menu', async (_req, res, next) => { try { res.json(await MenuItem.find().sort({ category: 1, name: 1 })); } catch (e) { next(e); } });
app.post('/api/menu', async (req, res, next) => {
  try { const item = await MenuItem.create({ name: req.body.name, category: req.body.category, description: req.body.description || '', price: Number(req.body.price), image: req.body.image || '', isVeg: req.body.isVeg !== false, available: true }); res.status(201).json(item); } catch (e) { next(e); }
});
app.delete('/api/menu/:id', async (req, res, next) => { try { await MenuItem.findByIdAndDelete(req.params.id); res.json({ message: 'Menu item removed' }); } catch (e) { next(e); } });

app.get('/api/reservations', async (_req, res, next) => { try { res.json(await Reservation.find().sort({ createdAt: -1 })); } catch (e) { next(e); } });
app.post('/api/reservations', async (req, res, next) => { try { const data = { ...req.body, guests: Number(req.body.guests) }; res.status(201).json(await Reservation.create(data)); } catch (e) { next(e); } });
app.patch('/api/reservations/:id/status', async (req, res, next) => { try { res.json(await Reservation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true })); } catch (e) { next(e); } });

app.get('/api/orders', async (_req, res, next) => { try { res.json(await Order.find().sort({ createdAt: -1 })); } catch (e) { next(e); } });
app.post('/api/orders', async (req, res, next) => { try { const total = Number(req.body.total); if (!Array.isArray(req.body.items) || !req.body.items.length || !Number.isFinite(total) || total < 0) return res.status(400).json({ message: 'Please provide valid order items and total.' }); res.status(201).json(await Order.create({ ...req.body, total })); } catch (e) { next(e); } });
app.patch('/api/orders/:id/status', async (req, res, next) => { try { res.json(await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true })); } catch (e) { next(e); } });

app.get('/api/events', async (_req, res, next) => { try { res.json(await EventBooking.find().sort({ createdAt: -1 })); } catch (e) { next(e); } });
app.post('/api/events', async (req, res, next) => { try { res.status(201).json(await EventBooking.create({ ...req.body, guests: Number(req.body.guests), budget: Number(req.body.budget || 0) })); } catch (e) { next(e); } });
app.patch('/api/events/:id/status', async (req, res, next) => { try { res.json(await EventBooking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true })); } catch (e) { next(e); } });

app.get('/api/admin/summary', async (_req, res, next) => {
  try {
    const [menuCount, reservations, orders, events, revenue] = await Promise.all([
      MenuItem.countDocuments(), Reservation.countDocuments(), Order.countDocuments(), EventBooking.countDocuments(),
      Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }])
    ]);
    res.json({ menuCount, reservations, orders, events, revenue: revenue[0]?.total || 0 });
  } catch (e) { next(e); }
});

app.post('/api/seed', async (_req, res, next) => {
  try {
    if (await MenuItem.countDocuments()) return res.json({ message: 'Menu already contains items; seed skipped.' });
    const items = [
      { name: 'Burrata & Heirloom Tomato', category: 'Starters', description: 'Creamy burrata, basil oil, toasted sourdough', price: 345, image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=900&q=80', isVeg: true },
      { name: 'Truffle Mushroom Soup', category: 'Starters', description: 'Wild mushrooms, cream and a hint of truffle', price: 265, image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80', isVeg: true },
      { name: 'Paneer Tikka Skewers', category: 'Starters', description: 'Smoky paneer, peppers and mint chutney', price: 325, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=80', isVeg: true },
      { name: 'Herb Grilled Chicken', category: 'Mains', description: 'Grilled chicken, seasonal vegetables, pepper jus', price: 545, image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=80', isVeg: false },
      { name: 'Wild Mushroom Risotto', category: 'Mains', description: 'Arborio rice, parmesan and roasted mushrooms', price: 425, image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=900&q=80', isVeg: true },
      { name: 'Garden Pesto Pasta', category: 'Mains', description: 'Basil pesto, cherry tomato and parmesan', price: 395, image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80', isVeg: true },
      { name: 'Chocolate Fondant', category: 'Desserts', description: 'Warm chocolate centre with vanilla gelato', price: 245, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80', isVeg: true },
      { name: 'Rose & Lychee Cooler', category: 'Drinks', description: 'Rose syrup, lychee, lime and soda', price: 165, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765edfd7?auto=format&fit=crop&w=900&q=80', isVeg: true }
    ];
    await MenuItem.insertMany(items); res.status(201).json({ message: 'Sample menu created', count: items.length });
  } catch (e) { next(e); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid record ID.' });
  res.status(500).json({ message: 'Server error. Check backend logs and MongoDB connection.' });
});

// async function start() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://amanwagh092_db_user:Anam_Wagh_12_hotel@cluster0.srpbowb.mongodb.net/olive_room?retryWrites=true&w=majority&appName=Cluster0');
//     console.log('MongoDB connected');
//     app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
//   } catch (error) { console.error('MongoDB connection failed:', error.message); process.exit(1); }
// }
// start();


async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

start();

