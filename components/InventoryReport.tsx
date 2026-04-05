'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Package, ArrowUpRight, ArrowDownLeft, Scale, Loader2, RefreshCcw,
  AlertCircle, Calendar, Trash2, X, Save, AlertTriangle
} from 'lucide-react';

export default function InventoryReport() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [isSavingDamage, setIsSavingDamage] = useState(false);
  const [damageForm, setDamageForm] = useState({ product_name: '', qty: 0, reason: '' });

  const fetchInventoryStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // ১. Purchases টেবিল থেকে ডাটা ফেচ
      let purQuery = supabase.from('purchases').select('item_name, quantity, purchase_date');
      if (startDate) purQuery = purQuery.gte('purchase_date', startDate);
      if (endDate) purQuery = purQuery.lte('purchase_date', endDate);
      const { data: purchases, error: purError } = await purQuery;
      if (purError) throw purError;

      // ২. Expenses টেবিল থেকে "Product Sourcing" ডাটা ফেচ
      let expQuery = supabase.from('expenses')
        .select('item_name, amount, date')
        .eq('category', 'Product Sourcing');
      if (startDate) expQuery = expQuery.gte('date', startDate);
      if (endDate) expQuery = expQuery.lte('date', endDate);
      const { data: expenses, error: expError } = await expQuery;
      if (expError) throw expError;

      // ৩. Sales (Invoice Items) টেবিল থেকে ডাটা ফেচ
      const { data: sales, error: saleError } = await supabase.from('invoice_items').select('product_name, qty');
      if (saleError) throw saleError;

      // ৪. Damage টেবিল থেকে ডাটা ফেচ
      const { data: damages, error: dmgError } = await supabase.from('damage_entries').select('product_name, qty');
      if (dmgError) throw dmgError;

      const report: Record<string, { buy: number; sell: number; damage: number; stock: number }> = {};

      // প্রসেসিং: Purchases (স্টক ইন থেকে আসা)
      purchases?.forEach((p) => {
        const name = p.item_name?.toUpperCase().trim() || 'UNKNOWN';
        if (!report[name]) report[name] = { buy: 0, sell: 0, damage: 0, stock: 0 };
        report[name].buy += Number(p.quantity) || 0;
      });

      /**
       * আপডেট করা প্রসেসিং লজিক: Expenses (Expense Hub থেকে আসা)
       * যদি item_name থাকে: "Capsicum (5kg x 200), Tomato (10kg x 60)"
       */
      expenses?.forEach((e) => {
        if (!e.item_name) return;

        // কমা দিয়ে আলাদা করা (যদি একাধিক প্রোডাক্ট থাকে এক এন্ট্রিতে)
        const parts = e.item_name.split(',');

        parts.forEach((part: string) => {
          // নাম বের করা: "Capsicum"
          const rawName = part.split('(')[0].toUpperCase().trim();
          
          // কেজি বের করা: "(5kg" -> 5
          const qtyMatch = part.match(/\((\d+\.?\d*)kg/i);
          const extractedQty = qtyMatch ? parseFloat(qtyMatch[1]) : 0;

          if (rawName && rawName !== "BULK SOURCE") {
            if (!report[rawName]) report[rawName] = { buy: 0, sell: 0, damage: 0, stock: 0 };
            report[rawName].buy += extractedQty;
          }
        });
      });

      // প্রসেসিং: Sales
      sales?.forEach((s) => {
        const name = s.product_name?.toUpperCase().trim() || 'UNKNOWN';
        if (!report[name]) report[name] = { buy: 0, sell: 0, damage: 0, stock: 0 };
        report[name].sell += Number(s.qty) || 0;
      });

      // প্রসেসিং: Damage
      damages?.forEach((d) => {
        const name = d.product_name?.toUpperCase().trim() || 'UNKNOWN';
        if (!report[name]) report[name] = { buy: 0, sell: 0, damage: 0, stock: 0 };
        report[name].damage += Number(d.qty) || 0;
      });

      // ফাইনাল স্টক ক্যালকুলেশন
      Object.keys(report).forEach((name) => {
        report[name].stock = report[name].buy - (report[name].sell + report[name].damage);
      });

      setData(report);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryStats();
  }, [startDate, endDate]);

  const handleSaveDamage = async () => {
    if (!damageForm.product_name || damageForm.qty <= 0) return alert("সঠিক তথ্য দিন!");
    setIsSavingDamage(true);
    try {
      const { error } = await supabase.from('damage_entries').insert([{
        product_name: damageForm.product_name.toUpperCase().trim(),
        qty: damageForm.qty,
        reason: damageForm.reason,
        entry_date: new Date().toISOString().split('T')[0]
      }]);
      if (error) throw error;
      setIsDamageModalOpen(false);
      setDamageForm({ product_name: '', qty: 0, reason: '' });
      fetchInventoryStats();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSavingDamage(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-6 shadow-2xl relative flex flex-col min-h-[calc(100vh-40px)] lg:h-[calc(100vh-80px)] overflow-hidden transition-all duration-500">
      
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600/20 rounded-xl border border-orange-600/20">
            <Scale className="text-orange-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Inventory Analysis</h2>
            <p className="text-[9px] text-gray-600 font-bold tracking-[0.2em] uppercase">Real-Time Product Tracking</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
            <Calendar size={14} className="text-gray-500" />
            <input type="date" className="bg-transparent text-[10px] font-bold text-blue-400 outline-none [color-scheme:dark]" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="text-gray-700 text-[10px] font-black italic">TO</span>
            <input type="date" className="bg-transparent text-[10px] font-bold text-blue-400 outline-none [color-scheme:dark]" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <button onClick={() => setIsDamageModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-red-600/10 border border-red-600/20 rounded-xl text-red-500 text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-600/5">
            <AlertTriangle size={14} /> Record Damage
          </button>
          
          <button onClick={fetchInventoryStats} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
            <RefreshCcw size={16} className={`${loading ? 'animate-spin' : 'text-gray-500'}`} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="animate-spin text-orange-600" size={40} />
            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic animate-pulse">Calculating Live Stock Balance...</p>
          </div>
        ) : (
          <table className="w-full text-left border-separate border-spacing-y-1.5">
            <thead className="sticky top-0 bg-[#0a0a0a] z-10">
              <tr className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">
                <th className="pb-2 pl-6">Material Name</th>
                <th className="pb-2">Total Purchased</th>
                <th className="pb-2">Sold</th>
                <th className="pb-2">Damage</th>
                <th className="pb-2 pr-6 text-right">Net Stock Balance</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {Object.entries(data).length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-gray-800 font-black uppercase tracking-[0.5em] italic">No Data Found</td></tr>
              ) : (
                Object.entries(data).map(([name, stats]: any) => (
                  <tr key={name} className="bg-white/[0.02] hover:bg-white/[0.05] transition-all group border border-white/5">
                    <td className="py-2.5 pl-6 rounded-l-xl border-y border-l border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black/40 rounded-lg flex items-center justify-center border border-white/5 group-hover:border-orange-600/30">
                           <Package size={14} className="text-gray-600 group-hover:text-orange-600" />
                        </div>
                        <span className="uppercase font-black text-white/90 tracking-tighter text-[11px] group-hover:text-orange-500">{name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 border-y border-white/5 text-green-500/80 font-black italic">
                        {stats.buy.toLocaleString()} <span className="text-[8px] not-italic opacity-40">KG</span>
                    </td>
                    <td className="py-2.5 border-y border-white/5 text-blue-500/80 font-black italic">
                        {stats.sell.toLocaleString()} <span className="text-[8px] not-italic opacity-40">KG</span>
                    </td>
                    <td className="py-2.5 border-y border-white/5 text-red-500/80 font-black italic">
                        {stats.damage.toLocaleString()} <span className="text-[8px] not-italic opacity-40">KG</span>
                    </td>
                    <td className="py-2.5 pr-6 rounded-r-xl border-y border-r border-white/5 text-right">
                      <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-black italic border ${
                        stats.stock > 0 ? 'bg-orange-600/10 text-orange-500 border-orange-600/20 shadow-lg shadow-orange-900/5' : 'bg-red-600/10 text-red-500 border-red-600/20'
                      }`}>
                        {stats.stock.toLocaleString()} KG
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-[8px] font-black text-gray-700 uppercase tracking-[0.4em] italic">
          <span>SeaLand Agro Analytics | Dynamic Stock Tracking</span>
          <span className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
             System Healthy
          </span>
      </div>

      {/* Damage Modal */}
      {isDamageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-white uppercase italic">Record Stock Loss</h3>
                <button onClick={() => setIsDamageModalOpen(false)} className="text-gray-500 hover:text-white transition-all"><X size={20}/></button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="PRODUCT NAME (Exact match)" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-red-600 transition-all uppercase" value={damageForm.product_name} onChange={(e) => setDamageForm({...damageForm, product_name: e.target.value})} />
                <input type="number" placeholder="QUANTITY (KG)" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-red-600 transition-all" value={damageForm.qty || ''} onChange={(e) => setDamageForm({...damageForm, qty: Number(e.target.value)})} />
                <textarea placeholder="REASON FOR DAMAGE" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-red-600 transition-all min-h-[100px]" value={damageForm.reason} onChange={(e) => setDamageForm({...damageForm, reason: e.target.value})} />
                <button onClick={handleSaveDamage} disabled={isSavingDamage} className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2">
                  {isSavingDamage ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} SAVE DAMAGE LOG
                </button>
              </div>
           </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
      `}</style>
    </div>
  );
}