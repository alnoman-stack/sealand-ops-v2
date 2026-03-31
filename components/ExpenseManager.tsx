import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Trash2, Search, TrendingDown, Truck, Users } from 'lucide-react';

export default function ExpenseManager() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Product Sourcing');
  const [itemName, setItemName] = useState('');
  
  // স্থানীয় সময় (Bangladesh Time) অনুযায়ী YYYY-MM-DD ফরম্যাট করার ফাংশন
  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-CA'); // এটি সরাসরি ডিভাইসের তারিখ অনুযায়ী YYYY-MM-DD দেয়
  };
  
  const [date, setDate] = useState(getTodayDate());
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  const fetchExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (data) setExpenses(data);
  };

  // পেজ লোড হলে এবং রিফ্রেশ দিলে আজকের সঠিক তারিখ সেট হবে
  useEffect(() => { 
    const today = getTodayDate();
    setDate(today);
    fetchExpenses(); 
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setLoading(true);
    const { error } = await supabase.from('expenses').insert([{
      amount: parseFloat(amount),
      category,
      item_name: itemName,
      date: date
    }]);
    
    if (!error) {
      setAmount('');
      setItemName('');
      // ডাটা সেভ হওয়ার পর আবার ডিভাইসের আজকের তারিখে রিসেট হবে
      setDate(getTodayDate()); 
      fetchExpenses();
    }
    setLoading(false);
  };

  const deleteExpense = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (!error) fetchExpenses();
    }
  };

  // অ্যাডভান্স ক্যালকুলেশন (বর্তমান মাস ও বছরের ফিল্টার)
  const totalThisMonth = expenses
    .filter(ex => {
        const d = new Date(ex.date);
        const today = new Date();
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    })
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const sourcingTotal = expenses
    .filter(ex => ex.category === 'Product Sourcing')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const filteredExpenses = expenses.filter(ex => 
    ex.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black italic tracking-tighter text-white">EXPENSE <span className="text-blue-600">HUB</span></h2>
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
           <input 
             type="text" 
             placeholder="Search expenses..." 
             className="bg-black border border-gray-800 text-white pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-blue-600 w-64"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-3xl">
          <div className="flex items-center gap-4 text-gray-500 mb-2 font-bold text-[10px] uppercase tracking-widest">
            <TrendingDown size={14} className="text-red-500" /> This Month Total
          </div>
          <div className="text-2xl font-black text-white">{totalThisMonth.toLocaleString()} <span className="text-xs text-gray-600">TK</span></div>
        </div>
        <div className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-3xl">
          <div className="flex items-center gap-4 text-gray-500 mb-2 font-bold text-[10px] uppercase tracking-widest">
            <Truck size={14} className="text-blue-500" /> Sourcing Total
          </div>
          <div className="text-2xl font-black text-white">{sourcingTotal.toLocaleString()} <span className="text-xs text-gray-600">TK</span></div>
        </div>
        <div className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-3xl">
          <div className="flex items-center gap-4 text-gray-500 mb-2 font-bold text-[10px] uppercase tracking-widest">
            <Users size={14} className="text-green-500" /> Transactions
          </div>
          <div className="text-2xl font-black text-white">{expenses.length} <span className="text-xs text-gray-600">Records</span></div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Date</label>
          <div className="relative cursor-pointer" onClick={() => dateInputRef.current?.showPicker()}>
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              ref={dateInputRef} 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full bg-black border border-gray-800 text-white pl-12 pr-4 py-3 rounded-2xl text-sm [color-scheme:dark] outline-none focus:border-blue-600 transition-all cursor-pointer font-bold" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black border border-gray-800 text-white px-4 py-3 rounded-2xl text-sm outline-none focus:border-blue-600 appearance-none cursor-pointer font-bold">
            <option>Product Sourcing</option>
            <option>Transportation</option>
            <option>Labor Cost</option>
            <option>Office Expense</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Item/Note</label>
          <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. 50kg Capsicum" className="w-full bg-black border border-gray-800 text-white px-4 py-3 rounded-2xl text-sm outline-none focus:border-blue-600 font-bold" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Amount (TK)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-black border border-gray-800 text-white px-4 py-3 rounded-2xl text-sm outline-none focus:border-blue-600 font-bold" required />
        </div>

        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all h-[46px]">
          {loading ? 'SAVE...' : 'ADD RECORD'}
        </button>
      </form>

      {/* Table */}
      <div className="bg-[#0a0a0a] border border-gray-900 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-black border-b border-gray-900">
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">Date</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">Category</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">Item Name</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Amount</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900">
            {filteredExpenses.map((ex) => (
              <tr key={ex.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="p-6 text-sm text-gray-400 font-bold italic">
                    {new Date(ex.date).toLocaleDateString('en-GB')}
                </td>
                <td className="p-6 text-xs font-bold text-blue-500 uppercase tracking-widest">{ex.category}</td>
                <td className="p-6 text-sm text-gray-300 font-medium">{ex.item_name}</td>
                <td className="p-6 text-right font-black text-white">{Number(ex.amount).toLocaleString()} TK</td>
                <td className="p-6 text-center">
                  <button onClick={() => deleteExpense(ex.id)} className="text-gray-700 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}