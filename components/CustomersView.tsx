'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, Trash2, Loader2, Search, MapPin, Phone, Users, Edit2, Check, X } from 'lucide-react';

export default function CustomersView() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const startEditing = (customer: any) => {
    setEditingId(customer.id);
    setEditForm({ name: customer.name, address: customer.address, phone: customer.phone });
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase.from('customers').update(editForm).eq('id', id);
    if (error) alert(error.message);
    else { setEditingId(null); fetchCustomers(); }
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
    <div className="w-full min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-6">
      
      {/* Header & Search - Stacked on Mobile */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
          <Users className="text-green-500" size={24} /> 
          CUSTOMER DATABASE 
          <span className="text-[10px] bg-green-500/10 text-green-500 px-3 py-1 rounded-full not-italic tracking-normal">
            {filteredCustomers.length}
          </span>
        </h2>
        
        <div className="relative group w-full md:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-green-500" />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-gray-900 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:border-green-600/30 transition-all"
          />
        </div>
      </div>

      {/* Input Form - Mobile Optimized Grid */}
      <form onSubmit={handleAddCustomer} className="bg-[#0a0a0a] border border-gray-900 p-5 md:p-8 rounded-[2rem] shadow-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-gray-900 rounded-xl p-4 text-xs text-white outline-none focus:border-green-600/50" placeholder="Customer Name" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-black border border-gray-900 rounded-xl p-4 text-xs text-white outline-none focus:border-green-600/50" placeholder="Location" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Phone Number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black border border-gray-900 rounded-xl p-4 text-xs text-white outline-none focus:border-green-600/50" placeholder="017..." />
        </div>
        <button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-500 text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg w-full">
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
          <span className="text-[10px] uppercase tracking-widest">Register</span>
        </button>
      </form>

      {/* Customer List - Table on Desktop, Cards on Mobile */}
      <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2rem] overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0d0d0d] border-b border-gray-900">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-gray-600 uppercase italic">Customer Info</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-600 uppercase italic">Contact</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-600 uppercase italic">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/50">
              {isLoading ? (
                <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-gray-800" size={32} /></td></tr>
              ) : filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] group transition-colors">
                  <td className="px-8 py-5">
                    {editingId === c.id ? (
                      <div className="flex flex-col gap-2">
                        <input className="bg-black border border-gray-800 p-2 rounded text-xs" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                        <input className="bg-black border border-gray-800 p-2 rounded text-[10px] text-gray-400" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
                      </div>
                    ) : (
                      <>
                        <div className="font-bold text-gray-200 uppercase italic">{c.name}</div>
                        <div className="flex items-center gap-1 text-[9px] text-gray-600 font-black mt-1 uppercase"><MapPin size={10}/> {c.address}</div>
                      </>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    {editingId === c.id ? (
                      <input className="bg-black border border-gray-800 p-2 rounded text-green-500 font-black italic text-sm" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
                    ) : (
                      <div className="flex items-center gap-2 text-green-500 font-black italic text-lg tracking-tighter"><Phone size={14} className="text-gray-800" /> {c.phone}</div>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-3">
                      {editingId === c.id ? (
                        <>
                          <button onClick={() => handleUpdate(c.id)} className="p-2 bg-green-500/10 text-green-500 rounded-lg"><Check size={18}/></button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-gray-500/10 text-gray-500 rounded-lg"><X size={18}/></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(c)} className="p-2 text-gray-700 hover:text-blue-500 transition-colors"><Edit2 size={18}/></button>
                          <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-700 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden divide-y divide-gray-900/50">
          {isLoading ? (
            <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-gray-800" /></div>
          ) : filteredCustomers.map((c) => (
            <div key={c.id} className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  {editingId === c.id ? (
                    <input className="bg-black border border-gray-800 p-2 rounded text-xs w-full mb-2" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                  ) : (
                    <div className="font-black text-gray-200 uppercase italic tracking-tight">{c.name}</div>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-gray-600 font-black mt-1">
                    <MapPin size={10} /> 
                    {editingId === c.id ? (
                      <input className="bg-black border border-gray-800 p-1 rounded text-[10px]" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
                    ) : c.address}
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingId === c.id ? (
                    <button onClick={() => handleUpdate(c.id)} className="p-2 bg-green-500 text-black rounded-lg"><Check size={16}/></button>
                  ) : (
                    <button onClick={() => startEditing(c)} className="p-2 bg-white/5 text-gray-400 rounded-lg"><Edit2 size={16}/></button>
                  )}
                  <button onClick={() => editingId === c.id ? setEditingId(null) : handleDelete(c.id)} className="p-2 bg-white/5 text-red-500 rounded-lg">
                    {editingId === c.id ? <X size={16}/> : <Trash2 size={16}/>}
                  </button>
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-500 font-black italic text-base tracking-tighter">
                  <Phone size={12} className="text-gray-700" /> 
                  {editingId === c.id ? (
                    <input className="bg-black border border-gray-800 p-1 rounded text-xs w-28" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
                  ) : c.phone}
                </div>
                <a href={`tel:${c.phone}`} className="text-[9px] bg-green-500 text-black px-3 py-1 rounded-full font-black uppercase tracking-widest">Call Now</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}