require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas for Seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

const customerSchema = new mongoose.Schema({}, { strict: false });
const Customer = mongoose.model('Customer', customerSchema);

const billSchema = new mongoose.Schema({}, { strict: false });
const Bill = mongoose.model('Bill', billSchema);

const mockData = {
  products: [
    { name: 'MacBook Pro 16"', category: 'Laptops', barcode: '8901234567890', price: 2499.99, costPrice: 2000, quantity: 15, reorderLevel: 5 },
    { name: 'iPhone 15 Pro', category: 'Smartphones', barcode: '8901234567891', price: 999.99, costPrice: 800, quantity: 42, reorderLevel: 10 },
    { name: 'AirPods Pro 2', category: 'Accessories', barcode: '8901234567892', price: 249.99, costPrice: 150, quantity: 120, reorderLevel: 20 },
    { name: 'iPad Air', category: 'Tablets', barcode: '8901234567893', price: 599.99, costPrice: 450, quantity: 30, reorderLevel: 8 },
  ],
  customers: [
    { name: 'Alice Smith', email: 'alice@example.com', phone: '555-0101', loyaltyPoints: 120, totalPurchases: 1500 },
    { name: 'Bob Johnson', email: 'bob@example.com', phone: '555-0102', loyaltyPoints: 340, totalPurchases: 4200 },
  ],
  bills: [
    { customerId: 'c1', date: new Date().toISOString(), totalAmount: 1249.98, paymentMethod: 'CARD', items: [{ productId: 'p2', quantity: 1, price: 999.99 }, { productId: 'p3', quantity: 1, price: 249.99 }] }
  ]
};

async function seed() {
  await Product.deleteMany({});
  await Customer.deleteMany({});
  await Bill.deleteMany({});

  await Product.insertMany(mockData.products);
  await Customer.insertMany(mockData.customers);
  await Bill.insertMany(mockData.bills);

  console.log('Seeded database with sample data.');
  process.exit();
}
seed();
