'use client'
import { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService'; 
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, FileText, ArrowDownLeft, Search, Download, Calendar, RotateCcw, Scissors
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CustomerReport() {
  const [customerName, setCustomerName] = useState('');
  const [allCustomers, setAllCustomers] = useState<string[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const COMPANY = {
    name: 'SEALAND AGRO',
    slogan: 'A Commitment to Freshness',
    address: 'Plot # 17, Road # 02, Block # B, Dhaka Udyaan, Mohammadpur, Dhaka-1207',
    contact: 'Phone: +880 1XXXXXXXXX',
    brandColor: [0, 102, 51] 
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase.from('invoices').select('customer_name');
      if (data) {
        const uniqueNames = Array.from(new Set(data.map(item => item.customer_name)));
        setAllCustomers(uniqueNames.sort());
      }
    };
    fetchCustomers();
  }, []);

  // --- UPDATED LOGIC: ADJUSTMENT/DISCOUNT INCLUDED ---
  const processTransactions = () => {
    if (!data) return [];
    
    let combined = [
      ...data.invoices.map((inv: any) => ({
        date: new Date(inv.created_at),
        dateStr: inv.created_at,
        ref: `#${inv.invoice_number}`,
        debit: Number(inv.total_amount),
        credit: 0,
        adjustment: Number(inv.discount || 0) // ডিসকাউন্ট ডাটা ইনক্লুড করা হলো
      })),
      ...data.payments.map((p: any) => ({
        date: new Date(p.payment_date),
        dateStr: p.payment_date,
        ref: 'PAYMENT RECEIVED',
        debit: 0,
        credit: Number(p.amount_paid),
        adjustment: 0
      }))
    ];

    combined.sort((a, b) => a.date.getTime() - b.date.getTime());

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      combined = combined.filter(t => t.date >= start && t.date <= end);
    }

    let currentBal = 0;
    return combined.map(item => {
      // ব্যালেন্স = ডেবিট - ক্রেডিট - এডজাস্টমেন্ট
      currentBal += (item.debit - item.credit - item.adjustment);
      return { ...item, balance: currentBal };
    });
  };

  const transactions = processTransactions();
  const totalOrdered = transactions.reduce((acc, curr) => acc + curr.debit, 0);
  const totalPaid = transactions.reduce((acc, curr) => acc + curr.credit, 0);
  const totalAdjustment = transactions.reduce((acc, curr) => acc + (curr.adjustment || 0), 0);
  const currentDue = totalOrdered - totalPaid - totalAdjustment; // নিট ডিউ ক্যালকুলেশন

  const generatePDF = () => {
    if (!data || transactions.length === 0) return;
    
    const doc = new jsPDF();
    doc.setFillColor(COMPANY.brandColor[0], COMPANY.brandColor[1], COMPANY.brandColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(22); doc.setTextColor(255); doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, 14, 20);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(COMPANY.slogan, 14, 26);
    doc.text(COMPANY.address, 115, 18, { maxWidth: 85 });
    doc.text(COMPANY.contact, 115, 30);

    doc.setTextColor(0); doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text('CUSTOMER ACCOUNT STATEMENT', 14, 52);
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Customer: ${customerName}`, 14, 60);
    doc.text(`Period: ${startDate || 'All Time'} to ${endDate || 'Today'}`, 14, 65);

    doc.setFillColor(240, 248, 240); doc.rect(140, 52, 56, 18, 'F');
    doc.setTextColor(COMPANY.brandColor[0], COMPANY.brandColor[1], COMPANY.brandColor[2]);
    doc.text('NET DUE', 145, 59);
    doc.setFontSize(12); doc.text(`Tk ${currentDue.toLocaleString()}/-`, 145, 66);
    
    const tableBody = transactions.map(t => [
      new Date(t.dateStr).toLocaleDateString('en-GB'),
      t.ref,
      t.debit > 0 ? t.debit.toLocaleString() : '-',
      t.credit > 0 ? t.credit.toLocaleString() : '-',
      t.adjustment > 0 ? t.adjustment.toLocaleString() : '-', // PDF-এ ডিসকাউন্ট কলাম
      t.balance.toLocaleString()
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Date', 'Description', 'Debit (+)', 'Credit (-)', 'Adjust (-)', 'Balance']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: COMPANY.brandColor },
      styles: { fontSize: 8 }
    });

    doc.save(`${customerName}_Statement.pdf`);
  };

  const handleSearch = async (name: string) => {
    if (!name) return;
    setIsLoading(true);
    setShowDropdown(false);
    try {
      const result = await reportService.getCustomerReport(name);
      setData(result);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white p-4 lg:p-8 overflow-hidden">
      
      {/* Search Header */}
      <div className="bg-[#0a0a0a]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 mb-8 space-y-5">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-[2]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" value={customerName}
              placeholder="Search Customer Profile..."
              onChange={(e) => {
                setCustomerName(e.target.value);
                const filtered = allCustomers.filter(c => c.toLowerCase().includes(e.target.value.toLowerCase()));
                setFilteredCustomers(filtered);
                setShowDropdown(true);
              }}
              className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-14 pr-4 font-bold outline-none focus:border-green-600 transition-all text-sm text-white"
            />
            {showDropdown && filteredCustomers.length > 0 && (
              <div className="absolute z-50 w-full mt-3 bg-[#0d0d0d] border border-white/10 rounded-2xl max-h-60 overflow-y-auto">
                {filteredCustomers.map((name, i) => (
                  <div key={i} onClick={() => { setCustomerName(name); handleSearch(name); }} className="px-6 py-4 hover:bg-green-600/10 cursor-pointer text-[10px] font-black italic uppercase border-b border-white/5 tracking-widest text-white">
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-1 gap-3 items-center">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-black/50 border border-white/10 rounded-2xl py-3 px-4 text-[10px] font-black uppercase text-gray-300 outline-none" />
            <span className="text-gray-700 font-black text-[10px]">TO</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-black/50 border border-white/10 rounded-2xl py-3 px-4 text-[10px] font-black uppercase text-gray-300 outline-none" />
          </div>

          <button onClick={() => handleSearch(customerName)} className="bg-green-600 hover:bg-green-500 text-black px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">
            {isLoading ? '...' : 'GET REPORT'}
          </button>
        </div>
      </div>

      {data && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* UPDATED: Stats Section with 4 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Ordered" value={totalOrdered} color="text-blue-500" icon={<FileText size={18}/>} />
            <StatCard label="Total Received" value={totalPaid} color="text-green-500" icon={<ArrowDownLeft size={18}/>} />
            <StatCard label="Adjustment/Damage" value={totalAdjustment} color="text-orange-500" icon={<RotateCcw size={18}/>} />
            <StatCard label="Net Balance" value={currentDue} color="text-red-500" icon={<TrendingUp size={18}/>} highlight />
          </div>

          {/* Ledger Table */}
          <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-[3rem] flex flex-col overflow-hidden">
            <div className="p-8 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-white">Statement Ledger</h2>
              <button onClick={generatePDF} className="flex items-center gap-2 bg-green-600/10 hover:bg-green-600/20 text-green-500 px-6 py-3 rounded-xl border border-green-600/20">
                <Download size={16} /><span className="text-[10px] font-black">Download PDF</span>
              </button>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar px-6">
              <table className="w-full text-[11px] border-separate border-spacing-y-3">
                <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                  <tr className="text-gray-600 text-[9px] font-black uppercase tracking-widest italic">
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Reference</th>
                    <th className="px-6 py-4 text-right">Debit</th>
                    <th className="px-6 py-4 text-right">Credit</th>
                    <th className="px-6 py-4 text-right text-orange-500">Adjustment</th>
                    <th className="px-6 py-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={i} className="bg-white/[0.01] hover:bg-white/[0.03] transition-all rounded-2xl group">
                      <td className="px-6 py-5 text-gray-500 rounded-l-2xl border-y border-l border-white/5">{new Date(t.dateStr).toLocaleDateString('en-GB')}</td>
                      <td className="px-6 py-5 font-bold italic text-gray-300 border-y border-white/5">{t.ref}</td>
                      <td className="px-6 py-5 text-right text-blue-500 border-y border-white/5">{t.debit > 0 ? `${t.debit.toLocaleString()}/-` : '—'}</td>
                      <td className="px-6 py-5 text-right text-green-500 border-y border-white/5">{t.credit > 0 ? `${t.credit.toLocaleString()}/-` : '—'}</td>
                      <td className="px-6 py-5 text-right text-orange-500 border-y border-white/5 font-bold">{t.adjustment > 0 ? `${t.adjustment.toLocaleString()}/-` : '—'}</td>
                      <td className="px-6 py-5 text-right font-black text-white rounded-r-2xl border-y border-r border-white/5">{t.balance.toLocaleString()}/-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon, highlight }: any) {
  return (
    <div className={`bg-[#0a0a0a] border ${highlight ? 'border-red-500/20 shadow-red-900/10' : 'border-white/5'} p-5 rounded-[2rem] relative group overflow-hidden`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic mb-1">{label}</p>
          <h4 className={`text-xl font-black italic tracking-tighter ${color}`}>{value.toLocaleString()} <span className="text-[10px]">/-</span></h4>
        </div>
        <div className={`p-3 bg-white/5 rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}