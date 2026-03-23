'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, ArrowRight, Printer, ChevronLeft, Loader2, Download } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf'; // ছোট হাতের 'jspdf' থেকে ইমপোর্ট করুন
import autoTable from 'jspdf-autotable';

export default function SourcingPage() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [sourcingList, setSourcingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSourcingData = useCallback(async () => {
    setLoading(true);
    // ১. ইনভয়েস আইডি সংগ্রহ
    const { data: invoices, error: invErr } = await supabase
      .from('invoices')
      .select('id')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);

    if (invErr || !invoices || invoices.length === 0) {
      setSourcingList([]);
      setLoading(false);
      return;
    }

    // ২. আইটেম সংগ্রহ ও Equation তৈরি
    const { data: items, error: itemErr } = await supabase
      .from('invoice_items')
      .select('product_name, qty')
      .in('invoice_id', invoices.map(inv => inv.id));

    if (items) {
      const summary: any = {};
      items.forEach(item => {
        const name = item.product_name;
        const qty = Number(item.qty) || 0;
        if (!summary[name]) summary[name] = { qtys: [], total: 0 };
        summary[name].qtys.push(qty);
        summary[name].total += qty;
      });

      const finalArray = Object.keys(summary).map(name => {
        // ✅ ছোট থেকে বড় ক্রমে সর্টিং লজিক যুক্ত করা হয়েছে
        const sortedQtys = summary[name].qtys.sort((a: number, b: number) => a - b);
        
        return {
          name,
          equation: sortedQtys.join(' + '),
          total: summary[name].total.toFixed(2) // দশমিকের পর ২ ঘর রাখা হয়েছে
        };
      });
      setSourcingList(finalArray);
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchSourcingData();
  }, [fetchSourcingData]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`SeaLand Agro - Sourcing List (${startDate})`, 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [['Product_Name', 'Total_Quantity']],
      body: sourcingList.map(item => [item.name, `${item.equation} = ${item.total}kg`]),
      headStyles: { fillColor: [34, 197, 94] }
    });
    doc.save(`Sourcing_${startDate}.pdf`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10 no-print">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-green-500 uppercase transition-colors">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex gap-3">
             <div className="flex items-center gap-3 bg-[#111] border border-gray-800 p-2 px-4 rounded-xl shadow-inner">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-white cursor-pointer" />
                <ArrowRight size={14} className="text-gray-700" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-white cursor-pointer" />
             </div>
             <button onClick={downloadPDF} className="p-3 bg-gray-900 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-all">
                <Download size={18} />
             </button>
             <button onClick={() => window.print()} className="p-3 bg-green-600 text-black rounded-xl hover:bg-green-500 shadow-lg shadow-green-900/20 transition-all active:scale-95">
                <Printer size={18} />
             </button>
          </div>
        </div>

        {/* Google Sheet Style Table */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#22c55e] border-b border-gray-300">
                <th className="p-5 text-black font-black uppercase text-xs tracking-wider border-r border-green-700 w-1/3">Product_Name</th>
                <th className="p-5 text-black font-black uppercase text-xs tracking-wider">Total_Quantity (Breakdown)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2} className="p-20">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-green-600" size={32} />
                      <p className="text-gray-400 italic font-medium">Calculating Sourcing Requirements...</p>
                    </div>
                  </td>
                </tr>
              ) : sourcingList.length > 0 ? (
                sourcingList.map((item, i) => (
                  <tr key={i} className={`group transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50/50`}>
                    <td className="p-5 text-black font-bold border-r border-gray-100 uppercase italic text-sm">{item.name}</td>
                    <td className="p-5 text-gray-600 font-mono text-sm text-right flex justify-between items-center">
                      <span className="text-gray-400 font-medium">{item.equation}</span>
                      <span className="font-black text-black ml-4 bg-gray-100 px-3 py-1 rounded-lg">
                         = {item.total} <span className="text-[10px] text-gray-500 uppercase">kg</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={2} className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest italic">No orders found for the selected dates</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        <footer className="mt-12 text-center no-print">
            <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.4em]">SeaLand Agro Operations Management v2.0</p>
        </footer>
      </div>
    </div>
  );
}