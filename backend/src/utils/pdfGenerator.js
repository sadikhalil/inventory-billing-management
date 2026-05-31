'use strict';

const PDFDocument = require('pdfkit');

/**
 * Generate a professional PDF invoice buffer using pdfkit.
 * @param {Object} invoice - Populated Invoice mongoose document
 * @returns {Promise<Buffer>}
 */
const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width - 100; // usable width
    const company = {
      name: process.env.PDF_COMPANY_NAME || 'InvoTrack Co.',
      address: process.env.PDF_COMPANY_ADDRESS || '123 Business Ave',
      city: process.env.PDF_COMPANY_CITY || 'New York, NY 10001',
      email: process.env.PDF_COMPANY_EMAIL || 'billing@invotrack.com',
      phone: process.env.PDF_COMPANY_PHONE || '+1 (555) 000-0000',
    };

    // ── Helpers ─────────────────────────────────────────
    const currency = (n) => `$${(+n || 0).toFixed(2)}`;
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

    // ── Header ───────────────────────────────────────────
    doc.fillColor('#185FA5').fontSize(22).font('Helvetica-Bold').text(company.name, 50, 50);
    doc.fillColor('#555').fontSize(9).font('Helvetica')
      .text(company.address, 50, 78)
      .text(company.city, 50, 91)
      .text(`${company.email}  ·  ${company.phone}`, 50, 104);

    // Invoice title + meta (right side)
    doc.fillColor('#185FA5').fontSize(28).font('Helvetica-Bold').text('INVOICE', 0, 50, { align: 'right' });
    doc.fillColor('#333').fontSize(10).font('Helvetica')
      .text(`Invoice #: ${invoice.invoiceNumber}`, 0, 88, { align: 'right' })
      .text(`Issue date: ${fmtDate(invoice.issueDate)}`, 0, 103, { align: 'right' })
      .text(`Due date: ${fmtDate(invoice.dueDate)}`, 0, 118, { align: 'right' })
      .text(`Status: ${invoice.status.toUpperCase()}`, 0, 133, { align: 'right' });

    // ── Divider ──────────────────────────────────────────
    doc.moveTo(50, 148).lineTo(545, 148).strokeColor('#185FA5').lineWidth(2).stroke();

    // ── Bill To ──────────────────────────────────────────
    doc.fillColor('#888').fontSize(9).font('Helvetica-Bold').text('BILL TO', 50, 162);
    const c = invoice.customer;
    doc.fillColor('#222').fontSize(11).font('Helvetica-Bold').text(c.name, 50, 177);
    let y = 193;
    if (c.company) { doc.fillColor('#444').fontSize(10).font('Helvetica').text(c.company, 50, y); y += 14; }
    if (c.email) { doc.text(c.email, 50, y); y += 14; }
    if (c.phone) { doc.text(c.phone, 50, y); y += 14; }
    if (c.address) { doc.text(c.address, 50, y); y += 14; }
    if (c.taxId) { doc.text(`Tax ID: ${c.taxId}`, 50, y); }

    // Payment terms (right)
    doc.fillColor('#888').fontSize(9).font('Helvetica-Bold').text('PAYMENT TERMS', 0, 162, { align: 'right' });
    doc.fillColor('#222').fontSize(10).font('Helvetica')
      .text((invoice.paymentTerms || 'Net 30').replace(/_/g, ' ').toUpperCase(), 0, 177, { align: 'right' });

    // ── Items Table ──────────────────────────────────────
    const tableTop = 280;
    const colX = { desc: 50, qty: 310, price: 365, disc: 420, tax: 460, total: 490 };

    // Header row
    doc.rect(50, tableTop, W, 22).fill('#185FA5');
    doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold');
    doc.text('DESCRIPTION', colX.desc + 4, tableTop + 7);
    doc.text('QTY', colX.qty, tableTop + 7, { width: 50, align: 'right' });
    doc.text('UNIT PRICE', colX.price, tableTop + 7, { width: 50, align: 'right' });
    doc.text('DISC%', colX.disc, tableTop + 7, { width: 35, align: 'right' });
    doc.text('TAX%', colX.tax, tableTop + 7, { width: 30, align: 'right' });
    doc.text('AMOUNT', colX.total, tableTop + 7, { width: 55, align: 'right' });

    // Item rows
    let rowY = tableTop + 22;
    doc.font('Helvetica').fontSize(9);
    invoice.items.forEach((item, idx) => {
      const rowH = 20;
      if (idx % 2 === 0) doc.rect(50, rowY, W, rowH).fill('#F5F8FC');
      else doc.rect(50, rowY, W, rowH).fill('#FFFFFF');

      doc.fillColor('#222');
      doc.text(item.description || '—', colX.desc + 4, rowY + 6, { width: 250 });
      doc.text(String(item.quantity), colX.qty, rowY + 6, { width: 50, align: 'right' });
      doc.text(currency(item.unitPrice), colX.price, rowY + 6, { width: 50, align: 'right' });
      doc.text(`${item.discount || 0}%`, colX.disc, rowY + 6, { width: 35, align: 'right' });
      doc.text(`${item.taxRate || 0}%`, colX.tax, rowY + 6, { width: 30, align: 'right' });
      doc.text(currency(item.amount), colX.total, rowY + 6, { width: 55, align: 'right' });
      rowY += rowH;
    });

    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor('#DDD').lineWidth(1).stroke();

    // ── Totals ────────────────────────────────────────────
    rowY += 12;
    const totalX = 380;
    const valX = 490;

    const addTotalRow = (label, value, bold = false, color = '#333') => {
      if (bold) doc.font('Helvetica-Bold').fontSize(11);
      else doc.font('Helvetica').fontSize(9);
      doc.fillColor('#777').text(label, totalX, rowY, { width: 100 });
      doc.fillColor(color).text(value, valX, rowY, { width: 55, align: 'right' });
      rowY += bold ? 16 : 14;
    };

    addTotalRow('Subtotal', currency(invoice.subtotal));
    if (invoice.discountAmount > 0) addTotalRow('Discount', `-${currency(invoice.discountAmount)}`, false, '#D85A30');
    if (invoice.taxAmount > 0) addTotalRow('Tax', currency(invoice.taxAmount));
    rowY += 4;
    doc.moveTo(totalX, rowY).lineTo(545, rowY).strokeColor('#185FA5').lineWidth(1.5).stroke();
    rowY += 6;
    addTotalRow('TOTAL DUE', currency(invoice.total), true, '#185FA5');
    if (invoice.amountPaid > 0) {
      addTotalRow('Amount paid', `-${currency(invoice.amountPaid)}`, false, '#1D9E75');
      addTotalRow('Balance due', currency(invoice.balanceDue), true, '#E24B4A');
    }

    // ── Notes / Terms ─────────────────────────────────────
    rowY += 20;
    if (invoice.notes) {
      doc.fillColor('#888').fontSize(8).font('Helvetica-Bold').text('NOTES', 50, rowY);
      rowY += 12;
      doc.fillColor('#444').fontSize(9).font('Helvetica').text(invoice.notes, 50, rowY, { width: 350 });
      rowY += 24;
    }
    if (invoice.terms) {
      doc.fillColor('#888').fontSize(8).font('Helvetica-Bold').text('TERMS & CONDITIONS', 50, rowY);
      rowY += 12;
      doc.fillColor('#444').fontSize(9).font('Helvetica').text(invoice.terms, 50, rowY, { width: 450 });
    }

    // ── Footer ────────────────────────────────────────────
    doc.moveTo(50, doc.page.height - 50).lineTo(545, doc.page.height - 50).strokeColor('#185FA5').lineWidth(1).stroke();
    doc.fillColor('#888').fontSize(8).font('Helvetica')
      .text(`Thank you for your business! · Generated by ${company.name} · ${new Date().toISOString()}`,
        50, doc.page.height - 38, { align: 'center', width: W });

    doc.end();
  });
};

module.exports = { generateInvoicePDF };