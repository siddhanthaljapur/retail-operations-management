const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream('C:/Users/siddh/.gemini/antigravity-ide/brain/72b9a0a6-da44-4aef-a7f8-b4cd041f8c20/sample_invoice.pdf'));

doc.fontSize(20).text('Supplier Invoice', { align: 'center' });
doc.moveDown();

doc.fontSize(12)
   .text('INVOICE NO: #INV-2026-90812')
   .text('DATE: 02-Oct-2026')
   .text('SUPPLIER: MegaCorp Wholesale Distributors Ltd.')
   .text('ADDRESS: 124 Industrial Park, Mumbai, India');
doc.moveDown();

doc.text('BILL TO:');
doc.text('Smart Retail Systems');
doc.text('Shop No. 4, Main Street');
doc.text('Mumbai');
doc.moveDown(2);

doc.fontSize(14).text('ITEM DETAILS:', { underline: true });
doc.moveDown();

const items = [
  { barcode: '8901396315803', name: 'Dettol Original Liquid Handwash 100ml', qty: 24, price: 22.50, total: 540.00 },
  { barcode: '8904330603615', name: 'Bombay Shaving Company Power Styler', qty: 10, price: 550.00, total: 5500.00 },
  { barcode: '8904430200813', name: 'Plum Coconut Milk Shampoo', qty: 12, price: 180.00, total: 2160.00 }
];

items.forEach(item => {
  doc.fontSize(12).font('Helvetica-Bold').text(`Barcode: ${item.barcode}`);
  doc.font('Helvetica').text(`Item: ${item.name}`);
  doc.text(`Qty: ${item.qty}   |   Unit Cost: Rs. ${item.price}   |   Total: Rs. ${item.total}`);
  doc.moveDown();
});

doc.moveDown();
doc.fontSize(14).font('Helvetica-Bold')
   .text('Subtotal: Rs. 8,200.00', { align: 'right' })
   .text('Tax (18% GST): Rs. 1,476.00', { align: 'right' })
   .text('GRAND TOTAL: Rs. 9,676.00', { align: 'right' });

doc.end();
console.log('PDF Generated');
