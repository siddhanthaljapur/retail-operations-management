require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => { 
    const count = await mongoose.connection.db.collection('products').countDocuments(); 
    console.log('Products in DB:', count); 
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log('Barcodes:', products.map(p => p.barcode));
    process.exit(); 
  });
