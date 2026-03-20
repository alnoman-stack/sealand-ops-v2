'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, Trash2, Loader2 } from 'lucide-react';

export default function CustomersView() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ডাটাবেজ থেকে কাস্টমার লিস্ট লোড করা
  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
  };

  useEffect(() => { fetchCustomers(); }, []);

  // ডাটা সেভ করার ফাংশন
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!name || !address || !phone) return alert("সবগুলো ঘর পূরণ করুন!");

    setIsSubmitting(true);
    const { error } = await supabase.from('customers').insert([{ name, address, phone }]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setName(''); setAddress(''); setPhone(''); // ইনপুট ক্লিয়ার করা
      fetchCustomers(); // লিস্ট রিফ্রেশ করা
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 p-4">
      {/* ইনপুট ফর্ম */}
      <form onSubmit={handleAddCustomer} className="bg-[#0a0a0a] border border-gray-800 p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl p-3 text-white outline-none focus:border-green-500" placeholder="Al Noman" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl p-3 text-white outline-none focus:border-green-500" placeholder="Mohammadpur" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Phone</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl p-3 text-white outline-none focus:border-green-500" placeholder="01611848597" />
        </div>
        <button type="submit" disabled={isSubmitting} className="bg-green-500 hover:bg-green-600 text-black font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2">
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
          ADD CUSTOMER
        </button>
      </form>

      {/* কাস্টমার টেবিল */}
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-[2rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-[#111] text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-8 py-5">Name</th>
              <th className="px-8 py-5">Address</th>
              <th className="px-8 py-5">Phone</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6 font-bold text-white">{c.name}</td>
                <td className="px-8 py-6 text-gray-400">{c.address}</td>
                <td className="px-8 py-6 text-green-500 font-mono text-sm">{c.phone}</td>
                <td className="px-8 py-6 text-right">
                  <button onClick={async () => { await supabase.from('customers').delete().eq('id', c.id); fetchCustomers(); }} className="text-gray-600 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
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