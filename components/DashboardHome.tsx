'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, ArrowRight, Users, CreditCard, Search, Tag, RefreshCcw, Hash, Calendar } from 'lucide-react'; 
import PaymentModal from './PaymentModal'; 

export default function DashboardHome() {
  const getToday = () => new Date().toLocaleDateString('en-CA'); 
  
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday()); 
  const [isPayModalOpen, setIsPayModalOpen] = useState(false); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [stats, setStats] = useState({ totalSell: 0, received: 0, totalDiscount: 0, due: 0, dueCount: 0 });
  const [dueInvoices, setDueInvoices] = useState<any[]>([]);
  const [customerSummary, setCustomerSummary] = useState<any[]>([]);

  const fetchStats = useCallback(async () => {
    setIsSyncing(true);
    const { data: allOrders } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    const { data: allPayments } = await supabase.from('payments').select('*');

    if (allOrders && allPayments) {
      const filteredOrders = allOrders.filter(o => {
        const date = o.created_at.split('T')[0];
        return date >= startDate && date <= endDate;
      });

      const filteredPayments = allPayments.filter(p => {
        const pDate = p.payment_date ? p.payment_date.split('T')[0] : '';
        return pDate >= startDate && pDate <= endDate;
      });

      const lifeTimeDue = allOrders.reduce((acc, curr) => acc + (Number(curr.total_amount) - (Number(curr.received_amount) || 0) - (Number(curr.total_discount) || 0)), 0);

      setStats({
        totalSell: filteredOrders.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0),
        received: filteredPayments.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0),
        totalDiscount: filteredPayments.reduce((acc, curr) => acc + (Number(curr.adjustment_amount) || 0), 0),
        due: lifeTimeDue,
        dueCount: allOrders.filter(o => (Number(o.total_amount) - (Number(o.received_amount) || 0) - (Number(o.total_discount) || 0)) > 1).length
      });

      setDueInvoices(allOrders.filter(o => (Number(o.total_amount) - (Number(o.received_amount) || 0) - (Number(o.total_discount) || 0)) > 1));

      const uniqueCustomers = [...new Set(allOrders.map(o => o.customer_name))];
      const summary = uniqueCustomers.map(name => {
        const cOrders = allOrders.filter(o => o.customer_name === name);
        return { 
          name, 
          totalDue: cOrders.reduce((acc, curr) => acc + (Number(curr.total_amount) - (Number(curr.received_amount) || 0) - (Number(curr.total_discount) || 0)), 0),
          lastPayment: cOrders.sort((a, b) => new Date(b.last_payment_date || 0).getTime() - new Date(a.last_payment_date || 0).getTime())[0]?.last_payment_date
        };
      }).filter(c => c.totalDue > 1);
      
      setCustomerSummary(summary);
    }
    setIsSyncing(false);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="w-full h-screen flex flex-col space-y-4 p-4 lg:p-6 bg-black text-white font-sans overflow-hidden">
      
      {/* Header - Fixed Height */}
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black uppercase italic tracking-tighter">SeaLand Operations</h2>
          {isSyncing && <RefreshCcw size={14} className="animate-spin text-green-500" />}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsPayModalOpen(true)} className="bg-green-600 hover:bg-green-500 text-black px-4 py-2 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 transition-all">
            <CreditCard size={16} /> Make Payment
          </button>
          <div className="flex items-center gap-2 bg-[#111] p-2 rounded-xl border border-gray-800">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-white text-[10px] outline-none uppercase font-bold cursor-pointer" />
            <ArrowRight size={12} className="text-gray-600" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-white text-[10px] outline-none uppercase font-bold cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden min-h-0">
        
        {/* Left Side */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6 min-h-0">
          {/* Stats Table */}
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-[2rem] overflow-hidden shrink-0">
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-900">
                <StatRow label="Gross Sales" value={stats.totalSell} />
                <StatRow label="Cash Received" value={stats.received} color="text-green-500" />
                <StatRow label="Adjustments" value={stats.totalDiscount} color="text-orange-500" prefix="-" />
                <StatRow label="Net Outstanding" value={stats.due} color="text-red-500" isLast />
              </tbody>
            </table>
          </div>

          {/* Overdue Invoices কার্ড - ফিক্সড হাইট সমাধান */}
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-[2rem] p-6 flex flex-col max-h-[350px]"> 
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
              <Clock size={14} className="text-red-500" /> Overdue Invoices
            </h3>
            
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
              {dueInvoices.filter(inv => inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())).map((inv, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-white/[0.01] border border-gray-900 rounded-2xl hover:border-gray-700 transition-all shrink-0">
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase italic text-gray-300">{inv.customer_name}</div>
                    <div className="flex gap-3">
                        <span className="text-[9px] text-gray-600 flex items-center gap-1 font-bold italic"><Hash size={10}/> {inv.invoice_number || 'No ID'}</span>
                        <span className="text-[9px] text-gray-600 flex items-center gap-1 font-bold italic"><Calendar size={10}/> {new Date(inv.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-red-500 font-black italic text-lg tracking-tighter">
                    {(inv.total_amount - inv.received_amount - inv.total_discount).toLocaleString()}/-
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side (Customer Ledger) কার্ড - ফিক্সড হাইট সমাধান */}
        <div className="col-span-12 lg:col-span-5 flex flex-col">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-[2.5rem] flex flex-col max-h-[700px] overflow-hidden">
            <div className="p-6 border-b border-gray-900 bg-[#0d0d0d] shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                  <Users size={16} className="text-green-500" /> Customer Ledger
                </h3>
                <div className="relative group">
                   <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                   <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black border border-gray-800 rounded-lg py-1.5 pl-8 pr-3 text-[10px] text-white outline-none w-24 focus:w-40 transition-all font-bold"
                   />
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#0d0d0d] z-10 border-b border-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-600 uppercase italic">Customer</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-600 uppercase italic">Net Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {customerSummary.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((c, i) => (
                    <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-400 text-sm uppercase italic group-hover:text-white transition-colors">{c.name}</div>
                        {c.lastPayment && <div className="text-[8px] text-blue-500 font-black mt-1 uppercase flex items-center gap-1"><Tag size={8} /> Last: {new Date(c.lastPayment).toLocaleDateString()}</div>}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-red-500 text-xl italic tracking-tighter">
                        {c.totalDue.toLocaleString()}/-
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <PaymentModal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} onPaymentSuccess={fetchStats} />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { overflow: hidden; height: 100vh; margin: 0; }
      `}</style>
    </div>
  );
}

function StatRow({ label, value, color = "text-white", prefix = "", isLast = false }: any) {
  return (
    <tr className={`hover:bg-white/[0.01] transition-colors ${isLast ? 'bg-red-500/[0.03]' : ''}`}>
      <td className="p-4 lg:p-5 font-bold text-gray-500 italic text-[10px] lg:text-[11px] uppercase tracking-wider">{label}</td>
      <td className={`p-4 lg:p-5 text-right font-black text-xl lg:text-3xl italic tracking-tighter ${color}`}>
        {prefix} {Math.max(0, value).toLocaleString()}/-
      </td>
    </tr>
  );
}