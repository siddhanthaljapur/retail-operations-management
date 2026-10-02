require('dotenv').config();
const mongoose = require('mongoose');
const URI = 'mongodb+srv://kiaseltos5786_db_user:cfTN2zMIVvZlzN0h@cluster0.cdwnoho.mongodb.net/?appName=Cluster0';

mongoose.connect(URI).then(async () => {
  const Bill = mongoose.model('Bill', new mongoose.Schema({}, { strict: false }));
  const bills = await Bill.find({});
  let updated = 0;
  for (let b of bills) {
    let total = 0;
    let items = b.get('items') || [];
    items = items.map(item => {
      const q = item.qty || item.quantity || 1;
      const p = item.price || 0;
      total += (q * p);
      return { ...item, quantity: q };
    });
    await Bill.updateOne({ _id: b._id }, { $set: { items: items, totalAmount: total }});
    updated++;
  }
  console.log(`Fixed ${updated} bills!`);
  process.exit();
});
