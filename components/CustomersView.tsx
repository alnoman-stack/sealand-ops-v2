'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, Trash2, Loader2, Search, MapPin, Phone, Users, Edit2, Check, X } from 'lucide-react';

export default function CustomersView() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // এডিট মোডের জন্য স্টেট
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', address: '', phone: '' });

  const fetchCustomers = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !phone) return alert("সবগুলো ঘর পূরণ করুন!");
    setIsSubmitting(true);
    const { error } = await supabase.from('customers').insert([{ name, address, phone }]);
    if (error) alert("Error: " + error.message);
    else { setName(''); setAddress(''); setPhone(''); fetchCustomers(); }
    setIsSubmitting(false);
  };

  // এডিট মোড চালু করা
  const startEditing = (customer: any) => {
    setEditingId(customer.id);
    setEditForm({ name: customer.name, address: customer.address, phone: customer.phone });
  };

  // আপডেট সেভ করা
  const handleUpdate = async (id: string) => {
    const { error } = await supabase.from('customers').update(editForm).eq('id', id);
    if (error) alert(error.message);
    else {
      setEditingId(null);
      fetchCustomers();
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm("Are you sure?")) {
      await supabase.from('customers').delete().eq('id', id);
      fetchCustomers();
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="w-full h-screen flex flex-col space-y-6 bg-[#050505] text-white p-6 overflow-hidden">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
          <Users className="text-green-500" /> CUSTOMER DATABASE <span className="text-sm bg-green-500/10 text-green-500 px-3 py-1 rounded-full not-italic tracking-normal">[{filteredCustomers.length}]</span>
        </h2>
        
        <div className="relative group w-full md:w-64">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-green-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-gray-900 rounded-2xl py-3 pl-12 pr-4 text-[11px] font-bold text-white outline-none focus:border-green-900/50 transition-all placeholder:text-gray-700"
          />
        </div>
      </div>

      {/* Input Form Card */}
      <form onSubmit={handleAddCustomer} className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-[2.5rem] shadow-2xl shrink-0 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-gray-900 rounded-xl p-3 text-[12px] text-white outline-none focus:border-green-600/50 transition-colors" placeholder="e.g. Al Noman" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-black border border-gray-900 rounded-xl p-3 text-[12px] text-white outline-none focus:border-green-600/50 transition-colors" placeholder="e.g. Dhanmondi" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Phone Number</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black border border-gray-900 rounded-xl p-3 text-[12px] text-white outline-none focus:border-green-600/50 transition-colors" placeholder="01XXX-XXXXXX" />
        </div>
        <button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-500 text-black font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-green-900/10">
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
          <span className="text-[11px] uppercase tracking-tighter">Register Customer</span>
        </button>
      </form>

      {/* Customer List Container */}
      <div className="flex-1 bg-[#0a0a0a] border border-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col min-h-0">
        <div className="overflow-y-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0d0d0d] z-10 border-b border-gray-900">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase italic tracking-widest">Customer Information</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase italic tracking-widest">Contact Details</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-600 uppercase italic tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/50">
              {isLoading ? (
                <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-gray-800" size={40} /></td></tr>
              ) : filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="px-8 py-4">
                    {editingId === c.id ? (
                      <div className="flex flex-col gap-2">
                        <input 
                          className="bg-black border border-gray-800 p-1 rounded text-sm text-white" 
                          value={editForm.name} 
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        />
                        <input 
                          className="bg-black border border-gray-800 p-1 rounded text-[10px] text-gray-400" 
                          value={editForm.address} 
                          onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="font-bold text-gray-200 uppercase italic group-hover:text-white transition-colors">{c.name}</div>
                        <div className="flex items-center gap-1 text-[9px] text-gray-600 font-bold mt-1 uppercase">
                          <MapPin size={10} /> {c.address}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-8 py-4">
                    {editingId === c.id ? (
                      <input 
                        className="bg-black border border-gray-800 p-1 rounded text-green-500 font-black italic" 
                        value={editForm.phone} 
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-green-500 font-black italic text-lg tracking-tighter">
                        <Phone size={14} className="text-gray-700" /> {c.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === c.id ? (
                        <>
                          <button onClick={() => handleUpdate(c.id)} className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20"><Check size={16}/></button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-gray-500/10 text-gray-500 rounded-lg hover:bg-gray-500/20"><X size={16}/></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(c)} className="p-2 bg-blue-500/5 text-gray-700 hover:text-blue-500 rounded-lg transition-all"><Edit2 size={16}/></button>
                          <button onClick={() => handleDelete(c.id)} className="p-2 bg-red-500/5 text-gray-700 hover:text-red-500 rounded-lg transition-all"><Trash2 size={16}/></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}