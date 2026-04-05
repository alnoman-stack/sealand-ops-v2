'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Package, X, Calendar, RefreshCcw, Loader2, 
  CheckCircle2, User, Banknote, Scissors, Info
} from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess }: any) {
  const getToday = () => new Date().toISOString().split('T')[0]; 
  const [paymentDate, setPaymentDate] = useState(getToday());
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [dueInvoices, setDueInvoices] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number | string>(''); 
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Customers
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase.from('customers').select('*').order('name');
      setCustomers(data || []);
    };
    if (isOpen) fetchCustomers();
  }, [isOpen]);

  // Fetch Due Invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!selectedCustomerName) return setDueInvoices([]);
      const { data } = await supabase.from('invoices')
        .select('*')
        .eq('customer_name', selectedCustomerName)
        .order('created_at', { ascending: true });

      const formatted = (data || []).map(inv => ({
          ...inv,
          calculated_due: (Number(inv.total_amount) || 0) - ((Number(inv.received_amount) || 0) + (Number(inv.total_discount) || 0))
        })).filter(inv => inv.calculated_due > 0.5);
      setDueInvoices(formatted);
    };
    fetchInvoices();
  }, [selectedCustomerName]);

  const totalDueAmount = dueInvoices.reduce((acc, inv) => acc + inv.calculated_due, 0);

  const handlePayment = async () => {
    const pAmount = Math.max(0, Number(paymentAmount) || 0);
    const aAmount = Math.max(0, Number(adjustmentAmount) || 0);
    const totalEffect = pAmount + aAmount;

    if (!selectedCustomerName || totalEffect <= 0) {
      alert("সঠিক কাস্টমার এবং অ্যামাউন্ট দিন।");
      return;
    }
    
    setIsSaving(true);
    try {
      let remaining = totalEffect;
      const dbDate = new Date(`${paymentDate}T12:00:00Z`).toISOString();

      for (const inv of dueInvoices) {
        if (remaining <= 0.1) break;
        const toApply = Math.min(inv.calculated_due, remaining);
        const ratio = toApply / totalEffect;
        
        const { error } = await supabase.from('invoices').update({
          received_amount: (Number(inv.received_amount) || 0) + (pAmount * ratio),
          total_discount: (Number(inv.total_discount) || 0) + (aAmount * ratio),
          status: (inv.calculated_due - toApply) <= 1 ? 'paid' : 'pending',
          last_payment_date: dbDate
        }).eq('id', inv.id);

        if (error) throw error;

        await supabase.from('payments').insert([{
          customer_name: selectedCustomerName,
          invoice_id: inv.id, 
          amount_paid: pAmount * ratio, 
          adjustment_amount: aAmount * ratio, 
          payment_method: 'Cash', 
          payment_date: dbDate
        }]);

        remaining -= toApply;
      }

      onPaymentSuccess();
      onClose();
      alert("লেনদেন সফল হয়েছে!");
      setPaymentAmount('');
      setAdjustmentAmount('');
      setSelectedCustomerName('');
    } catch (e: any) { 
      alert(e.message); 
    } finally { 
      setIsSaving(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/95 backdrop-blur-md p-0 md:p-4">
      {/* Container - Full Screen on Mobile */}
      <div className="bg-[#0a0a0a] border-t md:border border-white/10 w-full max-w-5xl rounded-t-[2.5rem] md:rounded-[3rem] overflow-hidden flex flex-col h-[92vh] md:h-auto md:max-h-[90vh] shadow-2xl">
        
        {/* Header - Fixed */}
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic text-white tracking-tighter">SeaLand <span className="text-green-500">Ledger</span></h2>
            <p className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">Inbound Payment Portal</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => {setPaymentAmount(''); setAdjustmentAmount('');}} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:bg-white/10 transition-all"><RefreshCcw size={18}/></button>
            <button onClick={onClose} className="p-3 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Section: Inputs */}
            <div className="lg:col-span-7 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2"><User size={12} className="text-green-500"/> Select Client</label>
                  <select className="w-full bg-white/5 border border-white/10 p-4 md:p-5 rounded-2xl text-white font-bold outline-none focus:border-green-500 transition-all appearance-none text-sm" value={selectedCustomerName} onChange={(e) => setSelectedCustomerName(e.target.value)}>
                    <option value="" className="bg-[#0a0a0a]">Select Customer...</option>
                    {customers.map(c => <option key={c.id} value={c.name} className="bg-[#0a0a0a]">{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2"><Calendar size={12} className="text-blue-500"/> Payment Date</label>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 md:p-5 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all [color-scheme:dark] text-sm" />
                </div>
              </div>

              {/* Amount Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-500/10 to-transparent p-6 rounded-[2rem] border border-green-500/20 relative overflow-hidden group">
                   <Banknote size={40} className="absolute -right-4 -bottom-4 text-green-500/10 group-hover:scale-125 transition-transform" />
                   <label className="text-[10px] font-black uppercase text-green-500 mb-2 block">Cash Amount</label>
                   <div className="flex items-center gap-2">
                     <span className="text-2xl font-black text-green-500/50">৳</span>
                     <input type="number" placeholder="0" className="bg-transparent text-3xl md:text-5xl font-black text-white outline-none w-full" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                   </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-transparent p-6 rounded-[2rem] border border-orange-500/20 relative overflow-hidden group">
                   <Scissors size={40} className="absolute -right-4 -bottom-4 text-orange-500/10 group-hover:scale-125 transition-transform" />
                   <label className="text-[10px] font-black uppercase text-orange-500 mb-2 block">Adjustment / Discount</label>
                   <div className="flex items-center gap-2">
                     <span className="text-2xl font-black text-orange-500/50">৳</span>
                     <input type="number" placeholder="0" className="bg-transparent text-3xl md:text-5xl font-black text-white outline-none w-full" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} />
                   </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl flex items-start gap-3 border border-white/5">
                <Info className="text-blue-400 shrink-0" size={16} />
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">অ্যাডজাস্টমেন্ট অ্যামাউন্ট মূলত ডিসকাউন্ট বা ড্যামেজ হিসেবে গণ্য হবে যা কাস্টমারের বকেয়া থেকে কমিয়ে দেওয়া হবে।</p>
              </div>
            </div>

            {/* Right Section: Summary */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#121212] p-8 rounded-[2.5rem] border border-white/10">
                <p className="text-[10px] font-black uppercase text-blue-500 mb-2 tracking-[0.2em]">Total Outstanding</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">৳{totalDueAmount.toLocaleString()}</h3>
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-[2.5rem] p-6 border border-white/5 h-[300px] md:h-[350px] flex flex-col">
                <p className="text-[10px] font-black uppercase text-gray-500 mb-4 px-2">Automatic Allocation</p>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {dueInvoices.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                      <Package size={40} />
                      <p className="font-black text-[10px] uppercase mt-2">No Receivables Found</p>
                    </div>
                  ) : (
                    dueInvoices.map((inv, idx) => {
                      const payTotal = (Number(paymentAmount) || 0) + (Number(adjustmentAmount) || 0);
                      const sumBefore = dueInvoices.slice(0, idx).reduce((s, i) => s + i.calculated_due, 0);
                      const applied = Math.min(inv.calculated_due, Math.max(0, payTotal - sumBefore));

                      return (
                        <div key={inv.id} className={`p-4 rounded-2xl transition-all border ${applied > 0 ? 'bg-green-500/5 border-green-500/30' : 'bg-white/5 border-transparent opacity-40'}`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-[8px] font-black text-gray-600 uppercase mb-1">#{inv.invoice_number || 'ID-'+inv.id.toString().slice(-4)}</p>
                              <p className="text-lg font-black text-white italic">৳{inv.calculated_due.toLocaleString()}</p>
                            </div>
                            {applied >= inv.calculated_due - 0.5 && <CheckCircle2 size={16} className="text-green-500" />}
                          </div>
                          {applied > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                              <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Applying</span>
                              <span className="text-xs font-black text-white tracking-tighter">৳{applied.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button - Fixed at bottom */}
        <div className="p-6 md:p-8 border-t border-white/5 shrink-0">
          <button 
            onClick={handlePayment} 
            disabled={isSaving || !selectedCustomerName || ((Number(paymentAmount)||0) + (Number(adjustmentAmount)||0)) <= 0} 
            className={`w-full py-6 md:py-8 rounded-3xl font-black uppercase text-md md:text-lg tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-xl ${isSaving || !selectedCustomerName ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-green-500 hover:scale-[1.01]'}`}
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <>Complete Posting <CheckCircle2 size={20}/></>}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}