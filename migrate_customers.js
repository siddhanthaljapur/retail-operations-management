require('dotenv').config();
const mongoose = require('mongoose');
const URI = 'mongodb+srv://kiaseltos5786_db_user:cfTN2zMIVvZlzN0h@cluster0.cdwnoho.mongodb.net/?appName=Cluster0';

mongoose.connect(URI).then(async () => {
  const Bill = mongoose.model('Bill', new mongoose.Schema({}, { strict: false }));
  const Customer = mongoose.model('Customer', new mongoose.Schema({ name: String, email: String, phone: String, totalPurchases: Number }, { strict: false }));
  
  const bills = await Bill.find({});
  let added = 0;
  for (let b of bills) {
    let cname = b.get('customerId') || 'Walk-in Customer';
    // skip if it's already an ObjectId
    if (mongoose.isValidObjectId(cname)) continue;

    let cust = await Customer.findOne({ name: cname });
    if (!cust) {
      cust = await new Customer({ name: cname, totalPurchases: 1 }).save();
      added++;
    } else {
      cust.totalPurchases = (cust.totalPurchases || 0) + 1;
      await cust.save();
    }
    await Bill.updateOne({ _id: b._id }, { $set: { customerId: cust._id.toString() } });
  }
  console.log(`Added ${added} customers from existing bills!`);
  process.exit();
});
