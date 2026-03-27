'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, Save, Printer, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

export default function InvoiceGenerator() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ১. নির্ভুল লোকাল তারিখ বের করার ফাংশন (টাইমজোন বাগ ফিক্সড)
  const getLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  const [invoiceDate, setInvoiceDate] = useState(getLocalDate());

  useEffect(() => {
    loadData();
    // প্রতি এক মিনিট অন্তর তারিখ চেক করা যাতে তারিখ পরিবর্তন হলে আপডেট হয়
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

  // ২. ইনভয়েস সেভ করার আপডেট লজিক
  const saveInvoice = async () => {
    if (!selectedCustomer || invoiceItems.length === 0) return alert("Select Customer & Add Items!");
    setIsSaving(true);
    
    // প্রফেশনাল ইনভয়েস নাম্বার ফরম্যাট (র্যান্ডম হলেও ইউনিক রাখার চেষ্টা)
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
    
    try {
      // ৩. টাইমস্ট্যাম্প ফিক্স: বর্তমান সময়ের অংশটি নিয়ে ডেট-এর সাথে জোড়া দেওয়া
      const now = new Date();
      const timePart = now.toISOString().split('T')[1]; // HH:mm:ss.sssZ
      const finalTimestamp = `${invoiceDate}T${timePart}`;

      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .insert([{
          invoice_number: invoiceNumber,
          customer_name: selectedCustomer.name,
          customer_address: selectedCustomer.address || '',
          total_amount: grandTotal,
          status: 'pending',
          created_at: finalTimestamp // এখন এটি সুপাবেসে সঠিক ডেট হিসেবেই যাবে
        }])
        .select()
        .single();

      if (invErr) throw invErr;

      const itemsToInsert = invoiceItems.map(item => ({
        invoice_id: invoice.id,
        product_name: item.product_name,
        qty: item.qty,
        unit_price: item.unit_price,
        total: item.total
      }));

      const { error: itemErr } = await supabase.from('invoice_items').insert(itemsToInsert);
      if (itemErr) throw itemErr;

      alert("Invoice Saved Successfully: " + invoiceNumber);
      setInvoiceItems([]);
      setSelectedCustomer(null);
      
    } catch (err: any) {
      console.error("Save Error:", err);
      alert("Error saving invoice: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex gap-6 p-6 bg-[#050505] h-screen text-white overflow-hidden font-sans">
      
      {/* বাম পাশ: প্রোডাক্ট লিস্ট */}
      <div className="w-1/3 bg-[#0a0a0a] border border-gray-900 rounded-3xl p-6 flex flex-col overflow-hidden shadow-2xl">
        <h3 className="text-lg font-black uppercase italic mb-4 shrink-0 tracking-tighter text-blue-500">Select Products</h3>
        
        <div className="relative mb-6 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text"
            placeholder="Search product..."
            className="w-full bg-black border border-gray-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 text-sm font-bold transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {filteredProducts.map((p, idx) => (
            <div key={p.id || `prod-${idx}`} className="flex justify-between items-center p-5 bg-white/5 border border-gray-900 rounded-[1.5rem] hover:border-blue-500/50 hover:bg-white/10 transition-all group">
              <div className="text-left">
                <p className="font-black text-xs uppercase tracking-tight text-gray-200">{p.name_en}</p>
                <p className="text-[10px] text-blue-500 font-black mt-1 uppercase tracking-widest">{p.price} TK / {p.unit || 'unit'}</p>
              </div>
              <button onClick={() => addItem(p)} className="p-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white shadow-lg active:scale-90 transition-transform">
                <Plus size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ডান পাশ: ইনভয়েস প্রিভিউ */}
      <div className="flex-1 bg-white text-black rounded-[2.5rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-y-auto custom-scrollbar relative">
        
        {/* ইনভয়েস হেডার */}
        <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8 shrink-0">
          <div className="text-left">
            <h1 className="text-4xl font-black text-blue-900 leading-none italic tracking-tighter">SEALAND AGRO</h1>
            <p className="text-[11px] text-gray-500 mt-2 uppercase font-black italic tracking-[0.2em]">A Commitment To Freshness!</p>
            <p className="text-[10px] text-gray-400 w-72 mt-3 font-bold uppercase leading-relaxed">House # 3, Road # Nobinagar 16, Dhaka Uddan, Mohammadpur</p>
          </div>
          <div className="text-right flex flex-col items-end gap-3">
            <h2 className="text-3xl font-black uppercase text-gray-200 leading-none italic">INVOICE</h2>
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <CalendarIcon size={14} className="text-blue-600" />
                <input 
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="bg-transparent text-xs font-black outline-none cursor-pointer uppercase tracking-tighter"
                />
            </div>
          </div>
        </div>

        {/* কাস্টমার সিলেকশন */}
        <div className="mb-6 shrink-0">
          <select 
            className="w-full p-5 border-2 border-gray-50 rounded-[1.5rem] font-black outline-none bg-gray-50 text-xs uppercase tracking-widest focus:border-blue-200 transition-all appearance-none shadow-sm cursor-pointer"
            onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value))}
            value={selectedCustomer?.id || ""}
          >
            <option value="">-- CHOOSE TARGET CUSTOMER --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
          </select>
        </div>

        {selectedCustomer && (
          <div className="mb-8 p-6 bg-blue-50/40 rounded-[2rem] border border-blue-100 flex justify-between items-center shrink-0">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-blue-600 mb-2 tracking-widest italic">Billing Recipient:</p>
              <p className="text-xl font-black uppercase italic tracking-tight">{selectedCustomer.name}</p>
              <p className="text-xs text-gray-600 font-bold uppercase mt-1">
                {selectedCustomer.address || "No Address Found"}
              </p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Contact Phone</p>
                <p className="text-sm font-black tracking-tight text-blue-900">{selectedCustomer.phone}</p>
            </div>
          </div>
        )}

        {/* টেবিল এরিয়া */}
        <div className="flex-1 mb-8 min-h-[200px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white uppercase text-[10px] font-black italic tracking-widest shadow-lg">
                <th className="p-5 rounded-l-2xl">Cargo Description</th>
                <th className="p-5 text-center">Qty</th>
                <th className="p-5 text-right">Unit Price</th>
                <th className="p-5 text-right">Sub-Total</th>
                <th className="p-5 text-center rounded-r-2xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoiceItems.map((item, index) => (
                <tr key={item.id || index} className="text-xs font-bold hover:bg-gray-50/80 transition-colors group">
                  <td className="p-5 uppercase text-blue-900 italic font-black">{item.product_name}</td>
                  <td className="p-5 text-center">
                    <input 
                      type="number" 
                      step="any"
                      className="w-16 bg-gray-100 border-2 border-transparent rounded-xl p-2 text-center font-black focus:bg-white focus:border-blue-500 transition-all outline-none" 
                      value={item.qty} 
                      onChange={(e) => updateQty(index, parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-5 text-right text-gray-500 font-black">{item.unit_price} TK</td>
                  <td className="p-5 text-right text-blue-600 font-black text-sm italic">{item.total.toLocaleString()} TK</td>
                  <td className="p-5 text-center">
                    <button onClick={() => removeItem(index)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoiceItems.length === 0 && (
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] mt-4">
                  <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest italic">No Items Selected For Cargo</p>
              </div>
          )}
        </div>

        {/* গ্র্যান্ড টোটাল ও বাটন */}
        <div className="mt-auto shrink-0 border-t-4 border-double border-gray-100 pt-8">
          <div className="flex justify-between items-end mb-8">
            <div className="text-left">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-2">Sea-Land Agro Digital Signature</p>
                 <div className="w-32 h-1 border-b-2 border-gray-100"></div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Total Payable Amount</p>
              <p className="text-5xl font-black text-blue-900 tracking-tighter italic">{grandTotal.toLocaleString()} <span className="text-lg not-italic text-blue-500 ml-1 uppercase">TK</span></p>
            </div>
          </div>

          <div className="flex gap-4 no-print mb-4">
            <button 
              onClick={saveInvoice} 
              disabled={isSaving}
              className="flex-1 bg-black text-white py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-gray-800 transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
              {isSaving ? "Syncing..." : "Commit & Save Invoice"}
            </button>
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-12 py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-blue-500 transition-all shadow-xl active:scale-95">
              <Printer size={20} /> Print Copy
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
      `}</style>
    </div>
  );
}