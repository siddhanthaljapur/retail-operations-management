require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const productSchema = new mongoose.Schema({
  name: String, category: String, barcode: String,
  price: Number, costPrice: Number, quantity: Number,
  reorderLevel: Number, imageUrl: String
}, { timestamps: true });
const Product = mongoose.model('Product', productSchema);

const customerSchema = new mongoose.Schema({
  name: String, email: String, phone: String,
  loyaltyPoints: Number, totalPurchases: Number
}, { timestamps: true });
const Customer = mongoose.model('Customer', customerSchema);

const billSchema = new mongoose.Schema({
  customerId: String, date: String, totalAmount: Number, paymentMethod: String,
  items: [{ productId: String, quantity: Number, price: Number }]
}, { timestamps: true });
const Bill = mongoose.model('Bill', billSchema);

const userSchema = new mongoose.Schema({
  name: String, email: String, role: String, status: String
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const notificationSchema = new mongoose.Schema({
  message: String, date: String, read: Boolean, type: String
}, { timestamps: true });
const Notification = mongoose.model('Notification', notificationSchema);

// Utils
const mapId = (docs) => docs.map(d => { const obj = d._doc; return { ...obj, id: obj._id.toString(), productId: obj._id.toString() }; });

// Routes - Products
app.get('/api/products', async (req, res) => res.json(mapId(await Product.find())));
app.post('/api/products', async (req, res) => { const p = await new Product(req.body).save(); res.status(201).json({ ...p._doc, productId: p._id.toString() }); });
app.delete('/api/products/:id', async (req, res) => { await Product.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); });

// Routes - Customers
app.get('/api/customers', async (req, res) => res.json(mapId(await Customer.find())));
app.post('/api/customers', async (req, res) => { const c = await new Customer(req.body).save(); res.status(201).json({ ...c._doc, id: c._id.toString() }); });

// Routes - Bills
app.get('/api/bills', async (req, res) => res.json(mapId(await Bill.find())));
app.post('/api/bills', async (req, res) => { const b = await new Bill(req.body).save(); res.status(201).json({ ...b._doc, id: b._id.toString() }); });

// Routes - Users & Notifications
app.get('/api/users', async (req, res) => res.json(mapId(await User.find())));
app.get('/api/notifications', async (req, res) => res.json(mapId(await Notification.find())));

// Routes - Analytics (Real aggregations)
app.get('/api/analytics/report', async (req, res) => {
  try {
    const bills = await Bill.find();
    
    // Calculate total revenue, orders, products sold
    const total_revenue = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const total_orders = bills.length;
    const total_products_sold = bills.reduce((sum, b) => {
      return sum + (b.items || []).reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
    }, 0);

    res.json({
      summary: { total_revenue, total_orders, total_products_sold },
      revenue_trend: [],
      top_products: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Endpoints
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me_in_prod';

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  // In a real app, verify user in DB. Here we just issue a token.
  const token = jwt.sign(
    { sub: email, role: 'OWNER' }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
  res.json({ accessToken: token, refreshToken: "dummy_refresh_token" });
});

app.post('/api/auth/refresh', (req, res) => {
  const token = jwt.sign(
    { sub: "owner@smartretail.com", role: 'OWNER' }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
  res.json({ accessToken: token, refreshToken: "dummy_refresh_token" });
});

// Serve static React frontend
const path = require('path');
app.use('/retail-pro-prototype', express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
