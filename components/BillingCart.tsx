'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Printer, User, Phone, Loader2, ShoppingBag } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CartItem {
  id: any;
  name_en: string;
  price: number;
  qty: number;
}

export default function BillingCart({ cart, setCart }: { cart: CartItem[], setCart: any }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const total = cart.reduce((sum: number, item: CartItem) => sum + (item.price * item.qty), 0);

  const handlePrint = async () => {
    if (cart.length === 0) return alert("আপনার কার্টটি খালি!");
    if (!customerName.trim()) return alert("দয়া করে কাস্টমারের নাম লিখুন।");
    if (customerPhone.length < 11) return alert("সঠিক মোবাইল নাম্বার দিন।");

    setIsProcessing(true);
    try {
      const invoiceId = `SL-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from('orders').insert([
        {
          id: invoiceId,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          total_amount: total,
          status: 'completed',
          items: cart 
        }
      ]);

      if (error) throw error;

      const doc = new jsPDF();
      doc.setFillColor(30, 58, 138); 
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("SEALAND AGRO", 105, 20, { align: "center" });
      doc.setFontSize(10);
      doc.text("A COMMITMENT TO FRESHNESS!", 105, 28, { align: "center" });

      doc.setTextColor(0, 0, 0);
      doc.text(`INVOICE NO: #${invoiceId}`, 15, 50);
      doc.text(`CUSTOMER: ${customerName.toUpperCase()}`, 15, 62);

      const tableData = cart.map((item, index) => [
        String(index + 1).padStart(2, '0'),
        item.name_en,
        `${item.price} TK`,
        item.qty,
        `${(item.price * item.qty).toFixed(2)} TK`
      ]);
      
      autoTable(doc, {
        startY: 75,
        head: [['SL', 'Product Name', 'Price', 'Qty', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
        styles: { fontSize: 9 }
      });

      doc.save(`Invoice_${invoiceId}.pdf`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      alert("অর্ডার সফলভাবে সম্পন্ন হয়েছে!");

    } catch (err: any) {
      console.error(err.message);
      alert("দুঃখিত! আবার চেষ্টা করুন।");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    /* পরিবর্তন: w-96 এর বদলে w-full এবং max-w-md ব্যবহার করা হয়েছে */
    <div className="w-full max-w-md mx-auto bg-[#0a0a0a] border border-gray-800 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 flex flex-col h-fit md:sticky md:top-8 shadow-2xl overflow-hidden mb-10">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg md:text-xl font-black flex items-center gap-2 italic uppercase tracking-tighter">
          <ShoppingBag size={20} className="text-green-500" /> Billing Cart
        </h2>
        <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black text-gray-500">{cart.length} ITEMS</span>
      </div>

      {/* কাস্টমার ইনফরমেশন */}
      <div className="space-y-3 mb-6">
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-green-500 transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="CUSTOMER NAME" 
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 md:py-3.5 pl-11 pr-4 text-[10px] md:text-[11px] font-bold uppercase tracking-widest focus:border-green-500 outline-none transition-all"
          />
        </div>
        <div className="relative group">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-green-500 transition-colors" size={14} />
          <input 
            type="number" 
            placeholder="PHONE NUMBER" 
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 md:py-3.5 pl-11 pr-4 text-[10px] md:text-[11px] font-bold uppercase tracking-widest focus:border-green-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* কার্ট আইটেম লিস্ট - মোবাইলে স্ক্রল হাইট অ্যাডজাস্ট করা হয়েছে */}
      <div className="flex-1 space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar min-h-[80px]">
        {cart.length === 0 ? (
          <div className="text-center py-10 text-gray-800 font-black text-[9px] uppercase tracking-[0.2em] border-2 border-dashed border-gray-900 rounded-2xl">
            Cart is empty
          </div>
        ) : (
          cart.map((item: CartItem) => (
            <div key={item.id} className="flex justify-between items-center bg-white/[0.02] p-3 md:p-4 rounded-xl border border-gray-900 hover:border-gray-800 transition-all group">
              <div className="flex-1 min-w-0 pr-3">
                <p className="font-black text-[10px] md:text-[11px] uppercase italic text-gray-300 truncate group-hover:text-white">{item.name_en}</p>
                <p className="text-[9px] md:text-[10px] font-bold text-green-500 mt-0.5">{item.price} TK × {item.qty}</p>
              </div>
              <button 
                onClick={() => setCart(cart.filter(i => i.id !== item.id))} 
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-900">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Payable Amount</span>
          <span className="text-xl md:text-2xl font-black text-white italic tracking-tighter">
            {total.toFixed(2)} <span className="text-[10px] text-green-500 not-italic uppercase ml-1">TK</span>
          </span>
        </div>

        {/* বাটনটি মোবাইলে আরও বড় এবং হাতের নাগালে রাখা হয়েছে */}
        <button 
          onClick={handlePrint}
          disabled={isProcessing || cart.length === 0}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-800 disabled:text-gray-600 text-black font-black py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-green-500/10"
        >
          {isProcessing ? (
            <><Loader2 size={18} className="animate-spin" /> WORKING...</>
          ) : (
            <><Printer size={18} /> COMPLETE & PRINT</>
          )}
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
      `}</style>
    </div>
  );
}