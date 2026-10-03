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

// Auto-seed real product barcodes if not present
const defaultRealProducts = [
  { name: 'Dettol Original Liquid Handwash 100ml', category: 'Hygiene', barcode: '8901396315803', price: 35.00, costPrice: 25.00, quantity: 50, reorderLevel: 10 },
  { name: 'Bombay Shaving Company Power Styler', category: 'Personal Care', barcode: '8904330603615', price: 999.00, costPrice: 600.00, quantity: 15, reorderLevel: 5 },
  { name: 'Kz Plus Medicated Soap 50g', category: 'Pharmacy', barcode: '8906058357559', price: 125.00, costPrice: 90.00, quantity: 30, reorderLevel: 10 },
  { name: 'Dettol Instant Hand Sanitizer 50ml', category: 'Hygiene', barcode: '8901396381501', price: 50.00, costPrice: 35.00, quantity: 100, reorderLevel: 20 },
  { name: 'Plum Coconut Milk & Peptides Shampoo 250ml', category: 'Hair Care', barcode: '8904430200813', price: 350.00, costPrice: 200.00, quantity: 25, reorderLevel: 5 },
  { name: 'Amul Butter 500g Pack', category: 'Dairy', barcode: '8901262010052', price: 275.00, costPrice: 240.00, quantity: 40, reorderLevel: 10 },
  { name: 'Fortune Sunlite Sunflower Oil 1L', category: 'Grocery', barcode: '8906007280014', price: 160.00, costPrice: 135.00, quantity: 35, reorderLevel: 8 },
  { name: 'Lays Magic Masala Chips 50g', category: 'Snacks', barcode: '8901491101851', price: 20.00, costPrice: 16.00, quantity: 120, reorderLevel: 30 },
  { name: 'Tata Tea Gold Premium 500g', category: 'Beverages', barcode: '8901052000030', price: 340.00, costPrice: 290.00, quantity: 25, reorderLevel: 5 },
  { name: 'Colgate Strong Teeth Toothpaste 200g', category: 'Personal Care', barcode: '8901314008510', price: 100.00, costPrice: 82.00, quantity: 60, reorderLevel: 15 },
  { name: 'Coca Cola Soft Drink 750ml Bottle', category: 'Beverages', barcode: '8901764012213', price: 40.00, costPrice: 32.00, quantity: 80, reorderLevel: 20 },
  { name: 'Red Bull Energy Drink 250ml Can', category: 'Beverages', barcode: '9002490204899', price: 125.00, costPrice: 95.00, quantity: 45, reorderLevel: 10 },
  { name: 'Bisleri Mineral Water 1L Bottle', category: 'Beverages', barcode: '8906002000010', price: 20.00, costPrice: 14.00, quantity: 150, reorderLevel: 40 },
  { name: 'Surf Excel Easy Wash Detergent 1kg', category: 'Household', barcode: '8901030352120', price: 155.00, costPrice: 125.00, quantity: 30, reorderLevel: 10 }
];

mongoose.connection.once('open', async () => {
  try {
    for (const prod of defaultRealProducts) {
      const exists = await Product.findOne({ barcode: prod.barcode });
      if (!exists) {
        await new Product(prod).save();
        console.log(`Auto-seeded product barcode: ${prod.barcode} (${prod.name})`);
      }
    }
  } catch (err) {
    console.warn("Auto-seed error:", err.message);
  }
});

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
    const rawCode = (req.params.barcode || '').trim();
    const cleanCode = rawCode.replace(/[\s\-]/g, '');

    let p = await Product.findOne({ barcode: rawCode });
    if (!p && cleanCode) {
      p = await Product.findOne({ 
        $or: [
          { barcode: { $regex: new RegExp(`^${cleanCode}$`, 'i') } },
          { barcode: { $regex: new RegExp(`^${rawCode}$`, 'i') } }
        ] 
      });
    }

    if (!p) return res.status(404).json({ error: 'Product not found for barcode: ' + rawCode });
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
app.post('/api/products/batch-sync', async (req, res) => {
  try {
    const { items = [] } = req.body;
    let updatedCount = 0;
    let createdCount = 0;
    const processedProducts = [];

    for (const item of items) {
      const qtyToAdd = Number(item.quantity || 1);
      const costP = Number(item.costPrice || 0);
      const sellP = Number(item.price || Math.round(costP * 1.25));

      let existing = null;
      if (item.barcode) {
        existing = await Product.findOne({ barcode: item.barcode });
      }
      if (!existing && item.name) {
        existing = await Product.findOne({ name: { $regex: new RegExp(`^${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      }

      if (existing) {
        existing.quantity = (existing.quantity || 0) + qtyToAdd;
        if (costP > 0) existing.costPrice = costP;
        if (sellP > 0) existing.price = sellP;
        if (item.category && item.category !== 'General') existing.category = item.category;
        await existing.save();
        updatedCount++;
        processedProducts.push({ ...existing._doc, id: existing._id.toString(), productId: existing._id.toString() });
      } else {
        const newP = new Product({
          name: item.name || 'Scanned Wholesaler Product',
          category: item.category || 'General',
          barcode: item.barcode || `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          price: sellP,
          costPrice: costP,
          quantity: qtyToAdd,
          reorderLevel: item.reorderLevel || 5
        });
        await newP.save();
        createdCount++;
        processedProducts.push({ ...newP._doc, id: newP._id.toString(), productId: newP._id.toString() });
      }
    }

    // Auto-create notification for inventory update
    try {
      await new Notification({
        message: `AI Bill Scanner: Imported bill with ${items.length} items (${updatedCount} updated, ${createdCount} created).`,
        date: new Date().toISOString(),
        read: false,
        type: 'INVENTORY'
      }).save();
    } catch (e) {
      console.warn("Could not save notification:", e.message);
    }

    res.status(200).json({
      success: true,
      updatedCount,
      createdCount,
      totalSynced: processedProducts.length,
      products: processedProducts
    });
  } catch (err) {
    console.error("Error in /api/products/batch-sync:", err);
    res.status(500).json({ error: err.message });
  }
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
    
    let customerName = data.customer?.name || data.customerId || 'Walk-in Customer';
    let customerEmail = data.customer?.email || '';
    let customerPhone = data.customer?.mobile || '';

    // Auto-create or update customer
    let cust = null;
    if (customerPhone) {
      cust = await Customer.findOne({ phone: customerPhone });
    } else if (customerEmail) {
      cust = await Customer.findOne({ email: customerEmail });
    } else {
      cust = await Customer.findOne({ name: customerName });
    }

    if (!cust) {
      cust = await new Customer({ name: customerName, email: customerEmail, phone: customerPhone, totalPurchases: 1 }).save();
    } else {
      cust.totalPurchases = (cust.totalPurchases || 0) + 1;
      await cust.save();
    }

    const newBill = {
      customerId: cust._id.toString(), // Store actual customer ID
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
