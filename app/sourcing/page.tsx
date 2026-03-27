'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Calendar, AlertCircle, Loader2, FileDown, Search, ArrowRight, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SourcingPage() {
  const [sourcingList, setSourcingList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ লোকাল ক্যালেন্ডার অনুযায়ী আজকের তারিখ পাওয়ার ফাংশন
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
  }, [startDate, endDate]); // তারিখ পরিবর্তন হলে অটোমেটিক ডেটা রিফ্রেশ হবে

  const fetchSourcingData = async () => {
    setIsLoading(true);
    try {
      // ✅ লোকাল তারিখকে কুয়েরি উপযোগী টাইমস্ট্যাম্পে রূপান্তর
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
    doc.setFontSize(16);
    doc.setTextColor(22, 163, 74); 
    doc.text("SeaLand Agro - Sourcing List", 14, 15);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 22);

    const half = Math.ceil(sourcingList.length / 2);
    const tableBody = [];

    for (let i = 0; i < half; i++) {
      const left = sourcingList[i];
      const right = sourcingList[i + half];
      
      tableBody.push([
        left ? `${left.name}` : "",
        left ? `${left.totalQty.toFixed(2)} kg` : "",
        right ? `${right.name}` : "",
        right ? `${right.totalQty.toFixed(2)} kg` : ""
      ]);
    }

    autoTable(doc, {
      startY: 30,
      head: [['Product (Group A)', 'Qty', 'Product (Group B)', 'Qty']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } }
    });

    doc.save(`Sourcing_${startDate}.pdf`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#020202] text-white font-sans selection:bg-blue-500/30">
      <div className="flex-1 flex flex-col min-w-0">
        
        <header className="flex-none p-10 pb-6 bg-[#020202] border-b border-white/5 z-20">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div className="space-y-1">
              <h1 className="text-5xl font-black uppercase italic tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                Sourcing List
              </h1>
              <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.5em]">Inventory Analytics</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-[#0a0a0a] p-2 rounded-3xl border border-white/5 shadow-2xl">
              <div className="flex items-center gap-4 px-4 py-1 border-r border-white/10">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-gray-500 text-left">From</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-white cursor-pointer" />
                </div>
                <ArrowRight size={14} className="text-gray-700" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-gray-500 text-left">To</span>
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

        <main className="flex-1 overflow-y-auto p-10 pt-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-40">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Gathering Orders...</p>
              </div>
            ) : sourcingList.length > 0 ? (
              <div className="grid gap-3">
                {sourcingList.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-6 bg-gradient-to-r from-[#080808] to-[#040404] border border-white/5 rounded-3xl hover:border-blue-500/20 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[11px] font-black text-gray-600 border border-white/5">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <h3 className="text-md font-bold text-gray-300 tracking-tight">{item.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium text-gray-600 italic mb-1">
                        {item.breakdown.length > 1 ? `${item.breakdown.join(' + ')} =` : ''}
                      </p>
                      <p className="text-2xl font-black text-green-500 leading-none">
                        {item.totalQty.toFixed(2)} <span className="text-[10px] text-gray-600 ml-1">KG</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-40">
                <AlertCircle size={48} className="mx-auto text-gray-800 mb-4" />
                <p className="text-gray-600 font-black uppercase text-xs tracking-widest">No active orders for selected dates.</p>
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