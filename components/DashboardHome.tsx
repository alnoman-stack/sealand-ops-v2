'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Calendar as CalendarIcon, ArrowRight, Users, CreditCard } from 'lucide-react';
// ✅ PaymentModal ইমপোর্ট করুন (আপনার ফাইল পাথ অনুযায়ী ঠিক করে নিন)
import PaymentModal from './PaymentModal'; 

export default function DashboardHome() {
  const today = new Date().toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false); // ✅ মোডাল কন্ট্রোল স্টেট
  
  const [stats, setStats] = useState({ totalSell: 0, received: 0, due: 0, dueCount: 0 });
  const [dueInvoices, setDueInvoices] = useState<any[]>([]);
  const [customerSummary, setCustomerSummary] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  const fetchStats = async () => {
    const { data: orders, error } = await supabase
      .from('invoices')
      .select('*')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);
    
    if (error) {
      console.error("Error fetching dashboard data:", error);
      return;
    }

    if (orders) {
      const sell = orders.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
      const rec = orders.reduce((acc, curr) => acc + (Number(curr.received_amount) || 0), 0);
      const dues = orders.filter(o => o.status === 'Due' || (o.total_amount > (o.received_amount || 0)));
      
      setStats({
        totalSell: sell,
        received: rec,
        due: sell - rec,
        dueCount: dues.length
      });
      setDueInvoices(dues);

      const uniqueCustomers = [...new Set(orders.map(o => o.customer_name))];
      const summary = uniqueCustomers.map(name => {
        const cOrders = orders.filter(o => o.customer_name === name);
        const total = cOrders.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
        const paid = cOrders.reduce((acc, curr) => acc + (Number(curr.received_amount) || 0), 0);
        return { name, totalSell: total, totalDue: total - paid };
      });
      setCustomerSummary(summary);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* তারিখ ফিল্টার এবং Make Payment বাটন সেকশন */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-black uppercase italic tracking-tighter">Business Overview</h2>
        
        <div className="flex items-center gap-4">
          {/* ✅ নতুন Make Payment বাটন */}
          <button 
            onClick={() => setIsPayModalOpen(true)}
            className="bg-green-600 hover:bg-green-500 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 transition-all shadow-lg shadow-green-900/20"
          >
            <CreditCard size={16} /> Make Payment
          </button>

          <div className="flex items-center gap-4 bg-[#410808] p-3 rounded-2xl border border-red-900/30 w-fit">
            <div className="flex items-center gap-2 px-3">
              <CalendarIcon size={14} className="text-red-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-white text-[11px] font-black outline-none cursor-pointer uppercase"
              />
            </div>
            <ArrowRight size={14} className="text-gray-600" />
            <div className="flex items-center gap-2 px-3">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white text-[11px] font-black outline-none cursor-pointer uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* বাম পাশ: আর্থিক সামারি */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-900">
                <tr className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-8 font-bold text-gray-500 italic text-sm">Total Sell Amount</td>
                  <td className="p-8 text-right font-black text-3xl text-white italic tracking-tighter">
                    {stats.totalSell.toLocaleString()}/-
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-8 font-bold text-gray-500 italic text-sm">Total Received Amount</td>
                  <td className="p-8 text-right font-black text-3xl text-green-500 italic tracking-tighter">
                    {stats.received.toLocaleString()}/-
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-8 font-bold text-red-500/60 italic text-sm uppercase tracking-widest">
                    Due Amount ({stats.dueCount})
                  </td>
                  <td className="p-8 text-right font-black text-3xl text-red-500 italic tracking-tighter">
                    {stats.due.toLocaleString()}/-
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* বকেয়া ইনভয়েস লিস্ট */}
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-[2.5rem] p-8">
            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Clock size={14} className="text-red-500" /> Due Invoices for Selected Range
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {dueInvoices.length > 0 ? (
                dueInvoices.map((inv, i) => (
                  <div key={i} className="flex justify-between items-center p-5 bg-white/[0.02] border border-gray-900 rounded-2xl hover:border-red-500/30 transition-all">
                    <div className="flex flex-col">
                        <span className="font-bold text-white uppercase text-sm tracking-tighter">{inv.customer_name}</span>
                        <span className="text-[10px] text-gray-600 font-bold">{new Date(inv.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="font-black text-red-500 italic">{inv.total_amount - (inv.received_amount || 0)}/-</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-700 text-xs italic font-bold p-4">No due invoices in this range.</p>
              )}
            </div>
          </div>
        </div>

        {/* ডান পাশ: কাস্টমার সামারি */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-[3rem] h-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b border-gray-900 bg-[#0d0d0d]">
              <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <Users size={16} className="text-green-500" /> Customer Summary
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="text-[9px] font-black uppercase text-gray-600 tracking-widest bg-black/50 sticky top-0">
                  <tr>
                    <th className="px-8 py-5">Name</th>
                    <th className="px-8 py-5 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {customerSummary.map((c, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-300 text-xs uppercase italic">{c.name}</td>
                      <td className="px-8 py-5 text-right font-black text-red-500">
                        {c.totalDue > 0 ? `${c.totalDue}/-` : 'PAID'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ পেমেন্ট মোডাল কম্পোনেন্ট */}
      <PaymentModal 
        isOpen={isPayModalOpen} 
        onClose={() => setIsPayModalOpen(false)} 
        onPaymentSuccess={fetchStats} // পেমেন্ট শেষে ডাটা রিফ্রেশ করবে
      />
    </div>
  );
}