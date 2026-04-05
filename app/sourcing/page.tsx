'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Calendar, AlertCircle, Loader2, FileDown, Search, ArrowRight, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SourcingPage() {
  const [sourcingList, setSourcingList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'sourcing' | 'bags'>('sourcing');

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());

  useEffect(() => {
    fetchSourcingData();
  }, [startDate, endDate]);

  const fetchSourcingData = async () => {
    setIsLoading(true);
    try {
      const startOfDay = `${startDate}T00:00:00.000Z`;
      const endOfDay = `${endDate}T23:59:59.999Z`;

      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (invError) throw invError;

      if (invoices && invoices.length > 0) {
        const invoiceIds = invoices.map(inv => inv.id);
        const { data: items, error: itemError } = await supabase
          .from('invoice_items')
          .select('product_name, qty') 
          .in('invoice_id', invoiceIds);

        if (itemError) throw itemError;

        const summary = items.reduce((acc: any, item: any) => {
          const key = item.product_name.trim();
          const quantity = Number(item.qty || 0);
          if (!acc[key]) {
            acc[key] = { name: item.product_name, totalQty: 0, breakdown: [] };
          }
          acc[key].totalQty += quantity;
          acc[key].breakdown.push(quantity);
          acc[key].breakdown.sort((a: number, b: number) => a - b);
          return acc;
        }, {});

        const sortedList = Object.values(summary).sort((a: any, b: any) => b.totalQty - a.totalQty);
        setSourcingList(sortedList);
      } else {
        setSourcingList([]);
      }
    } catch (error: any) {
      console.error("Sourcing Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const isBagsView = viewMode === 'bags';
    doc.setFontSize(16);
    if (isBagsView) { doc.setTextColor(22, 101, 52); } else { doc.setTextColor(37, 99, 235); }
    doc.text(isBagsView ? "SeaLand Agro - Packing/Bags List" : "SeaLand Agro - Sourcing List", 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 22);

    const tableHead = isBagsView 
      ? [['SL', 'Product Name', 'Bags Detail (KG)', 'Total Bags']] 
      : [['SL', 'Product Name', 'Total Quantity']];

    const tableBody = sourcingList.map((item, index) => {
      return isBagsView 
        ? [index + 1, item.name, item.breakdown.join('  |  '), item.breakdown.length]
        : [index + 1, item.name, `${item.totalQty.toFixed(2)} KG`];
    });

    autoTable(doc, {
      startY: 30,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: isBagsView ? [22, 101, 52] : [37, 99, 235] },
      styles: { fontSize: 9 }
    });
    doc.save(`${isBagsView ? 'Bags' : 'Sourcing'}_${startDate}.pdf`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#020202] text-white font-sans">
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Section - Mobile Optimized */}
        <header className="flex-none p-4 md:p-8 bg-[#020202] border-b border-white/5 z-20">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h1 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                Inventory Hub
              </h1>
              
              {/* View Toggle - Full width on mobile */}
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 w-full md:w-auto">
                <button 
                  onClick={() => setViewMode('sourcing')}
                  className={`flex-1 md:flex-none px-3 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${viewMode === 'sourcing' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
                >
                  <ShoppingCart size={14}/> Sourcing
                </button>
                <button 
                  onClick={() => setViewMode('bags')}
                  className={`flex-1 md:flex-none px-3 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${viewMode === 'bags' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500'}`}
                >
                  <Package size={14}/> Bags
                </button>
              </div>
            </div>

            {/* Controls - Date range and Buttons */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-[#0a0a0a] p-3 md:p-2 rounded-2xl md:rounded-3xl border border-white/5 shadow-2xl">
              <div className="flex items-center justify-between gap-4 px-4 py-2 border-b lg:border-b-0 lg:border-r border-white/10">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-black text-gray-500">From</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-white cursor-pointer" />
                </div>
                <ArrowRight size={14} className="text-gray-700" />
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-black text-gray-500">To</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-white cursor-pointer" />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button onClick={fetchSourcingData} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95">
                  <Search size={16} /> Sync
                </button>

                <button onClick={downloadPDF} className="flex-1 bg-white text-black px-4 py-3 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-[11px] flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white transition-all">
                  <FileDown size={18} /> Export
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Gathering Inventory...</p>
              </div>
            ) : sourcingList.length > 0 ? (
              <div className="grid gap-3 md:gap-4">
                {sourcingList.map((item, index) => (
                  <div key={index} className="flex flex-col p-5 md:p-6 bg-[#0a0a0a] border border-white/5 rounded-[1.5rem] md:rounded-[2rem] hover:border-blue-500/20 transition-all gap-4">
                    
                    {/* Item Info Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 md:gap-5">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-[10px] md:text-[12px] font-black text-blue-500 border border-white/5 shrink-0">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <h3 className="text-sm md:text-lg font-black text-gray-200 tracking-tight uppercase italic truncate max-w-[150px] md:max-w-none">
                            {item.name}
                          </h3>
                          <p className="text-[8px] md:text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                            Orders: {item.breakdown.length}
                          </p>
                        </div>
                      </div>

                      {/* Total Weight for Desktop (Hidden on Mobile Card Top) */}
                      <div className="hidden md:block text-right">
                        <p className="text-2xl font-black text-blue-500 leading-none">
                          {item.totalQty.toFixed(2)} <span className="text-xs text-gray-600 italic font-normal">KG</span>
                        </p>
                      </div>
                    </div>

                    {/* Breakdown Area - Responsive */}
                    <div className="pt-2 border-t border-white/5">
                      {viewMode === 'sourcing' ? (
                        <div className="w-full">
                           {/* Mobile view total quantity highlight */}
                          <div className="md:hidden flex justify-between items-end mb-2">
                             <span className="text-[9px] font-black text-gray-600 uppercase italic">Total Volume:</span>
                             <p className="text-2xl font-black text-blue-500 leading-none">
                                {item.totalQty.toFixed(2)} <span className="text-xs text-gray-600 ml-1">KG</span>
                             </p>
                          </div>
                          <p className="text-[10px] md:text-[11px] font-bold text-gray-500 italic break-words leading-relaxed">
                            {item.breakdown.join(' + ')}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {item.breakdown.map((weight: number, i: number) => (
                            <div key={i} className="px-2 py-1 md:px-3 md:py-1 bg-green-500/10 border border-green-500/20 rounded-md md:rounded-lg flex items-baseline gap-1">
                              <span className="text-xs md:text-sm font-black text-white">{weight}</span>
                              <span className="text-[7px] md:text-[8px] text-green-500 font-black">KG</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <AlertCircle size={40} className="mx-auto text-gray-800 mb-4" />
                <p className="text-gray-600 font-black uppercase text-[10px] tracking-widest">No active orders found.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
      `}</style>
    </div>
  );
}