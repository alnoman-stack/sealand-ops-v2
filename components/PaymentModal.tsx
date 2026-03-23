'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, RotateCcw, ChevronRight, Calendar } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess }: any) {
  // ১ নং সমাধান: ডিফল্টভাবে আজকের তারিখ সেট করা (YYYY-MM-DD)
  const getToday = () => new Date().toLocaleDateString('en-CA'); 
  const [paymentDate, setPaymentDate] = useState(getToday());
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [dueInvoices, setDueInvoices] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number | string>(''); 
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase.from('customers').select('*').order('name');
      if (error) console.error("Customer Fetch Error:", error);
      setCustomers(data || []);
    };
    if (isOpen) fetchCustomers();
  }, [isOpen]);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!selectedCustomerName) return setDueInvoices([]);
      const { data, error } = await supabase.from('invoices')
        .select('*')
        .eq('customer_name', selectedCustomerName)
        .order('created_at', { ascending: true });

      if (error) return console.error("Invoice Fetch Error:", error);

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
    const pAmount = Number(paymentAmount) || 0;
    const aAmount = Number(adjustmentAmount) || 0;
    const totalEffect = pAmount + aAmount;

    if (!selectedCustomerName || totalEffect <= 0) {
      return alert("অনুগ্রহ করে সঠিক অ্যামাউন্ট এবং কাস্টমার ইনপুট দিন।");
    }
    
    setIsSaving(true);
    try {
      let remaining = totalEffect;
      
      // লজিক: সিলেক্ট করা তারিখ অনুযায়ী টাইমস্ট্যাম্প তৈরি করা
      // এটি ডাটাবেসে সেই তারিখেই পেমেন্ট দেখাবে যা আপনি ইনপুটে দিয়েছেন (যেমন ২২ তারিখ)
      const selectedDateObj = new Date(paymentDate);
      const dbPaymentDate = selectedDateObj.toISOString();

      for (const inv of dueInvoices) {
        if (remaining <= 0) break;
        
        const toApply = Math.min(inv.calculated_due, remaining);
        const ratio = toApply / totalEffect;
        const cashPart = Number((pAmount * ratio).toFixed(2));
        const discountPart = Number((aAmount * ratio).toFixed(2));

        // ১. ইনভয়েস টেবিল আপডেট
        const { error: invError } = await supabase.from('invoices').update({
          received_amount: (Number(inv.received_amount) || 0) + cashPart,
          total_discount: (Number(inv.total_discount) || 0) + discountPart,
          status: (inv.calculated_due - toApply) <= 1 ? 'paid' : 'pending',
          last_payment_date: dbPaymentDate // লাস্ট পেমেন্ট ডেট আপডেট
        }).eq('id', inv.id);

        if (invError) throw invError;

        // ২. পেমেন্ট হিস্ট্রি টেবিল এন্ট্রি
        const { error: payError } = await supabase.from('payments').insert([{
          customer_name: selectedCustomerName,
          invoice_id: inv.id, 
          amount_paid: cashPart, 
          adjustment_amount: discountPart, 
          payment_method: paymentMethod, 
          reference: reference || "",
          payment_date: dbPaymentDate // এই তারিখটিই আপনার Cash Received ফিল্টারে কাজ করবে
        }]);

        if (payError) throw payError;
        remaining -= toApply;
      }

      alert("পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!");
      onPaymentSuccess();
      resetForm();
      onClose();
    } catch (e: any) { 
      console.error("Payment Error:", e);
      alert("Error: " + (e.message || "Unknown error")); 
    } finally { setIsSaving(false); }
};

  const resetForm = () => {
    setPaymentAmount(''); 
    setAdjustmentAmount('');
    setSelectedCustomerName(''); 
    setReference('');
    setPaymentDate(getToday());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="bg-[#0a0a0a] border border-gray-900 w-full max-w-6xl rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-8 border-b border-gray-900 flex justify-between items-center bg-gradient-to-r from-black to-[#050505]">
          <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter">New Transaction</h2>
          <div className="flex gap-4">
            <button onClick={resetForm} className="p-4 bg-gray-900 rounded-full text-gray-400 hover:text-white transition-all"><RotateCcw size={18}/></button>
            <button onClick={onClose} className="p-4 bg-gray-900 rounded-full text-gray-400 hover:text-red-500 transition-all"><X size={20}/></button>
          </div>
        </div>

        <div className="p-10 flex flex-col lg:flex-row gap-10 max-h-[80vh] overflow-y-auto scrollbar-hide">
          <div className="flex-1 space-y-8">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Customer</label>
                    <select className="w-full bg-black border-2 border-gray-900 p-5 rounded-3xl text-white font-bold outline-none focus:border-green-500 transition-all" value={selectedCustomerName} onChange={(e) => setSelectedCustomerName(e.target.value)}>
                        <option value="">Select Customer...</option>
                        {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                
                {/* পেমেন্ট ডেট ইনপুট */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2 flex items-center gap-1"><Calendar size={10}/> Transaction Date</label>
                    <input 
                      type="date" 
                      value={paymentDate} 
                      onChange={(e) => setPaymentDate(e.target.value)} 
                      className="w-full bg-black border-2 border-gray-900 p-5 rounded-3xl text-white font-bold outline-none focus:border-blue-500 transition-all uppercase cursor-pointer" 
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 block">Received Cash</label>
                  <input type="number" placeholder="0.00" className="w-full bg-black border-2 border-gray-900 p-7 rounded-3xl text-4xl font-black text-green-500 outline-none focus:border-green-500 transition-all" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 block">Adjustment / Damage</label>
                  <input type="number" placeholder="0.00" className="w-full bg-black border-2 border-gray-900 p-7 rounded-3xl text-4xl font-black text-orange-500 outline-none focus:border-orange-500 transition-all" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Payment Method</label>
                    <select className="w-full bg-black border-2 border-gray-900 p-5 rounded-3xl text-white font-bold outline-none focus:border-blue-500 transition-all" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <option value="Cash">Cash</option>
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Bank">Bank Transfer</option>
                    </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Reference / Note</label>
                  <input type="text" placeholder="e.g. Damage, Note" className="w-full bg-black border-2 border-gray-900 p-5 rounded-3xl text-white font-bold outline-none focus:border-blue-500 transition-all" value={reference} onChange={(e) => setReference(e.target.value)} />
                </div>
            </div>

            <button onClick={handlePayment} disabled={isSaving} className="w-full bg-green-500 py-7 rounded-[2rem] font-black uppercase text-black hover:bg-green-400 transition-all disabled:opacity-20 shadow-xl shadow-green-500/10 active:scale-[0.98]">
              {isSaving ? "Saving Transaction..." : "Confirm Transaction"}
            </button>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[350px] space-y-6">
            <div className="bg-blue-500/5 border border-blue-500/10 p-8 rounded-[2.5rem] shadow-inner">
                <p className="text-[10px] font-black uppercase text-blue-500/60 mb-1">Total Outstanding</p>
                <p className="text-4xl font-black text-blue-500 italic tracking-tighter">{totalDueAmount.toLocaleString()} TK</p>
            </div>
            
            {/* Scrollable Overdue List - no scrollbar */}
            <div className="bg-white/[0.02] rounded-[2.5rem] p-6 border border-gray-900 h-[380px] overflow-y-auto space-y-3 scrollbar-hide shadow-2xl">
                <h3 className="text-[10px] font-black uppercase text-gray-500 px-2 tracking-widest">Pending Invoices</h3>
                {dueInvoices.length === 0 ? (
                  <p className="text-[10px] text-gray-700 italic p-10 text-center">No pending dues</p>
                ) : (
                  dueInvoices.map(inv => (
                    <div key={inv.id} className="bg-black/40 border border-gray-800 p-4 rounded-2xl flex justify-between items-center group hover:border-blue-500/30 transition-all">
                        <div>
                            <p className="text-[9px] font-black text-gray-600 uppercase italic">Inv: {inv.invoice_number || 'N/A'}</p>
                            <p className="text-md font-black text-gray-300 group-hover:text-white transition-colors">{inv.calculated_due.toLocaleString()}/-</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-800 group-hover:text-blue-500 transition-colors" />
                    </div>
                  ))
                )}
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}