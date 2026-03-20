'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
// import { X, DollarSign, CreditCard, ChevronRight } from 'lucide-react';
import { X, DollarSign, CreditCard, ChevronRight, Clock } from 'lucide-react';
export default function PaymentModal({ isOpen, onClose, onPaymentSuccess }: any) {
  const [customers, setCustomers] = useState<any[]>([]);
  // আমরা এখানে আইডির বদলে নাম ব্যবহার করছি কারণ আপনার ইনভয়েস টেবিলে নাম আছে
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [dueInvoices, setDueInvoices] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // কাস্টমার লিস্ট লোড করা
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase.from('customers').select('*').order('name');
      setCustomers(data || []);
    };
    if (isOpen) fetchCustomers();
  }, [isOpen]);

  // কাস্টমার সিলেক্ট করলে তার ডিউ ইনভয়েসগুলো আনা
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!selectedCustomerName) {
        setDueInvoices([]);
        return;
      }

      // ✅ পরিবর্তন: customer_id এর বদলে customer_name ব্যবহার করা হয়েছে
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_name', selectedCustomerName)
        .gt('due_amount', 0)
        .order('created_at', { ascending: true });
      
      if (error) console.error("Error fetching invoices:", error);
      setDueInvoices(data || []);
    };
    fetchInvoices();
  }, [selectedCustomerName]);

  const handlePayment = async () => {
    if (!selectedCustomerName || paymentAmount <= 0) return alert("Please select customer and amount");
    setIsSaving(true);

    try {
      let remaining = paymentAmount;
      
      for (const inv of dueInvoices) {
        if (remaining <= 0) break;

        const amountToApply = Math.min(inv.due_amount, remaining);
        const newReceived = (inv.received_amount || 0) + amountToApply;
        const newDue = inv.total_amount - newReceived;

        await supabase.from('invoices').update({
          received_amount: newReceived,
          due_amount: newDue,
          status: newDue <= 0 ? 'Paid' : 'Due' // আপনার ডাটাবেসের স্ট্যাটাস অনুযায়ী
        }).eq('id', inv.id);

        remaining -= amountToApply;
      }

      alert("Payment Successful!");
      onPaymentSuccess();
      onClose();
      setPaymentAmount(0);
      setSelectedCustomerName('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-[#0a0a0a] border border-gray-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-900 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-3">
              <CreditCard className="text-green-500" /> Make Payment
            </h2>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Receive funds from customer</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-900 rounded-full text-gray-400 hover:text-white"><X size={20}/></button>
        </div>

        <div className="p-8 flex gap-8 overflow-hidden h-[500px]">
          {/* Left: Input Section */}
          <div className="flex-1 space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">1. Select Customer</label>
              <select 
                className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white text-sm font-bold outline-none focus:border-green-500 transition-all cursor-pointer"
                value={selectedCustomerName}
                onChange={(e) => setSelectedCustomerName(e.target.value)}
              >
                <option value="">Choose Customer...</option>
                {/* ✅ কাস্টমার নেম ভ্যালু হিসেবে পাঠানো হচ্ছে */}
                {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">2. Payment Amount (BDT)</label>
              <div className="relative">
                <input 
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-3xl font-black text-green-500 outline-none focus:border-green-500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-700 font-black italic">TK</span>
              </div>
            </div>

            <button 
              onClick={handlePayment}
              disabled={isSaving}
              className="w-full bg-green-500 hover:bg-green-400 text-black py-6 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-green-900/20"
            >
              {isSaving ? "Processing..." : <><DollarSign size={18} /> Confirm Payment</>}
            </button>
          </div>

          {/* Right: Due Invoices List */}
          <div className="w-1/2 bg-white/5 rounded-3xl p-6 border border-gray-900 flex flex-col">
            <h3 className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-tighter italic">Pending Invoices ({dueInvoices.length})</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {dueInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                    <Clock size={40} className="mb-2" />
                    <p className="text-[10px] uppercase font-black italic">No Dues Found</p>
                </div>
              ) : (
                dueInvoices.map(inv => (
                  <div key={inv.id} className="bg-black/40 border border-gray-800 p-4 rounded-xl flex justify-between items-center group hover:border-green-500/50 transition-all">
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{inv.invoice_number || 'INV-####'}</p>
                      <p className="text-xs font-bold text-gray-300 italic">{inv.due_amount.toLocaleString()}/-</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-700 group-hover:text-green-500 transition-all" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}