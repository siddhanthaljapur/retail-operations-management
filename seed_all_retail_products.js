require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const productSchema = new mongoose.Schema({
  name: String, category: String, barcode: String,
  price: Number, costPrice: Number, quantity: Number,
  reorderLevel: Number, imageUrl: String
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

const masterProducts = [
  // 1. Real products from user photos
  { name: 'Dettol Original Liquid Handwash 100ml', category: 'Hygiene', barcode: '8901396315803', price: 35.00, costPrice: 25.00, quantity: 50, reorderLevel: 10 },
  { name: 'Bombay Shaving Company Power Styler', category: 'Personal Care', barcode: '8904330603615', price: 999.00, costPrice: 600.00, quantity: 15, reorderLevel: 5 },
  { name: 'Kz Plus Medicated Soap 50g', category: 'Pharmacy', barcode: '8906058357559', price: 125.00, costPrice: 90.00, quantity: 30, reorderLevel: 10 },
  { name: 'Dettol Instant Hand Sanitizer 50ml', category: 'Hygiene', barcode: '8901396381501', price: 50.00, costPrice: 35.00, quantity: 100, reorderLevel: 20 },
  { name: 'Plum Coconut Milk & Peptides Shampoo 250ml', category: 'Hair Care', barcode: '8904430200813', price: 350.00, costPrice: 200.00, quantity: 25, reorderLevel: 5 },

  // 2. Additional popular supermarket stock items
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

async function seedAll() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas...');

    // Remove old duplicates
    await Product.deleteMany({});
    console.log('Cleared old product records.');

    // Insert master products
    const inserted = await Product.insertMany(masterProducts);
    console.log(`Successfully seeded ${inserted.length} master products into MongoDB Atlas!`);
    
    inserted.forEach((p, idx) => {
      console.log(`${idx + 1}. [${p.barcode}] ${p.name} - ₹${p.price} (Qty: ${p.quantity})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedAll();
