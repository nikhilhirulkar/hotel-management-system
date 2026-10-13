import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  isVeg: { type: Boolean, default: true },
  available: { type: Boolean, default: true }
}, { timestamps: true });

const reservationSchema = new mongoose.Schema({
  name: { type: String, required: true }, email: { type: String, required: true }, phone: { type: String, required: true },
  date: { type: String, required: true }, time: { type: String, required: true }, guests: { type: Number, required: true, min: 1 },
  zone: { type: String, enum: ['Family Zone', 'Couple Zone', 'Main Dining'], default: 'Main Dining' },
  notes: { type: String, default: '' }, status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true }, phone: { type: String, required: true }, address: { type: String, required: true },
  items: [{ menuItemId: String, name: String, price: Number, quantity: Number }],
  total: { type: Number, required: true }, paymentMethod: { type: String, default: 'Pay on delivery' },
  status: { type: String, enum: ['Received', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'], default: 'Received' }
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true }, phone: { type: String, required: true }, email: { type: String, default: '' },
  eventDate: { type: String, required: true }, eventTime: { type: String, required: true }, guests: { type: Number, required: true },
  packageName: { type: String, required: true }, budget: { type: Number, default: 0 }, theme: { type: String, default: '' }, notes: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export const Reservation = mongoose.model('Reservation', reservationSchema);
export const Order = mongoose.model('Order', orderSchema);
export const EventBooking = mongoose.model('EventBooking', eventSchema);
