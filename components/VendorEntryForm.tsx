'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, ShoppingCart, CreditCard, Calendar, AlertCircle } from 'lucide-react';

export default function VendorEntryForm({ onRefresh }: { onRefresh: () => void }) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'purchase' | 'payment'>('purchase');

  const getLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  const initialFormState = {
    vendor_id: '',
    item_name: '',
    qty: '',
    rate: '',
    amount: '',
    payment_method: 'Cash',
    date: getLocalDate()
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const fetchVendors = async () => {
      const { data } = await supabase.from('vendors').select('id, name').order('name', { ascending: true });
      if (data) setVendors(data);
    };
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_id) return alert("Please select a supplier!");
    setLoading(true);

    try {
      const selectedVendor = vendors.find(v => v.id === formData.vendor_id);

      if (type === 'purchase') {
        const total = Number(formData.qty) * Number(formData.rate);
        
        // ১. Purchases এন্ট্রি
        const { error: purError } = await supabase.from('purchases').insert([{
          vendor_id: formData.vendor_id,
          item_name: formData.item_name,
          quantity: Number(formData.qty), 
          rate: Number(formData.rate),
          total_amount: total,
          due_amount: total, 
          purchase_date: formData.date
        }]);
        if (purError) throw purError;

        // ২. Expenses এন্ট্রি (বকেয়া কেনাকাটা হিসেবে)
        const { error: expError } = await supabase.from('expenses').insert([{
          date: formData.date,
          category: 'Product Sourcing',
          item_name: `${formData.item_name} (Buy)`,
          amount: total,
          payment_method: 'Credit',
          description: `Supplier: ${selectedVendor?.name}`
        }]);
        if (expError) throw expError;

      } else {
        const paymentAmount = Number(formData.amount);
        
        // ১. ভেন্ডর পেমেন্ট রেকর্ড
        const { error: payError } = await supabase.from('vendor_payments').insert([{
          vendor_id: formData.vendor_id,
          amount_paid: paymentAmount,
          payment_method: formData.payment_method,
          payment_date: formData.date
        }]);
        if (payError) throw payError;

        // ২. Expenses এন্ট্রি (ক্যাশ আউট ট্র্যাকিংয়ের জন্য)
        // এটি আপনার ডেইলি এক্সপেন্স রিপোর্টে পেমেন্ট হিসেবে দেখাবে
        const { error: expPayError } = await supabase.from('expenses').insert([{
          date: formData.date,
          category: 'Product Sourcing', // অথবা 'Vendor Payment'
          item_name: `Payment to ${selectedVendor?.name}`,
          amount: paymentAmount,
          payment_method: formData.payment_method,
          description: `Due Payment for Product Sourcing`
        }]);
        if (expPayError) throw expPayError;

        // ৩. বকেয়া কমানোর লজিক (FIFO - First In First Out)
        const { data: unpaid } = await supabase
          .from('purchases')
          .select('id, due_amount')
          .eq('vendor_id', formData.vendor_id)
          .gt('due_amount', 0)
          .order('purchase_date', { ascending: true });

        if (unpaid && unpaid.length > 0) {
          let remainingPayment = paymentAmount;
          
          for (const purchase of unpaid) {
            if (remainingPayment <= 0) break;
            
            const amountToSubtract = Math.min(purchase.due_amount, remainingPayment);
            const newDue = purchase.due_amount - amountToSubtract;
            
            await supabase.from('purchases').update({ due_amount: newDue }).eq('id', purchase.id);
            remainingPayment -= amountToSubtract;
          }
        }
      }

      setFormData(initialFormState);
      onRefresh(); 
      alert("Success: Transaction Synchronized!");
      
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl transition-all">
      {/* Type Toggle */}
      <div className="flex gap-4 mb-8 p-1.5 bg-black/50 rounded-2xl border border-white/5">
        <button type="button" onClick={() => { setType('purchase'); setFormData(initialFormState); }} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${type === 'purchase' ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-gray-300'}`}>
          <ShoppingCart size={14} /> New Purchase
        </button>
        <button type="button" onClick={() => { setType('payment'); setFormData(initialFormState); }} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${type === 'payment' ? 'bg-emerald-600 text-black shadow-lg shadow-emerald-600/20' : 'text-gray-500 hover:text-gray-300'}`}>
          <CreditCard size={14} /> Pay Supplier
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase ml-2 italic">Supplier</label>
          <select required value={formData.vendor_id} onChange={(e) => setFormData({...formData, vendor_id: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white focus:border-orange-500 outline-none transition-all">
            <option value="">-- SELECT VENDOR --</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name.toUpperCase()}</option>)}
          </select>
        </div>

        {type === 'purchase' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 italic">Product Name</label>
              <input type="text" placeholder="EX: CHERRY TOMATO" required value={formData.item_name} onChange={(e) => setFormData({...formData, item_name: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white uppercase outline-none focus:border-orange-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-2 italic">Qty (KG/PC)</label>
                <input type="number" step="any" placeholder="0.00" required value={formData.qty} onChange={(e) => setFormData({...formData, qty: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white outline-none focus:border-orange-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-2 italic">Rate (৳)</label>
                <input type="number" step="any" placeholder="0.00" required value={formData.rate} onChange={(e) => setFormData({...formData, rate: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white outline-none focus:border-orange-500" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 italic">Payment Amount (৳)</label>
              <input type="number" placeholder="ENTER AMOUNT" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 italic">Payment Method</label>
              <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white outline-none focus:border-emerald-500">
                <option value="Cash">CASH</option>
                <option value="bKash/Nagad">BKASH/NAGAD</option>
                <option value="Bank">BANK</option>
              </select>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase ml-2 italic">Transaction Date</label>
          <div className="relative">
            <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-xs font-bold text-white [color-scheme:dark] outline-none focus:border-orange-500" />
            <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
          </div>
        </div>

        <button disabled={loading} type="submit" className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 ${type === 'purchase' ? 'bg-white text-black hover:bg-orange-600 hover:text-white' : 'bg-emerald-600 text-black hover:bg-emerald-700 hover:text-white'}`}>
          {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {loading ? 'SYNCING...' : 'CONFIRM TRANSACTION'}
        </button>
      </form>
      
      {type === 'purchase' && (
        <p className="mt-4 text-[9px] text-gray-600 text-center uppercase font-bold tracking-tighter">
          * New purchases are automatically marked as "Credit/Due" in the Ledger.
        </p>
      )}
    </div>
  );
}