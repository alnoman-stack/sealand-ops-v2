"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Search, Plus, ChevronRight, Package, Wallet, Trash2, Edit3, X, BarChart3, TrendingUp, RotateCcw, Loader2, AlertCircle } from "lucide-react";

export default function ExpenseManager() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Transportation");
  const [itemName, setItemName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const today = new Date().toLocaleDateString("en-CA");
  const [date, setDate] = useState(today);
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDate, setFilterDate] = useState(today);
  const [editingId, setEditingId] = useState<string | null>(null);

  const categoryOptions = ["Product Sourcing", "Transportation", "Labor Cost", "Office Expense", "Marketing", "Others"];
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  const fetchAllFinancialData = async () => {
    setLoading(true);
    try {
      const { data: directExpenses } = await supabase.from("expenses").select("*");
      const { data: purchases } = await supabase.from("purchases").select("id, item_name, total_amount, purchase_date, quantity, rate, due_amount");

      const formattedPurchases = purchases?.map(p => ({
        id: p.id,
        date: p.purchase_date,
        category: "Product Sourcing",
        item_name: `${p.item_name} (${p.quantity}kg x ${p.rate})`,
        amount: p.total_amount,
        payment_method: Number(p.due_amount) > 0 ? 'Credit' : 'Cash',
        is_purchase: true 
      })) || [];

      const combined = [...(directExpenses || []), ...formattedPurchases].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setExpenses(combined);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAllFinancialData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !itemName) return;
    setLoading(true);
    const expenseData = { amount: parseFloat(amount), category, item_name: itemName, payment_method: paymentMethod, date: date };

    try {
      if (editingId) {
        await supabase.from("expenses").update(expenseData).eq("id", editingId);
        setEditingId(null);
      } else {
        await supabase.from("expenses").insert([expenseData]);
      }
      setAmount(""); setItemName(""); setDate(today); fetchAllFinancialData();
    } catch (error: any) { alert(error.message); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string, isPurchase: boolean) => {
    if (isPurchase) return alert("পণ্য কেনার রেকর্ড ডিলিট করতে ভেন্ডর ম্যানেজারে যান।");
    if (confirm("এই এন্ট্রিটি ডিলিট করতে চান?")) {
      await supabase.from("expenses").delete().eq("id", id);
      fetchAllFinancialData();
    }
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTotal = expenses.filter(ex => {
    const exDate = new Date(ex.date);
    return exDate.getMonth() === currentMonth && exDate.getFullYear() === currentYear;
  }).reduce((acc, curr) => acc + Number(curr.amount), 0);

  const filteredExpenses = expenses.filter(ex => {
    const matchesSearch = ex.item_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || ex.category === filterCategory;
    const matchesDate = !filterDate || ex.date === filterDate;
    return matchesSearch && matchesCategory && matchesDate;
  });

  const cashTotal = filteredExpenses.filter(ex => ex.payment_method === 'Cash').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const creditTotal = filteredExpenses.filter(ex => ex.payment_method === 'Credit').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const dailyTotal = cashTotal + creditTotal;

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 bg-black min-h-screen text-white flex flex-col font-sans overflow-y-auto">
      
      {/* Header Cards: 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 flex-shrink-0">
        <div className="bg-[#0a0a0a] border border-blue-500/10 p-4 md:p-5 rounded-2xl md:rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-2xl relative overflow-hidden group">
          <div className="z-10">
            <p className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">Monthly {currentMonthName}</p>
            <h3 className="text-xl md:text-3xl font-black text-blue-500 tracking-tighter">৳{monthlyTotal.toLocaleString()}</h3>
          </div>
          <BarChart3 className="absolute right-2 bottom-2 md:static text-blue-500/10" size={30} />
        </div>

        <div className="bg-[#0a0a0a] border border-emerald-500/10 p-4 md:p-5 rounded-2xl md:rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden group">
          <div className="z-10">
            <p className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">Daily Paid</p>
            <h3 className="text-xl md:text-3xl font-black text-emerald-500 tracking-tighter">৳{cashTotal.toLocaleString()}</h3>
          </div>
          <Wallet className="absolute right-2 bottom-2 md:static text-emerald-500/10" size={30} />
        </div>

        <div className="bg-[#0a0a0a] border border-red-500/10 p-4 md:p-5 rounded-2xl md:rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden group">
          <div className="z-10">
            <p className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">Daily Due</p>
            <h3 className="text-xl md:text-3xl font-black text-red-500 tracking-tighter">৳{creditTotal.toLocaleString()}</h3>
          </div>
          <TrendingUp className="absolute right-2 bottom-2 md:static text-red-500/10" size={30} />
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 md:p-5 rounded-2xl md:rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-xl">
          <div>
            <p className="text-[8px] md:text-[10px] font-black text-white/60 uppercase tracking-widest mb-1 italic">Total Daily</p>
            <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter">৳{dailyTotal.toLocaleString()}</h3>
          </div>
          <Plus className="hidden md:block text-white/20" size={30} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-10">
        
        {/* Left Side: Form */}
        <div className="xl:col-span-3 bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] h-fit">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-500 italic mb-6 flex items-center gap-2">
             <Plus size={14}/> {editingId ? 'Modify Entry' : 'New Transaction'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold [color-scheme:dark] outline-none focus:border-blue-500" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 text-sm font-black text-blue-400 outline-none">
              {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <textarea value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Description..." className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 text-sm h-24 resize-none focus:border-blue-600 outline-none" required />
            <div className="grid grid-cols-2 gap-3">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="bg-black border border-white/10 rounded-2xl px-2 py-4 text-[10px] font-black text-emerald-500 outline-none uppercase tracking-tighter">
                <option value="Cash">Cash</option><option value="bKash">bKash</option><option value="Bank">Bank</option>
              </select>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="bg-blue-600/5 border border-blue-600/30 text-white rounded-2xl px-4 py-4 text-lg font-black outline-none" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-5 rounded-2xl font-black text-[11px] tracking-widest flex items-center justify-center gap-2 transition-all uppercase shadow-lg shadow-blue-900/20">
              {loading ? <Loader2 className="animate-spin" size={16}/> : editingId ? "Update" : "Post Transaction"} <ChevronRight size={16}/>
            </button>
          </form>
        </div>

        {/* Right Side: Ledger Table */}
        <div className="xl:col-span-9 flex flex-col gap-4">
           <div className="bg-[#0a0a0a] border border-white/5 p-3 rounded-3xl flex flex-wrap gap-3">
              <div className="flex-1 flex items-center bg-black rounded-2xl border border-white/5 px-4 py-2">
                <Search size={16} className="text-gray-600 mr-2" />
                <input type="text" placeholder="Search item..." className="bg-transparent text-sm outline-none w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-black border border-white/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none [color-scheme:dark]" />
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-black border border-white/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-blue-500 outline-none">
                 <option value="All">All Categories</option>
                 {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
           </div>

           <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-[#0c0c0c] border-b border-white/5">
                  <tr className="text-[10px] font-black uppercase text-gray-500 italic tracking-widest">
                    <th className="p-6">Timeline</th>
                    <th className="p-6">Classification</th>
                    <th className="p-6">Detail</th>
                    <th className="p-6 text-right">Value (৳)</th>
                    <th className="p-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredExpenses.map((ex, idx) => (
                    <tr key={idx} className="hover:bg-blue-600/[0.02] group transition-colors">
                      <td className="p-6 text-[11px] text-gray-600 font-bold whitespace-nowrap">{ex.date}</td>
                      <td className="p-6">
                        <span className="text-[9px] font-black px-3 py-1.5 rounded-lg bg-blue-900/10 text-blue-500 border border-blue-900/20 uppercase whitespace-nowrap inline-block tracking-tighter">
                          {ex.category}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-gray-400 group-hover:text-white transition-colors">{ex.item_name}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 w-fit rounded mt-1 italic tracking-widest ${ex.payment_method === 'Credit' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {ex.payment_method}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 text-right font-black text-2xl tracking-tighter">
                        {Number(ex.amount).toLocaleString()}
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-2">
                          {!ex.is_purchase ? (
                            <>
                              <button onClick={() => { setEditingId(ex.id); setItemName(ex.item_name); setAmount(ex.amount); setCategory(ex.category); setDate(ex.date); }} className="p-2 text-blue-500 hover:bg-blue-600/10 rounded-lg">
                                <Edit3 size={16} />
                              </button>
                              <button onClick={() => handleDelete(ex.id, ex.is_purchase)} className="p-2 text-red-500 hover:bg-red-600/10 rounded-lg">
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <AlertCircle size={16} className="opacity-20" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2563eb; }
      `}</style>
    </div>
  );
}