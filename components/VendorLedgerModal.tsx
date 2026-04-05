'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Download, Loader2, Calendar, Filter, Edit2, Trash2, Check, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function VendorLedgerModal({ isOpen, onClose, vendor }: any) {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingKey, setEditingKey] = useState<string | null>(null); 
  const [editValue, setEditValue] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const COMPANY = {
    name: 'SEALAND AGRO',
    slogan: 'A COMMITMENT TO TRANSPARENCY',
    brandColor: [247, 108, 33] 
  };

  const getLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  const getFirstDayOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 2).toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getLocalDate());

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

  const generatePDF = () => {
    if (!vendor || ledger.length === 0) return;
    const doc = new jsPDF();
    
    doc.setFillColor(COMPANY.brandColor[0], COMPANY.brandColor[1], COMPANY.brandColor[2]);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(COMPANY.name, 14, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY.slogan, 14, 30);
    doc.text("VENDOR TRANSACTION STATEMENT", 14, 40);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); 
    doc.setFont("helvetica", "bold");
    doc.text(`SUPPLIER: ${vendor.name.toUpperCase()}`, 14, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Contact: ${vendor.phone || 'N/A'}`, 14, 61);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: ${startDate} to ${endDate}`, 196, 55, { align: 'right' });
    
    const totalDue = vendor.current_due || 0;
    doc.text(`Total Balance Due: BDT ${totalDue.toLocaleString()}`, 196, 61, { align: 'right' });

    autoTable(doc, {
      startY: 68,
      margin: { left: 14, right: 14 },
      head: [['TOTAL BILL', 'TOTAL PAID', 'CLOSING DUE']],
      body: [[
        `BDT ${ledger.reduce((sum, r) => sum + (r.debit || 0), 0).toLocaleString()}`,
        `BDT ${ledger.reduce((sum, r) => sum + (r.credit || 0), 0).toLocaleString()}`,
        `BDT ${totalDue.toLocaleString()}`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [51, 51, 51], halign: 'center' },
      styles: { halign: 'center', fontSize: 12, fontStyle: 'bold' }
    });

    const tableData = ledger.map(row => [
      row.date,
      row.description.toUpperCase(),
      row.debit > 0 ? row.debit.toLocaleString() : '-',
      row.credit > 0 ? row.credit.toLocaleString() : '-'
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['DATE', 'DESCRIPTION', 'DEBIT (BILL)', 'CREDIT (PAID)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: COMPANY.brandColor as [number, number, number] },
      styles: { fontSize: 8 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } }
    });

    doc.save(`${vendor.name}_Statement.pdf`);
  };

  // --- ডাটা আপডেট লজিক (Due Adjustment সহ) ---
  const handleUpdate = async (row: any, rowKey: string) => {
    if (!row.id) return;
    setIsProcessing(rowKey);
    try {
      const isPurchase = row.debit > 0;
      if (isPurchase) {
        // পারচেজ আপডেট করলে due_amount ও আপডেট হবে
        await supabase.from('purchases').update({ 
          total_amount: editValue,
          due_amount: editValue // এডিট করলে ডিউ নতুন টোটাল হয়ে যাবে (পেমেন্ট লজিক পরে অ্যাডজাস্ট হবে)
        }).eq('id', row.id);
      } else {
        await supabase.from('vendor_payments').update({ amount_paid: editValue }).eq('id', row.id);
      }

      setEditingKey(null);
      await fetchLedger();
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (row: any, rowKey: string) => {
    if (!confirm("Are you sure? This will affect the supplier's balance!")) return;
    setIsProcessing(rowKey);
    try {
      const targetTable = row.debit > 0 ? 'purchases' : 'vendor_payments';
      await supabase.from(targetTable).delete().eq('id', row.id);
      
      // ডিলিট করার পর লেজার রিফ্রেশ
      await fetchLedger();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  if (!isOpen || !vendor) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[110] flex justify-end text-white font-sans overflow-hidden">
      <div className="bg-[#0a0a0a] w-full max-w-2xl h-full border-l border-white/10 p-6 md:p-8 flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col">
             <h2 className="text-2xl md:text-4xl font-black italic uppercase text-orange-500 tracking-tighter leading-none">{vendor.name}</h2>
             <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 tracking-[0.3em] opacity-50">Transaction History</span>
          </div>
          
          <div className="flex items-center gap-2">
            {ledger.length > 0 && (
              <button onClick={generatePDF} className="flex items-center gap-2 bg-white/5 hover:bg-orange-600 border border-white/10 p-3 rounded-2xl transition-all group">
                <Download size={18} />
                <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">Statement</span>
              </button>
            )}
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-gray-400 transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-4 mb-8 bg-white/[0.02] border border-white/5 p-5 rounded-[2.5rem]">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-gray-500 uppercase ml-2 italic">From</label>
               <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                 className="w-full bg-black border border-white/10 rounded-2xl py-3 px-4 text-[11px] font-bold text-white outline-none focus:border-orange-500/50 [color-scheme:dark]" />
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black text-gray-500 uppercase ml-2 italic">To</label>
               <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                 className="w-full bg-black border border-white/10 rounded-2xl py-3 px-4 text-[11px] font-bold text-white outline-none focus:border-orange-500/50 [color-scheme:dark]" />
            </div>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 bg-black/40 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="overflow-y-auto h-full custom-scrollbar">
            <table className="w-full text-left text-[11px] border-separate border-spacing-y-2 px-4">
              <thead className="bg-[#0a0a0a] sticky top-0 z-20">
                <tr className="text-gray-600 font-black uppercase text-[8px] tracking-[0.2em]">
                  <th className="p-4">Details</th>
                  <th className="p-4 text-right">Debit (-)</th>
                  <th className="p-4 text-right">Credit (+)</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="p-20 text-center animate-pulse font-black text-gray-800 tracking-widest">LOADING LEDGER...</td></tr>
                ) : ledger.length === 0 ? (
                  <tr><td colSpan={4} className="p-20 text-center text-gray-700 italic">No transactions found</td></tr>
                ) : ledger.map((row, index) => {
                  const rowKey = `${row.id}-${row.debit > 0 ? 'pur' : 'pay'}`;
                  return (
                    <tr key={rowKey} className="bg-white/[0.02] hover:bg-white/[0.04] transition-all group rounded-2xl border border-white/5">
                      <td className="p-4 rounded-l-2xl">
                        <div className="text-[9px] text-gray-600 font-mono mb-1">{row.date}</div>
                        <div className="font-bold text-white/80 uppercase tracking-tighter line-clamp-1">{row.description}</div>
                      </td>
                      <td className="p-4 text-right font-black text-red-500">
                        {editingKey === rowKey && row.debit > 0 ? (
                          <input type="number" value={editValue} onChange={(e) => setEditValue(Number(e.target.value))}
                            className="w-20 bg-red-500/10 border border-red-500/50 rounded-lg p-1 text-right text-white" autoFocus />
                        ) : (
                          row.debit > 0 ? `৳${row.debit.toLocaleString()}` : '-'
                        )}
                      </td>
                      <td className="p-4 text-right font-black text-emerald-500">
                        {editingKey === rowKey && row.credit > 0 ? (
                          <input type="number" value={editValue} onChange={(e) => setEditValue(Number(e.target.value))}
                            className="w-20 bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-1 text-right text-white" autoFocus />
                        ) : (
                          row.credit > 0 ? `৳${row.credit.toLocaleString()}` : '-'
                        )}
                      </td>
                      <td className="p-4 text-center rounded-r-2xl">
                        <div className="flex items-center justify-center gap-2">
                          {isProcessing === rowKey ? (
                            <Loader2 className="animate-spin text-orange-500" size={14} />
                          ) : editingKey === rowKey ? (
                            <button onClick={() => handleUpdate(row, rowKey)} className="p-1.5 bg-emerald-500 text-black rounded-lg"><Check size={14} /></button>
                          ) : (
                            <>
                              <button onClick={() => { setEditingKey(rowKey); setEditValue(row.debit > 0 ? row.debit : row.credit); }} className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Edit2 size={14} /></button>
                              <button onClick={() => handleDelete(row, rowKey)} className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f76c21; }
      `}</style>
    </div>
  );
}