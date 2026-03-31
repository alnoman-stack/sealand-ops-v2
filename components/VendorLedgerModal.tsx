'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Download, Loader2, Calendar, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function VendorLedgerModal({ isOpen, onClose, vendor }: any) {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // তারিখ ফিল্টার (ডিফল্ট: গত ৩০ দিন)
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchLedger = async () => {
    if (!vendor?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_ledger_detailed')
        .select('*')
        .eq('vendor_id', vendor.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setLedger(data || []);
    } catch (err: any) {
      console.error("Database Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchLedger();
  }, [isOpen, vendor, startDate, endDate]);

  // প্রফেশনাল PDF জেনারেশন ফাংশন (স্লোগানসহ)
  const generatePDF = () => {
    if (ledger.length === 0) {
      alert("No data available to export!");
      return;
    }

    const doc = new jsPDF();
    
    // ১. ব্র্যান্ডিং হেডার (Orange Theme)
    doc.setFillColor(234, 88, 12); 
    doc.rect(0, 0, 210, 45, 'F'); 
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("SEALAND AGRO", 14, 20);
    
    // স্লোগান যুক্ত করা
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("A COMMITMENT TO TRANSPARENCY", 14, 28);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("VENDOR TRANSACTION STATEMENT", 14, 38);

    // ২. সাপ্লায়ার ও রিপোর্ট ইনফো
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`SUPPLIER: ${vendor.name.toUpperCase()}`, 14, 55);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Contact: ${vendor.phone || 'N/A'}`, 14, 61);
    doc.text(`Period: ${startDate} to ${endDate}`, 140, 55);
    doc.text(`Status: ${vendor.current_due > 0 ? 'DUE OUTSTANDING' : 'CLEAR'}`, 140, 61);

    // ৩. সামারি টেবিল
    autoTable(doc, {
      startY: 70,
      head: [['TOTAL BILL', 'TOTAL PAID', 'TOTAL DUE']],
      body: [[`BDT ${vendor.total_purchased}`, `BDT ${vendor.total_paid}`, `BDT ${vendor.current_due}`]],
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], halign: 'center' },
      styles: { halign: 'center', fontSize: 10, fontStyle: 'bold' },
    });

    // ৪. লেনদেনের মেইন টেবিল (History Log)
    const tableRows = ledger.map(item => [
      item.date,
      item.description.toUpperCase(),
      item.debit > 0 ? `${item.debit}` : '-',
      item.credit > 0 ? `${item.credit}` : '-'
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['DATE', 'DESCRIPTION', 'DEBIT (BILL)', 'CREDIT (PAID)']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [234, 88, 12] },
      styles: { fontSize: 8 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    // ৫. ফুটার
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer-generated report from SeaLand Agro Management Portal.", 14, finalY);

    doc.save(`Statement_${vendor.name}_${startDate}.pdf`);
  };

  if (!isOpen || !vendor) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex justify-end">
      <div className="bg-[#0a0a0a] w-full max-w-xl h-full border-l border-white/10 p-8 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black italic uppercase text-orange-500 tracking-tighter">{vendor.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
        </div>

        {/* Date Filter */}
        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl mb-8">
          <p className="text-[9px] font-black uppercase text-gray-500 mb-3 flex items-center gap-2 tracking-widest">
            <Filter size={12} className="text-orange-500" /> Date Range Filter
          </p>
          <div className="flex items-center gap-3">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 bg-black border border-white/10 rounded-xl py-2 px-3 text-[11px] font-bold text-white outline-none focus:border-orange-500 transition-all" />
            <span className="text-gray-600 text-[10px] font-black uppercase">To</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 bg-black border border-white/10 rounded-xl py-2 px-3 text-[11px] font-bold text-white outline-none focus:border-orange-500 transition-all" />
          </div>
        </div>

        {/* History Log Title & Download */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
            <Calendar size={14} /> History Log ({ledger.length})
          </h3>
          <button onClick={generatePDF}
            className="flex items-center gap-2 bg-orange-600 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/10 active:scale-95 font-bold">
            <Download size={14} /> Download PDF
          </button>
        </div>

        {/* Table Area */}
        <div className="flex-1 border border-white/5 rounded-[2rem] overflow-hidden bg-black/40 shadow-inner">
          <div className="overflow-y-auto h-full custom-scrollbar">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-white/[0.03] text-gray-600 font-black uppercase sticky top-0 border-b border-white/5 backdrop-blur-md">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Debit</th>
                  <th className="p-4 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={4} className="p-20 text-center animate-pulse uppercase font-black text-gray-600">Syncing Records...</td></tr>
                ) : ledger.length === 0 ? (
                  <tr><td colSpan={4} className="p-20 text-center font-bold italic text-gray-700 uppercase">No Transactions Found</td></tr>
                ) : (
                  ledger.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 text-gray-500 font-mono">{row.date}</td>
                      <td className="p-4 font-bold text-white/80 italic group-hover:text-orange-500 transition-colors uppercase">{row.description}</td>
                      <td className="p-4 text-right font-black text-red-500">{row.debit > 0 ? `৳${row.debit}` : '-'}</td>
                      <td className="p-4 text-right font-black text-green-500">{row.credit > 0 ? `৳${row.credit}` : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}