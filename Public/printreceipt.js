// printer-server.js (Full backend print server with JK-5802H integration)

const express = require('express');
const cors = require('cors');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ESC/POS receipt print function for JK-5802H
function printReceipt(debtor, productName, amountPaid, newTotalDebt) {
  const device = new escpos.USB();
  const printer = new escpos.Printer(device);

  device.open((error) => {
    if (error) {
      console.error('🛑 Printer connection error:', error);
      return;
    }

    const dateTime = new Date().toLocaleString();

    printer
      .initialize()
      .align('CT')
      .text('*** DEBT RECEIPT ***')
      .text('========================')
      .align('LT')
      .text(`Name: ${debtor.name}`)
      .text(`Contact: ${debtor.contact || 'N/A'}`)
      .text(`Date: ${dateTime}`)
      .text('------------------------')
      .text(`Product: ${productName}`)
      .text(`Paid: ₱${amountPaid.toFixed(2)}`)
      .text(`Balance: ₱${newTotalDebt.toFixed(2)}`)
      .text('------------------------')
      .align('CT')
      .text('Thank you for your payment!')
      .text('')
      .cut()
      .close();
  });
}

// API endpoint to trigger the print job
app.post('/print-receipt', (req, res) => {
  const { debtor, productName, amountPaid, newTotalDebt } = req.body;

  if (!debtor || !productName || amountPaid === undefined || newTotalDebt === undefined) {
    return res.status(400).json({ error: 'Missing data for receipt' });
  }

  printReceipt(debtor, productName, amountPaid, newTotalDebt);
  res.status(200).json({ success: true });
});

// Start the print server
app.listen(PORT, () => {
  console.log(`🖨️  Printer server is running at http://localhost:${PORT}`);
});
