'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Save, Loader2, ShoppingCart, User, Search, ChevronDown, Banknote, AlertCircle, CalendarDays } from 'lucide-react';

export default function PurchaseEntry() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [purchaseType, setPurchaseType] = useState<'cash' | 'credit'>('cash');
  const [amountPaidNow, setAmountPaidNow] = useState(0); 
  const [isSaving, setIsSaving] = useState(false);
  
  const getLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };
  const [purchaseDate, setPurchaseDate] = useState(getLocalDate());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: v } = await supabase.from('vendors').select('id, name').order('name', { ascending: true });
      const { data: p } = await supabase.from('products').select('*').not('name_en', 'is', null).order('name_en', { ascending: true });
      
      setVendors(v || []);
      setProducts(p || []);
      setFilteredProducts(p || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    const results = products.filter(product =>
      product.name_en.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  const addItem = (product: any) => {
    setPurchaseItems(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => 
          item.id === product.id
            ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * item.buying_price }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name_en,
        qty: 1,
        buying_price: product.price || 0, 
        total: product.price || 0
      }];
    });
  };

  const updateItem = (index: number, field: string, value: number) => {
    setPurchaseItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      newItems[index].total = newItems[index].qty * newItems[index].buying_price;
      return newItems;
    });
  };

  const grandTotal = purchaseItems.reduce((sum, item) => sum + item.total, 0);
  const dueAmount = purchaseType === 'cash' ? 0 : Math.max(0, grandTotal - amountPaidNow);

  const savePurchase = async () => {
    if (purchaseItems.length === 0) return alert("দয়া করে প্রোডাক্ট সিলেক্ট করুন!");
    if (purchaseType === 'credit' && !selectedVendor) return alert("ভেন্ডর সিলেক্ট করুন!");
    
    setIsSaving(true);
    try {
      // ১. পারসেস এন্ট্রি ডেটা প্রস্তুত করা
      // এখানে .map() ব্যবহার করে একবারে সব আইটেম ইনসার্ট করার জন্য অ্যারে তৈরি করা হচ্ছে
      const insertData = purchaseItems.map(item => ({
        vendor_id: purchaseType === 'credit' ? selectedVendor.id : null,
        item_name: item.name,
        quantity: item.qty,
        rate: item.buying_price,
        total_amount: item.total,
        // ক্যাশ পারসেস হলে পুরো টাকা পেইড, ক্রেডিট হলে প্রোপোরশনাল ক্যালকুলেশন
        paid_amount: purchaseType === 'cash' ? item.total : (amountPaidNow * (item.total / grandTotal)),
        due_amount: purchaseType === 'cash' ? 0 : (item.total - (amountPaidNow * (item.total / grandTotal))),
        purchase_date: purchaseDate,
        purchase_type: purchaseType
      }));

      const { error: pErr } = await supabase.from('purchases').insert(insertData);
      if (pErr) throw pErr;

      alert("স্টক আপডেট এবং পারসেস সফল হয়েছে!");
      
      // স্টেট ক্লিয়ার করা
      setPurchaseItems([]);
      setAmountPaidNow(0);
      setSelectedVendor(null);
      setSearchTerm('');
      
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#020202] min-h-screen text-white font-sans selection:bg-blue-500/30">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white/[0.02] border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl">
          <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg shadow-blue-900/20">
                 <ShoppingCart size={32} className="text-white" />
              </div>
              <div>
                 <h1 className="text-3xl font-black tracking-tighter uppercase italic">Inventory Manager</h1>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">SeaLand Agro Operations Hub</p>
              </div>
          </div>
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 p-4 rounded-2xl">
              <CalendarDays className="text-blue-500" size={20} />
              <input type="date" className="bg-transparent text-sm font-bold text-blue-400 outline-none [color-scheme:dark]" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10 shadow-inner h-[72px]">
              <button onClick={() => {setPurchaseType('cash'); setSelectedVendor(null);}} className={`flex-1 rounded-xl font-black text-[11px] tracking-widest transition-all duration-500 ${purchaseType === 'cash' ? 'bg-white text-black shadow-xl scale-[1.02]' : 'text-gray-500 hover:text-white'}`}>CASH PURCHASE</button>
              <button onClick={() => setPurchaseType('credit')} className={`flex-1 rounded-xl font-black text-[11px] tracking-widest transition-all duration-500 ${purchaseType === 'credit' ? 'bg-orange-600 text-white shadow-xl scale-[1.02]' : 'text-gray-500 hover:text-white'}`}>CREDIT PARTNER</button>
            </div>
            
            {purchaseType === 'credit' && (
              <div className="relative animate-in slide-in-from-top-4 duration-500 h-[72px]">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                <select 
                  className="w-full h-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl text-xs font-black uppercase appearance-none outline-none focus:border-orange-500 transition-all text-white"
                  value={selectedVendor?.id || ""}
                  onChange={(e) => setSelectedVendor(vendors.find(v => v.id === e.target.value))}
                >
                  <option value="" className="bg-black text-gray-500">-- SELECT VENDOR PARTNER --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id} className="bg-black text-white p-4">{(v.name || "N/A").toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
              </div>
            )}
          </div>

          <div className="lg:col-span-8 relative group h-[72px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="QUICK SEARCH PRODUCTS..." 
              className="w-full h-full bg-white/5 border border-white/10 p-6 pl-16 rounded-[1.5rem] text-sm font-bold outline-none focus:border-blue-500 focus:bg-white/[0.08] transition-all placeholder:text-gray-700" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* Product Grid & Cart */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 space-y-8">
            <div className="bg-white/[0.02] border border-white/10 p-8 rounded-[2.5rem]">
              <div className="flex flex-wrap gap-3 max-h-[250px] overflow-y-auto pr-4 custom-scrollbar">
                {filteredProducts.map((p, i) => (
                  <button key={i} onClick={() => addItem(p)} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-blue-600 hover:border-blue-500 hover:scale-105 transition-all shadow-sm active:scale-95">
                    {p.name_en}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Product</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center">Quantity</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-right">Buying Rate</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-right">Subtotal</th>
                    <th className="p-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {purchaseItems.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center text-gray-800 font-black uppercase tracking-widest italic">Inventory cart is empty</td></tr>
                  ) : (
                    purchaseItems.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-white/[0.01] transition-colors">
                        <td className="p-6 font-black text-blue-400 uppercase tracking-tight text-sm">{item.name}</td>
                        <td className="p-6 text-center">
                            <input type="number" className="w-20 bg-black/50 border border-white/10 rounded-xl p-3 text-center font-bold text-white outline-none focus:border-blue-500" value={item.qty} onChange={(e) => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="p-6 text-right">
                            <input type="number" className="w-32 bg-black/50 border border-white/10 rounded-xl p-3 text-right font-bold text-white outline-none focus:border-blue-500" value={item.buying_price} onChange={(e) => updateItem(idx, 'buying_price', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="p-6 text-right font-black text-xl italic tracking-tighter text-white">
                          {item.total.toLocaleString()} <span className="text-[10px] not-italic text-gray-600">TK</span>
                        </td>
                        <td className="p-6 text-center">
                            <button onClick={() => setPurchaseItems(purchaseItems.filter((_, i) => i !== idx))} className="p-3 bg-red-500/10 hover:bg-red-500 rounded-2xl transition-all">
                              <Trash2 size={20} className="text-red-500 group-hover:text-white" />
                            </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Billing Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white/[0.02] border border-white/10 p-8 rounded-[3rem] shadow-3xl sticky top-8 space-y-8 overflow-hidden">
              <div className="text-center space-y-2 relative">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Total Payable</p>
                <h2 className="text-6xl font-black italic tracking-tighter text-green-500">
                  {grandTotal.toLocaleString()}
                </h2>
              </div>

              {purchaseType === 'credit' && (
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-6 animate-in zoom-in-95 duration-500">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Banknote size={16} className="text-blue-500"/> Paying Now</label>
                      <input type="number" className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-center font-black text-blue-400 text-3xl outline-none focus:border-blue-500" value={amountPaidNow} onChange={(e) => setAmountPaidNow(parseFloat(e.target.value) || 0)} />
                   </div>
                   <div className="flex justify-between items-center text-red-500 font-black pt-4 border-t border-white/5">
                      <span className="text-[10px] uppercase">Due Balance</span>
                      <span className="text-2xl">{dueAmount.toLocaleString()} TK</span>
                   </div>
                </div>
              )}

              <button 
                onClick={savePurchase} 
                disabled={isSaving || purchaseItems.length === 0} 
                className={`w-full py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-20 shadow-2xl ${isSaving ? 'bg-gray-800' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                {isSaving ? <Loader2 className="animate-spin" size={22} /> : <Save size={22}/>}
                {isSaving ? "SYNCING..." : "CONFIRM PURCHASE"}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
}