require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas for Seeding Barcodes'))
  .catch(err => console.error('MongoDB connection error:', err));

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

const realProducts = [
  { 
    name: 'Dettol Original Liquid Handwash 100ml', 
    category: 'Hygiene', 
    barcode: '8901396315803', 
    price: 35.00, 
    costPrice: 25.00, 
    quantity: 50, 
    reorderLevel: 10 
  },
  { 
    name: 'Bombay Shaving Company Power Styler', 
    category: 'Personal Care', 
    barcode: '8904330603615', 
    price: 999.00, 
    costPrice: 600.00, 
    quantity: 15, 
    reorderLevel: 5 
  },
  { 
    name: 'Kz Plus Medicated Soap 50g', 
    category: 'Pharmacy', 
    barcode: '8906058357559', 
    price: 125.00, 
    costPrice: 90.00, 
    quantity: 30, 
    reorderLevel: 10 
  },
  { 
    name: 'Dettol Instant Hand Sanitizer 50ml', 
    category: 'Hygiene', 
    barcode: '8901396381501', 
    price: 50.00, 
    costPrice: 35.00, 
    quantity: 100, 
    reorderLevel: 20 
  },
  { 
    name: 'Plum Coconut Milk & Peptides Shampoo 250ml', 
    category: 'Hair Care', 
    barcode: '8904430200813', 
    price: 350.00, 
    costPrice: 200.00, 
    quantity: 25, 
    reorderLevel: 5 
  }
];

async function seedRealBarcodes() {
  await Product.insertMany(realProducts);
  console.log('Seeded real barcode products into the database!');
  process.exit();
}
seedRealBarcodes();
