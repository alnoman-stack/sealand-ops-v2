'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, Save, Printer, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

export default function CreateInvoice({ editData, setView }: { editData: any, setView: any }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const getLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  const [invoiceDate, setInvoiceDate] = useState(getLocalDate());

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      const today = getLocalDate();
      if (today !== invoiceDate) {
        setInvoiceDate(today);
      }
    }, 60000); 
    return () => clearInterval(interval);
  }, [invoiceDate]);

  const loadData = async () => {
    const { data: cust } = await supabase.from('customers').select('*');
    const { data: prod } = await supabase.from('products').select('*');
    setCustomers(cust || []);
    setProducts(prod || []);
    setFilteredProducts(prod || []);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = products.filter(p => 
      (p.name_en || "").toLowerCase().includes(term.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const addItem = (product: any) => {
    setInvoiceItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product_name === product.name_en
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        const itemToUpdate = { ...updatedItems[existingItemIndex] };
        itemToUpdate.qty += 1;
        itemToUpdate.total = Number((itemToUpdate.qty * itemToUpdate.unit_price).toFixed(2));
        updatedItems[existingItemIndex] = itemToUpdate;
        return updatedItems;
      } else {
        return [
          ...prevItems,
          {
            id: Date.now(),
            product_id: product.id || Math.random(),
            product_name: product.name_en,
            qty: 1,
            unit_price: product.price || 0,
            total: product.price || 0
          }
        ];
      }
    });
  };

  const updateQty = (index: number, qty: number) => {
    const updated = [...invoiceItems];
    updated[index].qty = qty;
    updated[index].total = Number((qty * updated[index].unit_price).toFixed(2));
    setInvoiceItems(updated);
  };

  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const grandTotal = Number(invoiceItems.reduce((sum, item) => sum + item.total, 0).toFixed(2));

  const saveInvoice = async () => {
    if (!selectedCustomer || invoiceItems.length === 0) return alert("Select Customer & Add Items!");
    setIsSaving(true);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
    
    try {
      const now = new Date();
      const timePart = now.toISOString().split('T')[1];
      const finalTimestamp = `${invoiceDate}T${timePart}`;

      // ১. ইনভয়েস মেইন ডাটা সেভ (সাথে due_amount সেট করা)
      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .insert([{
          invoice_number: invoiceNumber,
          customer_name: selectedCustomer.name,
          customer_phone: selectedCustomer.phone, // নতুন যোগ করা
          customer_address: selectedCustomer.address || '',
          total_amount: grandTotal,
          due_amount: grandTotal, // শুরুতে পুরো টাকাটাই ডিউ হিসেবে থাকবে
          status: 'pending',
          created_at: finalTimestamp
        }])
        .select()
        .single();

      if (invErr) throw invErr;

      // ২. লুপ চালিয়ে আইটেম সেভ এবং স্টক আপডেট
      for (const item of invoiceItems) {
        // আইটেম ইনসার্ট
        const { error: itemErr } = await supabase.from('invoice_items').insert({
          invoice_id: invoice.id,
          product_name: item.product_name,
          qty: item.qty,
          unit_price: item.unit_price,
          total: item.total
        });
        if (itemErr) throw itemErr;

        // ৩. স্টক আপডেট (Decrementing current_stock)
        const { data: productData } = await supabase
          .from('products')
          .select('current_stock')
          .ilike('name_en', item.product_name)
          .single();

        const updatedStock = (productData?.current_stock || 0) - item.qty;

        await supabase
          .from('products')
          .update({ current_stock: updatedStock })
          .eq('name_en', item.product_name);
      }

      alert("Invoice Saved & Inventory Updated: " + invoiceNumber);
      setInvoiceItems([]);
      setSelectedCustomer(null);
      
    } catch (err: any) {
      console.error("Save Error:", err);
      alert("Error saving: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-2 md:p-6 bg-[#050505] min-h-screen text-white font-sans">
      
      {/* বাম পাশ: প্রোডাক্ট লিস্ট (মোবাইলে হাইট ফিক্সড করা হয়েছে যাতে ইনভয়েস নিচে দেখা যায়) */}
      <div className="w-full lg:w-1/3 bg-[#0a0a0a] border border-gray-900 rounded-[2rem] p-5 flex flex-col h-[45vh] lg:h-[calc(100vh-3rem)] shadow-2xl shrink-0">
        <h3 className="text-sm font-black uppercase italic mb-4 shrink-0 tracking-tighter text-blue-500">Inventory Feed</h3>
        
        <div className="relative mb-4 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text"
            placeholder="Search items..."
            className="w-full bg-black border border-gray-800 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-blue-500 text-xs font-bold transition-all"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
          {filteredProducts.map((p, idx) => (
            <div key={p.id || `prod-${idx}`} className="flex justify-between items-center p-3 bg-white/5 border border-gray-900 rounded-2xl">
              <div className="text-left">
                <p className="font-black text-[10px] uppercase tracking-tight text-gray-300">{p.name_en}</p>
                <p className="text-[9px] text-blue-500 font-black mt-0.5">{p.price} TK</p>
              </div>
              <button onClick={() => addItem(p)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg active:scale-90 transition-transform">
                <Plus size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ডান পাশ: ইনভয়েস প্রিভিউ - এখানে h-full এবং scrolling ঠিক করা হয়েছে */}
      <div className="flex-1 bg-white text-black rounded-[2rem] shadow-2xl flex flex-col relative min-h-[60vh] lg:h-[calc(100vh-3rem)] overflow-hidden">
        
        {/* কন্টেন্ট এরিয়া - এটি এখন প্রপারলি স্ক্রল হবে */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar-light pb-40 lg:pb-8">
          {/* হেডার */}
          <div className="flex justify-between items-start border-b-2 border-gray-50 pb-4 mb-4">
            <div className="text-left">
              <h1 className="text-xl md:text-3xl font-black text-blue-900 italic tracking-tighter">SEALAND AGRO</h1>
              <p className="text-[8px] md:text-[10px] text-gray-400 uppercase font-black">Digital Billing System</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                <CalendarIcon size={12} className="text-blue-600" />
                <input 
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="bg-transparent text-[10px] font-black outline-none cursor-pointer"
                />
            </div>
          </div>

          {/* কাস্টমার সিলেকশন */}
          <div className="mb-4">
            <select 
              className="w-full p-3 border-2 border-gray-50 rounded-xl font-black bg-gray-50 text-[10px] uppercase"
              onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value))}
              value={selectedCustomer?.id || ""}
            >
              <option value="">-- SELECT CUSTOMER --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedCustomer && (
            <div className="mb-6 p-4 bg-blue-50/40 rounded-2xl border border-blue-50 flex flex-col sm:flex-row justify-between gap-3">
              <div className="text-left">
                <p className="text-[8px] font-black uppercase text-blue-600 italic">Bill To:</p>
                <p className="text-sm font-black uppercase italic leading-tight">{selectedCustomer.name}</p>
                <p className="text-[9px] text-gray-500 font-bold mt-0.5">{selectedCustomer.address}</p>
              </div>
              <div className="sm:text-right border-t sm:border-t-0 border-blue-100 pt-2 sm:pt-0">
                  <p className="text-[8px] font-black text-gray-400 uppercase">Phone</p>
                  <p className="text-[10px] font-black text-blue-900">{selectedCustomer.phone}</p>
              </div>
            </div>
          )}

          {/* টেবিল - স্লাইডিং বা ওভারফ্লো সমস্যা এড়াতে no-scrollbar এবং min-width */}
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-left min-w-[400px]">
              <thead>
                <tr className="bg-blue-900 text-white uppercase text-[8px] font-black italic">
                  <th className="p-3 rounded-l-xl">Description</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right rounded-r-xl">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoiceItems.map((item, index) => (
                  <tr key={item.id || index} className="text-[10px] font-bold">
                    <td className="p-3 uppercase text-blue-900 italic font-black flex items-center gap-2">
                       <button onClick={() => removeItem(index)} className="text-red-300 hover:text-red-500"><Trash2 size={12} /></button>
                       {item.product_name}
                    </td>
                    <td className="p-3 text-center">
                      <input 
                        type="number" 
                        className="w-12 bg-gray-50 rounded-md p-1 text-center font-black border border-gray-100" 
                        value={item.qty} 
                        onChange={(e) => updateQty(index, parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-3 text-right text-gray-400">{item.unit_price}</td>
                    <td className="p-3 text-right text-blue-600 font-black">{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* নিচের ফিক্সড সেকশন - এটি এখন টেবিলের ওপরে চড়বে না (Absolute positioned for mobile) */}
        <div className="absolute bottom-0 left-0 right-0 border-t-2 border-gray-50 p-5 md:p-8 bg-white/95 backdrop-blur-sm z-30 shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-end mb-4">
            <div className="text-right w-full">
              <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Amount Payable</p>
              <p className="text-3xl md:text-4xl font-black text-blue-900 tracking-tighter italic">
                {grandTotal.toLocaleString()} <span className="text-[10px] md:text-xs not-italic text-blue-500 ml-0.5 uppercase">TK</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={saveInvoice} 
              disabled={isSaving}
              className="flex-[2] bg-black text-white py-4 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
              {isSaving ? "Syncing..." : "Finalize & Save"}
            </button>
            <button onClick={() => window.print()} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95">
              <Printer size={16} /> Print
            </button>
          </div>
        </div>
      </div>
      
      {/* স্ক্রলবার স্টাইল */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar-light::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #f1f1f1; border-radius: 10px; }
      `}</style>
    </div>
  );
}