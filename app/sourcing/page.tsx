'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Calendar, AlertCircle, Loader2, FileDown, Search, ArrowRight, Package } from 'lucide-react'; // ✅ lucide-react ঠিক করা হয়েছে
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
          
          // ✅ সোর্টিং: ছোট থেকে বড় ওজন অনুযায়ী সাজানো
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

  // ✅ ফিক্স করা পিডিএফ ডাউনলোড ফাংশন
  const downloadPDF = () => {
    const doc = new jsPDF();
    const isBagsView = viewMode === 'bags';
    
    doc.setFontSize(16);
    
    // 🛠️ ফিক্স: setTextColor-এ সরাসরি ভ্যালু পাস করা হয়েছে (Invalid argument এরর দূর করতে)
    if (isBagsView) {
      doc.setTextColor(22, 101, 52); // গ্রিন
    } else {
      doc.setTextColor(37, 99, 235); // ব্লু
    }
    
    doc.text(isBagsView ? "SeaLand Agro - Packing/Bags List" : "SeaLand Agro - Sourcing List", 14, 15);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100); // গ্রে
    doc.text(`Period: ${startDate} to ${endDate} | Type: ${isBagsView ? 'Bags Detail' : 'Total Sourcing'}`, 14, 22);

    const tableHead = isBagsView 
      ? [['SL', 'Product Name', 'Bags Detail (Weight in KG)', 'Total Bags']] 
      : [['SL', 'Product Name', 'Total Sourcing Quantity']];

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
      headStyles: { 
        fillColor: isBagsView ? [22, 101, 52] : [37, 99, 235], 
        fontSize: 10,
        fontStyle: 'bold',
        textColor: [255, 255, 255]
      },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        1: { fontStyle: 'bold' },
        2: { halign: isBagsView ? 'left' : 'right' }
      }
    });

    const fileName = isBagsView ? `Bags_List_${startDate}.pdf` : `Sourcing_List_${startDate}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#020202] text-white font-sans selection:bg-blue-500/30">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex-none p-8 pb-6 bg-[#020202] border-b border-white/5 z-20">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                Inventory Hub
              </h1>
              
              <div className="flex gap-2 mt-4 bg-white/5 p-1 rounded-xl w-fit border border-white/10">
                <button 
                  onClick={() => setViewMode('sourcing')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'sourcing' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  <ShoppingCart size={14}/> Sourcing List
                </button>
                <button 
                  onClick={() => setViewMode('bags')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'bags' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  <Package size={14}/> Bags List (Sorted)
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-[#0a0a0a] p-2 rounded-3xl border border-white/5 shadow-2xl">
              <div className="flex items-center gap-4 px-4 py-1 border-r border-white/10">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-gray-500">From</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-white cursor-pointer" />
                </div>
                <ArrowRight size={14} className="text-gray-700" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-gray-500">To</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-white cursor-pointer" />
                </div>
              </div>
              
              <button onClick={fetchSourcingData} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[11px] font-black uppercase flex items-center gap-2 transition-all active:scale-95">
                <Search size={16} /> Sync
              </button>

              <button onClick={downloadPDF} className="bg-white text-black px-6 py-3 rounded-2xl font-black uppercase text-[11px] flex items-center gap-2 hover:bg-green-500 hover:text-white transition-all">
                <FileDown size={18} /> Export PDF
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-40">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Gathering Inventory...</p>
              </div>
            ) : sourcingList.length > 0 ? (
              <div className="grid gap-4">
                {sourcingList.map((item, index) => (
                  <div key={index} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-[#0a0a0a] border border-white/5 rounded-[2rem] hover:border-blue-500/20 transition-all gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[12px] font-black text-blue-500 border border-white/5">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-200 tracking-tight uppercase italic">{item.name}</h3>
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Order Count: {item.breakdown.length}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col md:items-end gap-2">
                      {viewMode === 'sourcing' ? (
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-gray-600 italic mb-1">{item.breakdown.join(' + ')}</p>
                          <p className="text-3xl font-black text-blue-500 leading-none">
                            {item.totalQty.toFixed(2)} <span className="text-xs text-gray-600 ml-1 italic font-normal">KG</span>
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 justify-end max-w-lg">
                          {item.breakdown.map((weight: number, i: number) => (
                            <div key={i} className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg flex items-baseline gap-1">
                              <span className="text-sm font-black text-white">{weight}</span>
                              <span className="text-[8px] text-green-500 font-black">KG</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-40">
                <AlertCircle size={48} className="mx-auto text-gray-800 mb-4" />
                <p className="text-gray-600 font-black uppercase text-xs tracking-widest">No active orders.</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2563eb; }
      `}</style>
    </div>
  );
}