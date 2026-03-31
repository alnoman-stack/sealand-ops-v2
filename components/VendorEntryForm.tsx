'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, ShoppingCart, CreditCard } from 'lucide-react';

export default function VendorEntryForm({ onRefresh }: { onRefresh: () => void }) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'purchase' | 'payment'>('purchase');

  const [formData, setFormData] = useState({
    vendor_id: '',
    item_name: '',
    qty: '',
    rate: '',
    amount: '',
    payment_method: 'Cash',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchVendors = async () => {
      const { data } = await supabase.from('vendors').select('id, name');
      if (data) setVendors(data);
    };
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_id) return alert("Please select a supplier!");
    setLoading(true);

    try {
      if (type === 'purchase') {
        // ১. Purchases এন্ট্রি (কলাম নাম: quantity)
        const total = Number(formData.qty) * Number(formData.rate);
        const { error: purError } = await supabase.from('purchases').insert([{
          vendor_id: formData.vendor_id,
          item_name: formData.item_name,
          quantity: Number(formData.qty), 
          rate: Number(formData.rate),
          total_amount: total,
          purchase_date: formData.date
        }]);
        if (purError) throw purError;

      } else {
        // ২. Vendor Payments এন্ট্রি
        const paymentAmount = Number(formData.amount);
        const { error: payError } = await supabase.from('vendor_payments').insert([{
          vendor_id: formData.vendor_id,
          amount_paid: paymentAmount,
          payment_method: formData.payment_method,
          payment_date: formData.date
        }]);
        if (payError) throw payError;

        // ৩. অটো-কানেক্ট: Expense Hub (expenses) টেবিলে ডাটা পাঠানো
        const selectedVendor = vendors.find(v => v.id === formData.vendor_id);
        const { error: expError } = await supabase.from('expenses').insert([{
          date: formData.date,
          category: 'Product Sourcing',
          item_name: selectedVendor?.name || 'Vendor',
          amount: paymentAmount,
          payment_method: formData.payment_method,
          description: `Supplier Payment: ${selectedVendor?.name}`
        }]);
        if (expError) throw expError;
      }

      alert(type === 'purchase' ? "Purchase successful (Added to Due)!" : "Payment successful (Synced with Expenses)!");
      setFormData({ ...formData, item_name: '', qty: '', rate: '', amount: '' });
      onRefresh(); 
      
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
      {/* Toggle Tabs */}
      <div className="flex gap-4 mb-8 p-1.5 bg-black/50 rounded-2xl border border-white/5">
        <button 
          type="button"
          onClick={() => setType('purchase')}
          className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${type === 'purchase' ? 'bg-orange-600 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
        >
          <ShoppingCart size={14} /> New Purchase
        </button>
        <button 
          type="button"
          onClick={() => setType('payment')}
          className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${type === 'payment' ? 'bg-orange-600 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
        >
          <CreditCard size={14} /> Pay Supplier
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Supplier Select */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-600 uppercase ml-2 italic tracking-tighter">Vendor Partner</label>
          <select 
            required
            value={formData.vendor_id}
            onChange={(e) => setFormData({...formData, vendor_id: e.target.value})}
            className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white focus:border-orange-500 outline-none transition-all"
          >
            <option value="">-- SELECT VENDOR --</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name.toUpperCase()}</option>)}
          </select>
        </div>

        {type === 'purchase' ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <input type="text" placeholder="PRODUCT NAME" required value={formData.item_name}
              onChange={(e) => setFormData({...formData, item_name: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white focus:border-orange-500 outline-none placeholder:text-gray-800 uppercase" />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="QTY (KG)" required value={formData.qty}
                onChange={(e) => setFormData({...formData, qty: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white focus:border-orange-500 outline-none" />
              <input type="number" placeholder="UNIT RATE" required value={formData.rate}
                onChange={(e) => setFormData({...formData, rate: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white focus:border-orange-500 outline-none" />
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <input type="number" placeholder="PAYMENT AMOUNT (BDT)" required value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white focus:border-orange-500 outline-none" />
            <select 
              value={formData.payment_method}
              onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white focus:border-orange-500 outline-none"
            >
              <option value="Cash">CASH PAYMENT</option>
              <option value="Bank">BANK TRANSFER</option>
              <option value="bKash/Nagad">BKASH/NAGAD</option>
            </select>
          </div>
        )}

        <div>
          <label className="text-[9px] font-black text-gray-600 uppercase ml-2 italic">Entry Date</label>
          <input type="date" value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-[11px] font-black text-orange-500 outline-none mt-1" />
        </div>

        <button 
          disabled={loading}
          type="submit"
          className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-orange-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
          {loading ? 'Processing...' : 'Confirm Entry'}
        </button>
      </form>
    </div>
  );
}