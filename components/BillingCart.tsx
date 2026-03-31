interface CartItem {
  id: any;
  name_en: string;
  price: number;
  qty: number;
}
'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Printer, User, Phone } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BillingCart({ cart, setCart }: { cart: CartItem[], setCart: any }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const total = cart.reduce((sum: number, item: CartItem) => sum + (item.price * item.qty), 0);

  const handlePrint = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    if (!customerName) return alert("Please enter customer name!");

    const invoiceId = Date.now().toString().slice(-8); // ইউনিক ইনভয়েস আইডি

    // ১. সুপাবেস ডাটাবেজে অর্ডার সেভ করা
    const { error } = await supabase.from('orders').insert([
      {
        id: invoiceId,
        customer_name: customerName,
        customer_phone: customerPhone,
        total_amount: total,
        items: cart // এটি একটি JSON ফিল্ড হিসেবে সেভ হবে
      }
    ]);

    if (error) {
      console.error("Database Error:", error.message);
      return alert("Failed to save order!");
    }

    // ২. পিডিএফ (Invoice) জেনারেট করা
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("SEALAND OPS - INVOICE", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Invoice No: #${invoiceId}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 48);
    doc.text(`Customer: ${customerName}`, 20, 56);
    doc.text(`Phone: ${customerPhone}`, 20, 64);

    const tableData = cart.map(item => [item.name_en, `${item.price} TK`, item.qty, `${item.price * item.qty} TK`]);
    
    autoTable(doc,{
      startY: 75,
      head: [['Product', 'Price', 'Qty', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }
    });

    doc.text(`Total Amount: ${total} TK`, 140, (doc as any).lastAutoTable.finalY + 15);
    doc.save(`Invoice_${invoiceId}.pdf`);

    // ৩. কাজ শেষ হলে সব পরিষ্কার করা
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    alert("Order Completed Successfully!");
  };

  return (
    <div className="w-96 bg-[#0a0a0a] border border-gray-800 rounded-3xl p-6 flex flex-col h-fit sticky top-8 shadow-2xl">
      <h2 className="text-xl font-black mb-6 flex items-center gap-2">
        <Printer size={24} className="text-green-500" /> Billing Cart
      </h2>

      {/* কাস্টমার ইনফরমেশন ফর্ম */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <User className="absolute left-3 top-3 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Customer Name" 
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-black border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-green-500 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-3 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Phone Number" 
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full bg-black border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-green-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* কার্ট আইটেম লিস্ট */}
      <div className="flex-1 space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {cart.map((item: CartItem) => (
          <div key={item.id} className="flex justify-between items-center group bg-white/5 p-3 rounded-2xl border border-transparent hover:border-gray-800 transition-all">
            <div>
              <p className="font-bold text-sm">{item.name_en}</p>
              <p className="text-xs text-green-500">{item.price} TK x {item.qty}</p>
            </div>
            <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-gray-600 hover:text-red-500 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-400">Total Payable</span>
          <span className="text-2xl font-black text-white">{total} TK</span>
        </div>

        <button 
          onClick={handlePrint}
          className="w-full bg-green-500 hover:bg-green-600 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <Printer size={20} /> PRINT INVOICE
        </button>
      </div>
    </div>
  );
}