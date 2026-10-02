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
app.get('/api/products', async (req, res) => {
  try { res.json(mapId(await Product.find())); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/products/barcode/:barcode', async (req, res) => {
  try {
    const p = await Product.findOne({ barcode: req.params.barcode });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ ...p._doc, id: p._id.toString(), productId: p._id.toString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/products/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ ...p._doc, id: p._id.toString(), productId: p._id.toString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/products', async (req, res) => {
  try { const p = await new Product(req.body).save(); res.status(201).json({ ...p._doc, id: p._id.toString(), productId: p._id.toString() }); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/products/:id', async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ ...p._doc, id: p._id.toString(), productId: p._id.toString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/products/:id', async (req, res) => {
  try { await Product.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Routes - Customers
app.get('/api/customers', async (req, res) => {
  try { res.json(mapId(await Customer.find())); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/customers', async (req, res) => {
  try { const c = await new Customer(req.body).save(); res.status(201).json({ ...c._doc, id: c._id.toString() }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Routes - Bills
app.get('/api/bills', async (req, res) => {
  try { res.json(mapId(await Bill.find())); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/bills', async (req, res) => {
  try {
    const data = req.body;
    let totalAmount = 0;
    const items = (data.items || []).map(item => {
      const q = item.qty || item.quantity || 1;
      const p = item.price || 0;
      totalAmount += (q * p);
      return { productId: item.productId, quantity: q, price: p, productName: item.productName };
    });
    
    const newBill = {
      customerId: data.customer?.name || data.customerId,
      date: new Date().toISOString(),
      totalAmount: data.totalAmount || totalAmount,
      paymentMethod: data.paymentMethod || 'CASH',
      items: items
    };

    const b = await new Bill(newBill).save(); 
    res.status(201).json({ ...b._doc, id: b._id.toString() }); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Routes - Users & Notifications
app.get('/api/users', async (req, res) => {
  try { res.json(mapId(await User.find())); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/notifications', async (req, res) => {
  try { res.json(mapId(await Notification.find())); } catch (err) { res.status(500).json({ error: err.message }); }
});

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

    // Calculate top products
    const productStats = {};
    bills.forEach(b => {
      (b.items || []).forEach(item => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { name: item.productName || 'Unknown', category: 'Uncategorized', revenue: 0, quantitySold: 0 };
        }
        const q = item.qty || item.quantity || 1;
        const p = item.price || 0;
        productStats[item.productId].revenue += (q * p);
        productStats[item.productId].quantitySold += q;
      });
    });
    
    // Fetch product categories from DB
    const productIds = Object.keys(productStats);
    const productsInDb = await Product.find({ _id: { $in: productIds } });
    productsInDb.forEach(p => {
       if (productStats[p._id.toString()]) {
          productStats[p._id.toString()].category = p.category || 'Uncategorized';
          productStats[p._id.toString()].name = p.name || 'Unknown';
       }
    });

    const top_products = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Calculate revenue trend (last 7 days)
    const revenue_trend = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
       const d = new Date(today);
       d.setDate(d.getDate() - i);
       const dateStr = d.toISOString().split('T')[0];
       const dayBills = bills.filter(b => b.date && b.date.startsWith(dateStr));
       const dayRev = dayBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
       revenue_trend.push({ date: dateStr, totalRevenue: dayRev });
    }

    res.json({
      summary: { total_revenue, total_orders, total_products_sold },
      revenue_trend,
      top_products
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

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    // Save user to MongoDB
    const newUser = await new User({ email, name, role: role || 'OWNER', status: 'ACTIVE' }).save();
    
    // Issue token immediately after signup
    const token = jwt.sign(
      { sub: email, role: newUser.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    res.status(201).json({ accessToken: token, refreshToken: "dummy_refresh_token", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
