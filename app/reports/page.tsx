'use client'
import { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService'; 
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, FileText, ArrowDownLeft, Search, Download, Calendar, RotateCcw, User, MapPin, Phone
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

  // আপনার কোম্পানির আপডেট তথ্য
  const COMPANY = {
    name: 'SEALAND AGRO',
    slogan: 'A Commitment to Freshness',
    address: 'Dhaka Udyaan, Mohammadpur, Dhaka-1207',
    contact: 'Phone: +880 1714-114396', // আপনার সঠিক নম্বরটি এখানে বসিয়ে নিন
    brandColor: [22, 163, 74] // Green-600 (RGB)
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

  const processTransactions = () => {
    if (!data) return [];
    let combined = [
      ...data.invoices.map((inv: any) => ({
        date: new Date(inv.created_at.split('T')[0]),
        dateStr: inv.created_at.split('T')[0],
        ref: `#${inv.invoice_number}`,
        debit: Number(inv.total_amount),
        credit: 0,
        adjustment: Number(inv.discount || 0) 
      })),
      ...data.payments.map((p: any) => ({
        date: new Date(p.payment_date.split('T')[0]),
        dateStr: p.payment_date.split('T')[0],
        ref: 'PAYMENT',
        debit: 0,
        credit: Number(p.amount_paid),
        adjustment: Number(p.adjustment_amount || 0) 
      }))
    ];

    combined.sort((a, b) => a.date.getTime() - b.date.getTime());

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      combined = combined.filter(t => t.date >= start && t.date <= end);
    }

    let currentBal = 0;
    return combined.map(item => {
      currentBal += (item.debit - item.credit - item.adjustment);
      return { ...item, balance: currentBal };
    });
  };

  const transactions = processTransactions();
  const totalOrdered = transactions.reduce((acc, curr) => acc + curr.debit, 0);
  const totalPaid = transactions.reduce((acc, curr) => acc + curr.credit, 0);
  const totalAdjustment = transactions.reduce((acc, curr) => acc + (curr.adjustment || 0), 0);
  const currentDue = totalOrdered - totalPaid - totalAdjustment;

  // প্রফেশনাল পিডিএফ জেনারেটর
  const generatePDF = () => {
    if (!data || transactions.length === 0) return;
    const doc = new jsPDF();
    
    // Header background
    doc.setFillColor(COMPANY.brandColor[0], COMPANY.brandColor[1], COMPANY.brandColor[2]);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Company Logo/Name
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, 15, 20);
    
    // Company Slogan & Info
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY.slogan, 15, 27);
    doc.text(`${COMPANY.address} | ${COMPANY.contact}`, 15, 33);
    
    // Report Title
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('CUSTOMER ACCOUNT STATEMENT', 15, 60);
    
    // Customer Details Box
    doc.setDrawColor(230, 230, 230);
    doc.line(15, 65, 195, 65);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Customer: ${customerName}`, 15, 75);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${startDate || 'All Time'} to ${endDate || new Date().toLocaleDateString()}`, 15, 81);
    
    // Summary Box Right Side
    doc.setFillColor(245, 245, 245);
    doc.rect(130, 68, 65, 25, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Due: BDT ${currentDue.toLocaleString()}/-`, 135, 83);

    const tableBody = transactions.map(t => [
      new Date(t.dateStr).toLocaleDateString('en-GB'),
      t.ref,
      t.debit > 0 ? t.debit.toLocaleString() : '-',
      t.credit > 0 ? t.credit.toLocaleString() : '-',
      t.adjustment > 0 ? t.adjustment.toLocaleString() : '-', 
      t.balance.toLocaleString()
    ]);

    autoTable(doc, {
      startY: 100,
      head: [['Date', 'Ref / Memo', 'Debit', 'Credit', 'Adjust', 'Balance']],
      body: tableBody,
      theme: 'striped',
      headStyles: { 
        fillColor: [30, 30, 30], 
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' }
      },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // Footer Signature Area
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.setDrawColor(150, 150, 150);
    doc.line(15, finalY, 65, finalY);
    doc.setFontSize(9);
    doc.text('Customer Signature', 15, finalY + 7);
    
    doc.line(145, finalY, 195, finalY);
    doc.text('Authorized Signature', 145, finalY + 7);

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
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 flex flex-col overflow-x-hidden">
      
      {/* Search & Filter Header */}
      <div className="bg-[#0a0a0a]/80 backdrop-blur-xl p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 mb-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Customer Search */}
          <div className="relative flex-[2]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" value={customerName}
              placeholder="Search Customer..."
              onChange={(e) => {
                setCustomerName(e.target.value);
                const filtered = allCustomers.filter(c => c.toLowerCase().includes(e.target.value.toLowerCase()));
                setFilteredCustomers(filtered);
                setShowDropdown(true);
              }}
              className="w-full bg-black/50 border border-white/10 rounded-xl md:rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:border-green-600 transition-all text-xs md:text-sm text-white"
            />
            {showDropdown && filteredCustomers.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-[#0d0d0d] border border-white/10 rounded-xl max-h-60 overflow-y-auto shadow-2xl">
                {filteredCustomers.map((name, i) => (
                  <div key={i} onClick={() => { setCustomerName(name); handleSearch(name); }} className="px-5 py-4 hover:bg-green-600/10 cursor-pointer text-[10px] font-black italic uppercase border-b border-white/5 tracking-widest text-white">
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date Filter */}
          <div className="flex flex-row gap-2 items-center justify-between lg:justify-start">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-xl py-3 px-3 text-[9px] font-black uppercase text-gray-300 outline-none" />
            <span className="text-gray-700 font-black text-[9px]">TO</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-xl py-3 px-3 text-[9px] font-black uppercase text-gray-300 outline-none" />
          </div>

          <button onClick={() => handleSearch(customerName)} className="w-full lg:w-auto bg-green-600 hover:bg-green-500 text-black px-8 py-4 rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest transition-transform active:scale-95 shadow-lg shadow-green-600/10">
            {isLoading ? 'Loading...' : 'Get Report'}
          </button>
        </div>
      </div>

      {data ? (
        <div className="flex-1 flex flex-col animate-in fade-in duration-500">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard label="Ordered" value={totalOrdered} color="text-blue-500" icon={<FileText size={16}/>} />
            <StatCard label="Received" value={totalPaid} color="text-green-500" icon={<ArrowDownLeft size={16}/>} />
            <StatCard label="Adjusted" value={totalAdjustment} color="text-orange-500" icon={<RotateCcw size={16}/>} />
            <StatCard label="Net Due" value={currentDue} color="text-red-500" icon={<TrendingUp size={16}/>} highlight />
          </div>

          {/* Ledger Table Section */}
          <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-[1.5rem] md:rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/10 rounded-lg text-green-500"><User size={16}/></div>
                <div>
                  <h2 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] text-white">Statement Ledger</h2>
                  <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mt-1">{customerName}</p>
                </div>
              </div>
              <button onClick={generatePDF} className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-black px-6 py-3 rounded-xl font-black transition-colors active:scale-95">
                <Download size={16} /><span className="text-[10px] uppercase">Export PDF</span>
              </button>
            </div>

            <div className="overflow-x-auto flex-1 custom-scrollbar px-2 md:px-6">
              <table className="w-full text-[10px] md:text-[11px] border-separate border-spacing-y-2">
                <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                  <tr className="text-gray-600 text-[8px] md:text-[9px] font-black uppercase tracking-widest italic">
                    <th className="px-4 py-4 text-left">Date</th>
                    <th className="px-4 py-4 text-left">Ref</th>
                    <th className="px-4 py-4 text-right">Debit</th>
                    <th className="px-4 py-4 text-right">Credit</th>
                    <th className="px-4 py-4 text-right hidden sm:table-cell">Adjust</th>
                    <th className="px-4 py-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={i} className="bg-white/[0.01] hover:bg-white/[0.03] transition-all rounded-xl group">
                      <td className="px-4 py-4 text-gray-500 rounded-l-xl border-y border-l border-white/5">
                        {new Date(t.dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="px-4 py-4 font-bold italic text-gray-300 border-y border-white/5">{t.ref}</td>
                      <td className="px-4 py-4 text-right text-blue-500 border-y border-white/5">{t.debit > 0 ? t.debit.toLocaleString() : '—'}</td>
                      <td className="px-4 py-4 text-right text-green-500 border-y border-white/5">{t.credit > 0 ? t.credit.toLocaleString() : '—'}</td>
                      <td className="px-4 py-4 text-right text-orange-500 border-y border-white/5 font-bold hidden sm:table-cell">{t.adjustment > 0 ? t.adjustment.toLocaleString() : '—'}</td>
                      <td className="px-4 py-4 text-right font-black text-white rounded-r-xl border-y border-r border-white/5">{t.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-20 text-center">
          <FileText size={64} className="mb-4" />
          <p className="font-black uppercase tracking-[0.3em] text-xs">Search a customer to load report</p>
        </div>
      )}
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color, icon, highlight }: any) {
  return (
    <div className={`bg-[#0a0a0a] border ${highlight ? 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-white/5'} p-4 md:p-5 rounded-[1.2rem] md:rounded-[2rem] relative group transition-all`}>
      <p className="text-[7px] md:text-[8px] font-black text-gray-500 uppercase tracking-widest italic mb-1">{label}</p>
      <div className="flex justify-between items-end">
        <h4 className={`text-base md:text-xl font-black italic tracking-tighter ${color}`}>{value.toLocaleString()} <span className="text-[8px]">/-</span></h4>
        <div className={`p-2 bg-white/5 rounded-lg ${color} hidden sm:block`}>{icon}</div>
      </div>
    </div>
  );
}