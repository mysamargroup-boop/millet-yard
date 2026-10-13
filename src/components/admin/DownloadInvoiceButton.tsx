'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

interface InvoiceProps {
  order: any;
  items: any[];
  siteSettings?: any;
}

const DownloadInvoiceButton: React.FC<InvoiceProps> = ({ order, items, siteSettings }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    const siteName = siteSettings?.site_name || 'Millet Yard';
    const siteEmail = siteSettings?.contact_email || 'support@milletyard.com';
    const sitePhone = siteSettings?.contact_phone || '';

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text(siteName, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('TAX INVOICE', 160, 22);

    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text(`Invoice No: INV-${order.external_order_id}`, 14, 35);
    doc.text(`Date: ${format(new Date(order.created_at), 'dd MMM yyyy')}`, 14, 40);
    doc.text(`Payment: ${order.payment_method} (${order.payment_status})`, 14, 45);

    // Bill To
    doc.setFontSize(12);
    doc.text('Bill To:', 14, 60);
    doc.setFontSize(10);
    doc.text(order.customer_name || 'Customer', 14, 66);
    doc.text(order.customer_phone || '', 14, 71);
    doc.text(order.customer_email || '', 14, 76);
    
    // Split address into lines if long
    const addressLines = doc.splitTextToSize(order.customer_address || '', 80);
    doc.text(addressLines, 14, 81);

    // Company Details
    doc.setFontSize(10);
    doc.text(siteEmail, 150, 66, { align: 'right' });
    doc.text(sitePhone, 150, 71, { align: 'right' });

    // Table
    const tableData = items.map((item, index) => [
      index + 1,
      item.product_name,
      item.quantity,
      `INR ${item.unit_price.toFixed(2)}`,
      `INR ${(item.unit_price * item.quantity).toFixed(2)}`
    ]);

    (doc as any).autoTable({
      startY: 95,
      head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 9 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.text(`Subtotal: INR ${order.subtotal_amount?.toFixed(2) || '0.00'}`, 140, finalY);
    
    let currentY = finalY + 7;
    if (order.discount_amount > 0) {
      doc.text(`Discount: - INR ${order.discount_amount.toFixed(2)}`, 140, currentY);
      currentY += 7;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: INR ${order.total_amount?.toFixed(2) || '0.00'}`, 140, currentY + 5);

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });

    doc.save(`Invoice-${order.external_order_id}.pdf`);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-2"
      onClick={generatePDF}
    >
      <Download className="w-4 h-4" />
      Download Invoice
    </Button>
  );
};

export default DownloadInvoiceButton;
