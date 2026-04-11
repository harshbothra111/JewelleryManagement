import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  
  printTaxInvoice(data: any): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the tax invoice.');
      return;
    }

    // Normalize data between invoice-form and order items
    const customer = data.formData || data;
    const items = customer.items || [];
    const totals = data.totals || {
      subTotal: data.subTotal || 0,
      cgst: data.cgstAmount || 0,
      sgst: data.sgstAmount || 0,
      grandTotal: data.grandTotal || 0
    };
    
    // Fallback for ID and Date
    const id = data.id || Math.floor(Math.random() * 10000);
    const date = data.date || new Date().toLocaleDateString();

    let itemsHtml = '';
    // Check if any item has makingCharges to show the column header conditionally
    const hasMakingCharges = items.some((i: any) => i.makingCharges !== undefined && i.makingCharges !== null);

    items.forEach((item: any, index: number) => {
      const qty = parseFloat(item.quantity || 0).toFixed(3);
      const rate = parseFloat(item.rate || 0).toFixed(2);
      const amt = parseFloat(item.amount || 0).toFixed(2);

      let extraCol = '';
      if (hasMakingCharges) {
        const makingChg = parseFloat(item.makingCharges || 0).toFixed(2);
        extraCol = `<td style="text-align:right;">Rs. ${makingChg}</td>`;
      }

      itemsHtml += `<tr>
        <td style="text-align:center;">${index + 1}</td>
        <td>${item.itemName}</td>
        <td>${item.type}</td>
        <td style="text-align:right;">${qty}</td>
        <td style="text-align:right;">Rs. ${rate}</td>
        ${extraCol}
        <td style="text-align:right;">Rs. ${amt}</td>
      </tr>`;
    });

    const subTotal = (parseFloat(totals.subTotal) || 0).toFixed(2);
    const cgstAmount = (parseFloat(totals.cgst) || 0).toFixed(2);
    const sgstAmount = (parseFloat(totals.sgst) || 0).toFixed(2);
    const grandTotal = (parseFloat(totals.grandTotal) || 0).toFixed(2);

    const htmlContent = `<html>
<head>
  <title>Tax Invoice</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1a252f; padding-bottom: 20px; margin-bottom: 30px; }
    .brand h1 { margin: 0; color: #c0392b; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; }
    .brand p { margin: 5px 0 0; color: #7f8c8d; font-size: 13px; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { margin: 0; color: #1a252f; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-title p { margin: 5px 0 0; color: #7f8c8d; font-size: 14px; }

    .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; border: 1px solid #ecf0f1; border-radius: 5px; padding: 15px; background: #fafbfc; }
    .info-box { width: 48%; }
    .info-box h4 { margin-top: 0; margin-bottom: 10px; color: #2c3e50; font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .info-box p { margin: 5px 0; font-size: 14px; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background-color: #1a252f; color: white; padding: 12px 10px; text-align: left; font-size: 13px; text-transform: uppercase; }
    td { border-bottom: 1px solid #e9ecef; padding: 12px 10px; font-size: 14px; }
    tr:nth-child(even) { background-color: #f8f9fa; }

    .summary-section { width: 320px; float: right; background: #fafbfc; padding: 15px; border-radius: 5px; border: 1px solid #ecf0f1; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
    .summary-row.total { font-weight: bold; font-size: 18px; border-top: 2px solid #bdc3c7; padding-top: 10px; color: #c0392b; margin-top: 5px; }

    .footer { clear: both; margin-top: 60px; text-align: center; font-size: 13px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>Jewellery Shop</h1>
      <p>123 Diamond Avenue, Gold City</p>
      <p>GSTIN: 22AAAAA0000A1Z5</p>
    </div>
    <div class="invoice-title">
      <h2>Tax Invoice</h2>
      <p><strong>Invoice No:</strong> INV-${id}</p>
      <p><strong>Date:</strong> ${date}</p>
    </div>
  </div>

  <div class="info-section">
    <div class="info-box">
      <h4>Billed To</h4>
      <p style="font-weight:bold; font-size:16px;">${customer.customerName}</p>
      <p><strong>Phone:</strong> ${customer.customerPhone}</p>
      ${customer.customerAddress ? `<p><strong>Address:</strong> ${customer.customerAddress}</p>` : ''}
    </div>
    <div class="info-box">
      <h4>Order Details</h4>
      ${data.id ? `<p><strong>Order ID:</strong> #${data.id}</p>` : `<p><strong>Type:</strong> Direct Walk-in</p>`}
      ${data.status ? `<p><strong>Status:</strong> ${data.status}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:center; width:5%;">#</th>
        <th>Item Description</th>
        <th>Type</th>
        <th style="text-align:right;">Weight (gm)</th>
        <th style="text-align:right;">Rate/gm</th>
        ${hasMakingCharges ? `<th style="text-align:right;">Making Chg.</th>` : ''}
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="summary-section">
    <div class="summary-row"><span>Taxable Value:</span> <span>Rs. ${subTotal}</span></div>
    <div class="summary-row" style="color:#7f8c8d;"><span>CGST (1.5%):</span> <span>Rs. ${cgstAmount}</span></div>
    <div class="summary-row" style="color:#7f8c8d;"><span>SGST (1.5%):</span> <span>Rs. ${sgstAmount}</span></div>
    <div class="summary-row total"><span>Invoice Total:</span> <span>Rs. ${grandTotal}</span></div>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Terms & Conditions apply. This is a computer generated invoice.</p>
  </div>
  <script>window.onload=function(){window.print();};</script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  printOrder(orderData: any): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Allow popups to print the order.');
      return;
    }
    
    let itemsHtml = '';
    orderData.items.forEach((item: any, i: number) => {
      itemsHtml += `<tr><td style="text-align:center;">${i+1}</td><td>${item.itemName}</td><td>${item.type}</td><td style="text-align:right;">${parseFloat(item.quantity).toFixed(3)}</td><td style="text-align:right;">Rs. ${parseFloat(item.rate).toFixed(2)}</td><td style="text-align:right;">Rs. ${parseFloat(item.amount).toFixed(2)}</td></tr>`;
    });
    const subTotal = (orderData.subTotal || 0).toFixed(2);
    const cgstAmount = (orderData.cgstAmount || 0).toFixed(2);
    const sgstAmount = (orderData.sgstAmount || 0).toFixed(2);
    const grandTotal = (orderData.grandTotal || 0).toFixed(2);

    const htmlContent = `<html>
<head><title>Order Receipt</title>
<style>
body { font-family: monospace; padding: 20px; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
th { background-color: #f2f2f2; text-align: left; }
.totals { margin-top: 20px; text-align: right; }
</style>
</head>
<body>
<h2>Jewellery Order Receipt</h2>
<p><strong>Customer:</strong> ${orderData.customerName} (${orderData.customerPhone})</p>
${orderData.goldsmithName ? `<p><strong>Karigar:</strong> ${orderData.goldsmithName}</p>` : ''}
<table>
  <thead><tr><th>S.No</th><th>Item</th><th>Type</th><th>Weight(gm)</th><th>Rate/gm</th><th>Amount</th></tr></thead>
  <tbody>${itemsHtml}</tbody>
</table>
<div class="totals">
  <p>Sub Total: Rs. ${subTotal}</p>
  <p>CGST (1.5%): Rs. ${cgstAmount}</p>
  <p>SGST (1.5%): Rs. ${sgstAmount}</p>
  <h3>Grand Total: Rs. ${grandTotal}</h3>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}