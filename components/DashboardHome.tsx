'use client'
import { useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
// এখানে 'lucide-center' এর বদলে 'lucide-react' হবে
import { Clock, ArrowRight, Users, CreditCard, Search, Tag, RefreshCcw, Hash, Calendar } from 'lucide-react'; 
import PaymentModal from './PaymentModal'; 

export default function DashboardHome() {
  const getToday = () => new Date().toLocaleDateString('en-CA'); 
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday()); 
  const [isPayModalOpen, setIsPayModalOpen] = useState(false); 
  const [searchTerm, setSearchTerm] = useState(''); 

  const { stats, dueInvoices, customerSummary, isSyncing, refresh } = useDashboardData(startDate, endDate);

  const filteredDueInvoices = dueInvoices.filter(inv => 
    inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-screen flex flex-col space-y-6 bg-[#050505] text-white font-sans p-6 overflow-hidden">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">SeaLand Operations</h2>
          {isSyncing && <RefreshCcw size={16} className="animate-spin text-green-500" />}
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setIsPayModalOpen(true)} 
            className="bg-green-600 hover:bg-green-500 text-black px-6 py-2.5 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-900/20"
          >
            <CreditCard size={16} /> Make Payment
          </button>
          
          <div className="flex items-center gap-2 bg-[#0a0a0a] p-2 rounded-xl border border-gray-900 shadow-inner">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="bg-transparent text-white text-[10px] outline-none uppercase font-bold cursor-pointer" 
            />
            <ArrowRight size={12} className="text-gray-700" />
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="bg-transparent text-white text-[10px] outline-none uppercase font-bold cursor-pointer" 
            />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 overflow-hidden pb-4">
        
        {/* Left Side: Stats & Overdue Invoices */}
        <div className="col-span-1 md:col-span-12 lg:col-span-7 flex flex-col gap-6 h-full min-h-0">
          
          {/* Summary Stats Card */}
          <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2rem] overflow-hidden shadow-2xl shrink-0">
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-900/50">
                <StatRow label="Gross Sales" value={stats.totalSell} />
                <StatRow label="Cash Received" value={stats.received} color="text-green-500" />
                <StatRow label="Adjustments" value={stats.totalDiscount} color="text-orange-500" prefix="-" />
                <StatRow label="Net Outstanding" value={stats.due} color="text-red-500" isLast />
              </tbody>
            </table>
          </div>

          {/* Overdue Invoices */}
          <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2.5rem] p-6 flex flex-col shadow-2xl flex-1 min-h-0"> 
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2 shrink-0">
              <Clock size={14} className="text-red-500" /> 
              Overdue Invoices <span className="text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full ml-1">[{filteredDueInvoices.length}]</span>
            </h3>
            <div className="overflow-y-auto no-scrollbar space-y-3 pr-1 flex-1">
              {filteredDueInvoices.map((inv, i) => (
                <div key={i} className="flex justify-between items-center p-5 bg-white/[0.02] border border-gray-900/50 rounded-2xl hover:border-red-900/30 hover:bg-white/[0.04] transition-all group">
                  <div className="space-y-1 text-left">
                    <div className="text-sm font-bold uppercase italic text-gray-200 group-hover:text-white transition-colors">{inv.customer_name}</div>
                    <div className="text-[9px] text-gray-600 font-bold italic flex gap-2">
                      <span><Hash size={10} className="inline mr-1"/>{inv.invoice_number || 'N/A'}</span>
                      <span>|</span>
                      <span><Calendar size={10} className="inline mr-1"/>{new Date(inv.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-red-500 font-black italic text-xl tracking-tighter">
                    {(inv.total_amount - inv.received_amount - inv.total_discount).toLocaleString()}/-
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Customer Ledger */}
        <div className="col-span-1 md:col-span-12 lg:col-span-5 h-full min-h-0">
          <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden h-full">
            <div className="p-7 border-b border-gray-900/50 bg-[#0d0d0d]/50 backdrop-blur-md shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3 text-white/80">
                  <Users size={18} className="text-green-500" /> Customer Ledger
                </h3>
                <div className="relative group">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                   <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-[11px] text-white outline-none w-28 focus:w-40 transition-all font-bold placeholder:text-gray-700"
                   />
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto no-scrollbar flex-1 min-h-0">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead className="sticky top-0 bg-[#0d0d0d] z-10 border-b border-gray-900">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase italic text-left">Customer Name</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-600 uppercase italic">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900/50">
                  {customerSummary
                    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((c, i) => (
                    <tr key={i} className="hover:bg-white/[0.03] transition-all group">
                      <td className="px-8 py-4 text-left">
                        <div className="font-bold text-gray-400 uppercase italic group-hover:text-white transition-colors">{c.name}</div>
                        {c.lastPayment && (
                          <div className="text-[8px] text-blue-500 font-black mt-1 uppercase flex items-center gap-1">
                            <Tag size={8} /> Last Paid: {new Date(c.lastPayment).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-4 text-right font-black text-red-500 text-xl italic tracking-tighter">
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
      
      <PaymentModal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} onPaymentSuccess={refresh} />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function StatRow({ label, value, color = "text-white", prefix = "", isLast = false }: any) {
  return (
    <tr className={`hover:bg-white/[0.02] transition-colors ${isLast ? 'bg-red-500/[0.03]' : ''}`}>
      <td className="p-5 lg:p-6 font-bold text-gray-500 italic text-[10px] uppercase tracking-wider">{label}</td>
      <td className={`p-5 lg:p-6 text-right font-black text-xl lg:text-3xl italic tracking-tighter ${color}`}>
        {prefix} {Math.max(0, value).toLocaleString()}/-
      </td>
    </tr>
  );
}