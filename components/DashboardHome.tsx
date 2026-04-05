'use client';

import { useState, useEffect, useMemo, useCallback } from 'react'; 
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic'; 
import { supabase } from '../lib/supabase';
import { useDashboardData } from '@/hooks/useDashboardData';

import { 
  Clock, ArrowRight, Users, CreditCard, Search, Tag, RefreshCcw, 
  TrendingUp, TrendingDown, PieChart, BarChart3, Calendar
} from 'lucide-react'; 

// --- Types & Interfaces ---
interface ProductRanking {
  name: string;
  actualValue: number;
  unit?: string;
}

interface CustomerSummary {
  name: string;
  totalDue: number;
  lastPayment?: string;
}

interface Invoice {
  customer_name: string;
  invoice_number: string;
  created_at: string;
  total_amount: number;
  received_amount?: number;
  total_discount?: number;
}

interface StatRowProps {
  label: string;
  value: number;
  color?: string;
  prefix?: string;
  isLast?: boolean;
}

// --- Dynamic Imports ---
const PaymentModal = dynamic(() => import('./PaymentModal'), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });

export default function DashboardHome() {
  const router = useRouter();
  
  const getToday = useCallback(() => new Date().toLocaleDateString('en-CA'), []); 
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday()); 
  const [isPayModalOpen, setIsPayModalOpen] = useState(false); 
  const [searchTerm, setSearchTerm] = useState(''); 

  // --- Auth Check ---
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    };
    checkAuth();
  }, [router]);

  const { 
    stats, dueInvoices, customerSummary, salesGrowth,      
    productRanking, isSyncing, refresh 
  } = useDashboardData(startDate, endDate);

  // --- Optimized Financial Logic ---
  const financialSummary = useMemo(() => {
    const received = stats?.received || 0;
    const expenses = (stats?.totalExpense || 0) + (stats?.totalPurchaseAmount || 0);
    return {
      totalRevenue: received,
      totalExpenses: expenses,
      netProfit: received - expenses,
      vendorPayable: stats?.totalVendorDue || 0
    };
  }, [stats]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const maxVal = useMemo(() => 
    productRanking.length > 0 ? Math.max(...productRanking.map((p: ProductRanking) => p.actualValue)) : 1
  , [productRanking]);

  // --- Memoized Filtering ---
  const filteredCustomerLedger = useMemo(() => {
    if (!customerSummary) return [];
    return customerSummary.filter((c: CustomerSummary) => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customerSummary, searchTerm]);

  const filteredDueInvoices = useMemo(() => 
    dueInvoices.filter((inv: Invoice) => 
      inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  , [dueInvoices, searchTerm]);

  return (
    <div className="w-full min-h-screen lg:h-screen flex flex-col space-y-4 md:space-y-6 bg-[#050505] text-white font-sans p-4 md:p-6 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="bg-orange-600 p-2 rounded-lg rotate-3 shadow-lg shadow-orange-600/20 shrink-0">
            <TrendingUp size={20} className="text-black" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-tight">SeaLand Admin Hub</h1>
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.3em]">Operational Dashboard</span>
               {isSyncing && <RefreshCcw size={10} className="animate-spin text-green-500" />}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setIsPayModalOpen(true)} 
            className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-black px-6 py-2.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-900/20"
          >
            <CreditCard size={16} /> Customer Payment
          </button>
          
          <div className="flex items-center justify-between gap-2 bg-[#0a0a0a] p-2 px-4 rounded-xl border border-white/5 shadow-inner w-full sm:w-auto">
            <Calendar size={14} className="text-blue-500 shrink-0" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-white text-[9px] md:text-[10px] outline-none uppercase font-black cursor-pointer [color-scheme:dark] w-full" />
            <ArrowRight size={12} className="text-gray-700 shrink-0" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-white text-[9px] md:text-[10px] outline-none uppercase font-black cursor-pointer [color-scheme:dark] w-full" />
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-visible lg:overflow-hidden pb-4">
        
        <section className="col-span-1 lg:col-span-8 flex flex-col gap-6 h-full min-h-0 overflow-y-visible lg:overflow-y-auto no-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
              {/* Stats Table */}
              <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-gray-900/50">
                    <StatRow label="Gross Sales" value={stats.totalSell} />
                    <StatRow label="Cash Received" value={stats.received} color="text-green-500" />
                    <StatRow label="Adjustment / Damage" value={stats.totalDiscount} color="text-yellow-500" />
                    <StatRow label="Net Outstanding (Cust.)" value={stats.due} color="text-red-500" />
                    <StatRow label="Vendor Payable (Due)" value={financialSummary.vendorPayable} color="text-orange-500" isLast />
                  </tbody>
                </table>
              </div>

              {/* Profit/Loss Card */}
              <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2rem] p-6 shadow-2xl flex flex-col justify-between border-t-blue-900/30">
                <div>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <PieChart size={14} className="text-blue-500" /> Financial Health
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-gray-500 text-[11px] font-bold italic">
                      <span>Total Revenue</span>
                      <span className="text-white">{financialSummary.totalRevenue.toLocaleString()} /-</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-500 text-[11px] font-bold italic">
                      <span>Total Expenses</span>
                      <span className="text-white">{financialSummary.totalExpenses.toLocaleString()} /-</span>
                    </div>
                  </div>
                </div>
                
                <div className={`mt-6 p-4 rounded-2xl border ${financialSummary.netProfit >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400">Actual Net Profit / Loss</span>
                        <div className={`text-2xl md:text-3xl font-black italic tracking-tighter ${financialSummary.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {financialSummary.netProfit.toLocaleString()} <span className="text-xs font-normal">BDT</span>
                        </div>
                      </div>
                      {financialSummary.netProfit >= 0 ? <TrendingUp size={24} className="text-emerald-500 mb-1" /> : <TrendingDown size={24} className="text-red-500 mb-1" />}
                    </div>
                </div>
              </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
            <div className="md:col-span-2 bg-[#0a0a0a] border border-gray-900 rounded-[2rem] p-4 md:p-6 h-[250px]">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-500" /> Weekly Sales Growth
              </h3>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={salesGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="name" stroke="#555" fontSize={8} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }} itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Product Ranking */}
            <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2rem] p-6 h-[250px]">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BarChart3 size={14} className="text-green-500" /> Top Products (30D)
              </h3>
              <div className="space-y-4 mt-2 overflow-y-auto no-scrollbar h-[80%]">
                {productRanking.length > 0 ? productRanking.map((item: ProductRanking, index: number) => (
                  <div key={index} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold italic uppercase text-gray-400">
                      <span className="truncate max-w-[120px]">{item.name}</span>
                      <span className="text-white">
                        {item.actualValue} <span className="text-[8px] text-gray-600">{item.unit || 'KG'}</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ 
                          width: `${(item.actualValue / maxVal) * 100}%`, 
                          backgroundColor: COLORS[index % COLORS.length] 
                        }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center text-[10px] text-gray-600 italic uppercase">No Data Found</div>
                )}
              </div>
            </div>
          </div>

          {/* Overdue Invoices */}
          <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2.5rem] p-5 md:p-6 flex flex-col shadow-2xl shrink-0 min-h-[300px]"> 
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock size={14} className="text-red-500" /> 
              Overdue Invoices <span className="text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full ml-1">[{filteredDueInvoices.length}]</span>
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
              {filteredDueInvoices.map((inv: Invoice, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white/[0.02] border border-gray-900/50 rounded-2xl gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-bold uppercase italic text-gray-200">{inv.customer_name}</div>
                    <div className="text-[9px] text-gray-600 font-bold italic flex gap-2 uppercase">
                      <span>#{inv.invoice_number}</span> | 
                      <span>{inv.created_at?.split('T')[0].split('-').reverse().join('/')}</span>
                    </div>
                  </div>
                  <div className="text-red-500 font-black italic text-lg tracking-tighter">
                    {(inv.total_amount - (inv.received_amount || 0) - (inv.total_discount || 0)).toLocaleString()}/-
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Sidebar: Customer Ledger */}
        <aside className="col-span-1 lg:col-span-4 h-full min-h-[500px] lg:min-h-0">
          <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden h-full">
              <div className="p-5 md:p-7 border-b border-gray-900/50 bg-[#0d0d0d]/50 shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h3 className="text-[11px] font-black text-white/80 uppercase tracking-widest flex items-center gap-3 w-full sm:w-auto">
                    <Users size={18} className="text-green-500" /> Customer Ledger
                  </h3>
                  <div className="relative w-full sm:w-auto">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="bg-black border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-[11px] text-white outline-none w-full sm:w-28 focus:sm:w-40 transition-all font-bold placeholder:text-gray-700 uppercase" 
                      />
                  </div>
                </div>
              </div>
              <div className="overflow-y-auto no-scrollbar flex-1">
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0 bg-[#0d0d0d] z-10 border-b border-gray-900">
                    <tr>
                      <th className="px-6 md:px-8 py-5 text-[10px] font-black text-gray-600 uppercase italic text-left">Customer</th>
                      <th className="px-6 md:px-8 py-5 text-right text-[10px] font-black text-gray-600 uppercase italic">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900/50">
                    {filteredCustomerLedger.map((c: CustomerSummary, i: number) => (
                      <tr key={i} className="hover:bg-white/[0.03] transition-all group">
                        <td className="px-6 md:px-8 py-4">
                          <div className="font-bold text-gray-400 uppercase italic group-hover:text-white truncate max-w-[120px] sm:max-w-none">{c.name}</div>
                          {c.lastPayment ? (
                            <div className="text-[8px] text-blue-500 font-black mt-1 uppercase flex items-center gap-1">
                              <Tag size={8} /> {new Date(c.lastPayment).toLocaleDateString('en-GB')}
                            </div>
                          ) : (
                            <div className="text-[8px] text-gray-700 font-bold mt-1 uppercase italic">New</div>
                          )}
                        </td>
                        <td className="px-6 md:px-8 py-4 text-right font-black text-red-500 text-lg md:text-xl italic tracking-tighter">
                          {c.totalDue.toLocaleString()}/-
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        </aside>
      </main>
      
      {/* Modal Components */}
      <PaymentModal 
        isOpen={isPayModalOpen} 
        onClose={() => setIsPayModalOpen(false)} 
        onPaymentSuccess={refresh} 
      />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// --- Memoized StatRow Component ---
const StatRow = ({ label, value, color = "text-white", prefix = "", isLast = false }: StatRowProps) => (
  <tr className={`hover:bg-white/[0.02] transition-colors ${isLast ? 'bg-orange-500/10 border-l-2 border-l-orange-500' : ''}`}>
    <td className="p-4 lg:p-6 font-bold text-gray-500 italic text-[9px] md:text-[10px] uppercase tracking-wider">{label}</td>
    <td className={`p-4 lg:p-6 text-right font-black text-lg md:text-xl lg:text-3xl italic tracking-tighter ${color}`}>
      {prefix} {Math.max(0, value || 0).toLocaleString()}/-
    </td>
  </tr>
);