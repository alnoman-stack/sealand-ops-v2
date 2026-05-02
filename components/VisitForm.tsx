'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  MapPin, Plus, List, Clock, Calendar, Search, Phone,
  LayoutDashboard, UserPlus, RefreshCcw, 
  Bell, Users, Target, CheckCircle, Trash2, Edit3, UserCheck, X, Download
} from 'lucide-react';

// এই অংশটুকু যোগ করুন
interface VisitFormProps {
  onSuccess?: () => void;
}

export default function VisitForm({ onSuccess }: VisitFormProps) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [visitHistory, setVisitHistory] = useState<any[]>([]); 
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showNotification, setShowNotification] = useState(false);
  const [showPartnerSearch, setShowPartnerSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isQuickAdd, setIsQuickAdd] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const notificationRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    visit_type: 'Routine Check',
    status: 'Follow-up Needed',
    notes: '',
    location_name: '', 
    next_follow_up: '',
    assigned_to: 'Noman'
  });

  const todayStr = new Date().toISOString().split('T')[0];
  
  const stats = {
    totalVisits: visitHistory.length,
    newLeads: visitHistory.filter(v => v.visit_type === 'New Lead').length,
    followUpsToday: visitHistory.filter(v => v.next_follow_up === todayStr).length,
    todayReminders: visitHistory.filter(v => v.next_follow_up === todayStr)
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const { data: custData } = await supabase.from('customers').select('id, name').order('name');
      if (custData) setCustomers(custData);
      
      const startOfDay = `${filterDate}T00:00:00.000Z`;
      const endOfDay = `${filterDate}T23:59:59.999Z`;

      const { data: visitData, error } = await supabase
        .from('visit_logs')
        .select(`*, customers ( name, phone )`)
        .gte('visit_date', startOfDay)
        .lte('visit_date', endOfDay)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (visitData) setVisitHistory(visitData);
    } catch (err) {
      console.error("Data Fetch Error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterDate]);

  // ফিক্স: filteredPartners কে আগে ডিফাইন করা হয়েছে যাতে নিচের ফাংশন এটি খুঁজে পায়
  const filteredPartners = visitHistory.filter(v => 
    v.temp_customer_name && v.temp_customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadAllFilteredData = () => {
    if (filteredPartners.length === 0) return alert("No data to download!");
    
    const headers = "Name,Phone,Address,Assigned To\n";
    const rows = filteredPartners.map(p => 
      `"${p.temp_customer_name}","${p.mobile_number || 'N/A'}","${p.location_name}","${p.assigned_to}"`
    ).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SeaLand_Partner_Data_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this log?")) return;
    try {
      await supabase.from('visit_logs').delete().eq('id', id);
      fetchData();
    } catch (err) { alert("Error deleting log"); }
  };

  const handleEdit = (log: any) => {
    setEditingId(log.id);
    setSelectedCustomerId(log.customer_id || '');
    if (!log.customer_id) {
       setIsQuickAdd(true);
       setNewCustomer({ 
         name: log.temp_customer_name || '', 
         phone: log.mobile_number || '', 
         address: log.location_name || '' 
       });
    } else {
       setIsQuickAdd(false);
    }
    setFormData({
      visit_type: log.visit_type,
      status: log.status,
      notes: log.notes,
      location_name: log.location_name,
      next_follow_up: log.next_follow_up || '',
      assigned_to: log.assigned_to
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const promoteToCustomer = async (log: any) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ 
          name: log.temp_customer_name, 
          phone: log.mobile_number || 'N/A',
          address: log.location_name 
        }])
        .select().single();
      
      if (error) throw error;
      await supabase.from('visit_logs').update({ customer_id: data.id, temp_customer_name: null }).eq('id', log.id);
      alert("Partner added to official customer list!");
      fetchData();
    } catch (err) { alert("Error adding customer"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isQuickAdd && (!newCustomer.phone || !newCustomer.address)) {
      alert("Please provide Partner Mobile Number and Address");
      return;
    }

    setLoading(true);
    try {
      const visitPayload: any = { 
        visit_type: formData.visit_type,
        status: formData.status,
        notes: formData.notes,
        location_name: isQuickAdd ? newCustomer.address : formData.location_name, 
        next_follow_up: formData.next_follow_up || null,
        assigned_to: formData.assigned_to,
        visit_date: editingId ? undefined : new Date().toISOString(),
        mobile_number: isQuickAdd ? newCustomer.phone : null 
      };

      if (isQuickAdd) {
        visitPayload.temp_customer_name = newCustomer.name;
        visitPayload.customer_id = null;
      } else {
        visitPayload.customer_id = selectedCustomerId;
        visitPayload.temp_customer_name = null;
      }

      const { error } = editingId 
        ? await supabase.from('visit_logs').update(visitPayload).eq('id', editingId)
        : await supabase.from('visit_logs').insert([visitPayload]);
      
      if (error) throw error;
      setFormData({ visit_type: 'Routine Check', status: 'Follow-up Needed', notes: '', location_name: '', next_follow_up: '', assigned_to: 'Noman' });
      setSelectedCustomerId('');
      setNewCustomer({ name: '', phone: '', address: '' });
      setEditingId(null);
      setIsQuickAdd(false);
      fetchData();
      alert("Success!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:fixed lg:inset-0 lg:ml-64 bg-[#050505] text-white flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden font-sans">
      
      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col border-r border-white/5 order-2 lg:order-1">
        <div className="p-4 lg:p-8 bg-black/40 backdrop-blur-xl border-b border-white/5 space-y-6 lg:space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-600/20">
                <LayoutDashboard size={24} className="text-black" />
              </div>
              <div>
                <h1 className="text-xl lg:text-3xl font-black uppercase italic tracking-tighter leading-none">SeaLand OPS</h1>
                <p className="text-[8px] lg:text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mt-2">Team & Market Tracker</p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 w-full md:w-auto justify-between">
               <div className="relative" ref={notificationRef}>
  <button 
    onClick={() => setShowNotification(!showNotification)}
    className={`relative p-2.5 lg:p-3 rounded-xl bg-[#1a1a1a] border transition-all duration-300 ${
      showNotification ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'border-white/10 hover:border-orange-500/50'
    }`}
  >
    <Bell size={20} className={stats.followUpsToday > 0 ? "text-orange-500 animate-pulse" : "text-gray-400"} />
    
    {stats.followUpsToday > 0 && (
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg border-2 border-[#0d0d0d]">
        {stats.followUpsToday}
      </span>
    )}
  </button>
  
  {showNotification && (
    <div className="
      fixed inset-x-4 top-[70px] mx-auto w-auto max-w-[calc(100%-32px)] 
      lg:absolute lg:inset-auto lg:right-0 lg:top-full lg:mt-3 lg:w-80 lg:max-w-none
      bg-[#121212] border border-orange-500/30 rounded-2xl p-0 
      z-[9999] shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl
    ">
       <div className="flex justify-between items-center p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-ping"></div>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[2px]">Today's Reminders</p>
          </div>
          <span className="bg-orange-600/10 text-orange-500 text-[9px] px-2 py-0.5 rounded-md font-bold border border-orange-500/20">
            {stats.followUpsToday} New
          </span>
       </div>

       <div className="p-2 space-y-2 max-h-[60vh] lg:max-h-[400px] overflow-y-auto custom-scrollbar">
         {stats.todayReminders.length > 0 ? (
           stats.todayReminders.map(rem => (
             <div key={rem.id} className="group p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-orange-500/30 transition-all duration-200">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-[11px] text-gray-100 group-hover:text-orange-400 transition-colors">
                    {rem.customers?.name || rem.temp_customer_name}
                  </p>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-bold border border-orange-500/20 uppercase tracking-tighter">
                    {rem.visit_type}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-500 text-[9px]">
                  <div className="p-1 rounded bg-white/5 text-orange-500/70">
                    <MapPin size={10} />
                  </div>
                  <span className="truncate">{rem.location_name || 'Dhaka, Bangladesh'}</span>
                </div>

                {rem.notes && (
                  <div className="mt-2 text-[10px] text-gray-400 italic leading-relaxed bg-black/20 p-2 rounded-lg border-l-2 border-orange-500/50">
                    {rem.notes}
                  </div>
                )}
             </div>
           ))
         ) : (
           <div className="text-center py-12">
             <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-700">
               <Bell size={24} />
             </div>
             <p className="text-[11px] text-gray-500">সব ক্লিয়ার! আজকের কোনো ফলো-আপ নেই।</p>
           </div>
         )}
       </div>

       <div className="p-3 bg-white/[0.02] rounded-b-2xl border-t border-white/5 text-center">
          <button className="text-[9px] text-orange-500/70 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors">
              View All Activities
          </button>
       </div>
    </div>
  )}
</div>

               <button onClick={fetchData} className="p-2 lg:p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/50 transition-all">
                  <RefreshCcw size={16} className={refreshing ? 'animate-spin' : 'text-gray-400'} />
               </button>
               <div className="flex items-center gap-2 bg-white/5 p-2 lg:p-3 rounded-2xl border border-white/10">
                  <Calendar size={14} className="text-orange-600" />
                  <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-transparent text-[10px] font-black text-gray-300 outline-none w-24 lg:w-auto cursor-pointer" />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-white/5 p-4 lg:p-5 rounded-3xl border border-white/10 hover:bg-white/[0.07] transition-all">
               <p className="text-[8px] font-black uppercase text-gray-500">Total Visits</p>
               <h2 className="text-xl lg:text-2xl font-black">{stats.totalVisits}</h2>
            </div>
            <div className="bg-orange-600/5 p-4 lg:p-5 rounded-3xl border border-orange-600/10 hover:bg-orange-600/10 transition-all">
               <p className="text-[8px] font-black uppercase text-orange-500">New Leads</p>
               <h2 className="text-xl lg:text-2xl font-black">{stats.newLeads}</h2>
            </div>
            <div className="bg-green-600/5 p-4 lg:p-5 rounded-3xl border border-green-600/10">
               <p className="text-[8px] font-black uppercase text-green-500">Daily Followup</p>
               <h2 className="text-xl lg:text-2xl font-black">{stats.followUpsToday}</h2>
            </div>
            <button onClick={() => setShowPartnerSearch(true)} className="bg-white/5 p-4 lg:p-5 rounded-3xl border border-white/10 hover:border-orange-600 group transition-all text-left">
               <p className="text-[8px] font-black uppercase text-gray-400 group-hover:text-orange-500">Directory</p>
               <h2 className="text-xl lg:text-2xl font-black group-hover:translate-x-1 transition-transform">FIND →</h2>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 scrollbar-hide">
          {visitHistory.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
              {visitHistory.map((log) => (
                <div key={log.id} className={`bg-[#0d0d0d] border rounded-[2rem] p-6 lg:p-8 hover:border-orange-600/30 transition-all group relative overflow-hidden ${log.next_follow_up === todayStr ? 'border-orange-600/40 bg-orange-600/[0.02]' : 'border-white/5'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-orange-500 uppercase">
                          {(log.customers?.name || log.temp_customer_name || 'P').charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-xs lg:text-sm uppercase group-hover:text-orange-500 transition-colors">
                            {log.customers?.name || log.temp_customer_name}
                          </h4>
                          <div className="flex flex-col gap-1 mt-1">
                             <p className="text-[9px] lg:text-[10px] text-gray-500 flex items-center gap-1 uppercase italic">
                               <MapPin size={10} className="text-blue-500" /> {log.location_name}
                             </p>
                             <p className="text-[9px] lg:text-[10px] text-orange-500/70 flex items-center gap-1 font-bold">
                               <Phone size={10} /> {log.customers?.phone || log.mobile_number || 'No Number'}
                             </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => handleEdit(log)} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><Edit3 size={12}/></button>
                         <button onClick={() => handleDelete(log.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12}/></button>
                      </div>
                    </div>
                    <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.03]">
                      <p className="text-[11px] lg:text-xs text-gray-400 italic">"{log.notes}"</p>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                       <div className="flex flex-col gap-2">
                         <span className="text-[8px] font-black text-orange-600 uppercase">By: {log.assigned_to}</span>
                         {log.temp_customer_name && (
                           <button onClick={() => promoteToCustomer(log)} className="text-[8px] bg-orange-600/20 text-orange-500 px-2 py-1 rounded-md font-black hover:bg-orange-600 hover:text-black transition-all">
                             <UserCheck size={10} className="inline mr-1"/> ADD TO CLIENT
                           </button>
                         )}
                       </div>
                       <div className="flex flex-col items-end gap-1">
                         <span className="text-[8px] font-black px-2 py-1 rounded-lg border uppercase bg-orange-600/10 text-orange-500 border-orange-600/20">
                           {log.status}
                         </span>
                         {log.next_follow_up && <span className="text-[8px] font-black text-blue-400">NEXT: {log.next_follow_up}</span>}
                       </div>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center opacity-10">
              <List size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest mt-4">No logs found</p>
            </div>
          )}
        </div>
      </div>

      {/* Entry Panel */}
      <div className="w-full lg:w-[400px] xl:w-[450px] bg-black p-6 lg:p-10 border-l border-white/5 order-1 lg:order-2">
        <div className="mb-8 flex justify-between items-center">
          <h3 className="text-xl lg:text-2xl font-black uppercase italic text-orange-600">
            {editingId ? 'Edit Visit' : (isQuickAdd ? 'New Partner' : 'Visit Entry')}
          </h3>
          <button type="button" onClick={() => {setIsQuickAdd(!isQuickAdd); setEditingId(null);}} className={`p-2 lg:p-3 rounded-xl border transition-all ${isQuickAdd ? 'bg-orange-600 text-black border-orange-600' : 'border-white/10 hover:border-orange-600/50'}`}>
            <Plus size={20} className={isQuickAdd ? 'rotate-45' : ''} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
          {!isQuickAdd ? (
            <select required value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full bg-[#0d0d0d] border border-white/10 p-4 lg:p-5 rounded-2xl text-sm outline-none focus:border-orange-600 appearance-none">
                <option value="">-- Choose Partner --</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : (
            <div className="space-y-3 bg-orange-600/5 p-4 lg:p-6 rounded-3xl border border-orange-600/10">
              <input required type="text" placeholder="Partner Name" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-orange-600" />
              <input required type="tel" placeholder="Mobile Number" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-orange-600" />
              <input required type="text" placeholder="Partner Address" value={newCustomer.address} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-orange-600" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <select value={formData.assigned_to} onChange={(e) => setFormData({...formData, assigned_to: e.target.value})} className="bg-[#0d0d0d] border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-orange-600">
                <option value="Noman">Noman</option>
                <option value="Shafin">Shafin</option>
                <option value="Rabbi">Rabbi</option>
            </select>
            <select value={formData.visit_type} onChange={(e) => setFormData({...formData, visit_type: e.target.value})} className="bg-[#0d0d0d] border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-orange-600">
                <option>Routine Check</option>
                <option>New Lead</option>
                <option>Order Collection</option>
            </select>
          </div>

          <input type="text" placeholder="Visit Location" value={formData.location_name} onChange={(e) => setFormData({...formData, location_name: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-orange-600" />
          <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="What was discussed?" className="w-full bg-[#0d0d0d] border border-white/10 p-4 rounded-2xl text-sm resize-none outline-none focus:border-orange-600" />
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-gray-500 uppercase ml-2">Next Follow-up Date</p>
            <input type="date" value={formData.next_follow_up} onChange={(e) => setFormData({...formData, next_follow_up: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-orange-600" />
          </div>

          <button disabled={loading} className="w-full py-4 lg:py-6 bg-orange-600 text-black font-black rounded-full uppercase text-[10px] lg:text-xs tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
            {loading ? 'SAVING...' : (editingId ? 'UPDATE LOG' : 'CONFIRM VISIT LOG')}
          </button>
        </form>
      </div>

      {/* Directory Modal */}
      {showPartnerSearch && (
        <div className="fixed inset-0 z-[101] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <button onClick={() => setShowPartnerSearch(false)} className="absolute top-6 right-6 lg:top-8 lg:right-8 text-gray-500 hover:text-white transition-colors"><X size={24}/></button>
            
            <div className="mb-6 lg:mb-8 pr-12">
              <h2 className="text-2xl lg:text-3xl font-black uppercase italic text-orange-600 leading-tight">Partner Directory</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Manage & Bulk Download Entries</p>
            </div>
            
            <div className="relative mb-6 lg:mb-8">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 p-1.5 bg-orange-600/10 rounded-lg">
                <Search className="text-orange-600" size={18}/>
              </div>
              <input 
                autoFocus 
                type="text" 
                placeholder="    Search by partner name..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full bg-black border border-white/10 p-5 lg:p-6 pl-16 rounded-2xl text-md lg:text-lg outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600/20 transition-all placeholder:text-gray-700" 
              />
              
              {filteredPartners.length > 0 && (
                <button 
                  onClick={downloadAllFilteredData}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-500 text-black px-4 py-2 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase transition-all shadow-lg shadow-orange-600/10"
                >
                  <Download size={14}/>
                  <span className="hidden sm:inline">Export All</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-orange-600/20">
              {filteredPartners.length > 0 ? (
                filteredPartners.map(p => (
                  <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 lg:p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-all gap-4">
                    <div>
                      <h4 className="font-black uppercase text-sm text-gray-200">{p.temp_customer_name}</h4>
                      <div className="flex flex-col gap-1 mt-1.5">
                        <p className="text-[9px] lg:text-[10px] text-gray-500 flex items-center gap-2 italic"><MapPin size={10} className="text-blue-500/50"/> {p.location_name}</p>
                        <p className="text-[9px] lg:text-[10px] text-orange-500/70 flex items-center gap-2 font-bold"><Phone size={10}/> {p.mobile_number || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => {promoteToCustomer(p); setShowPartnerSearch(false);}}
                        className="flex-1 sm:flex-none px-5 py-3 bg-orange-600 text-black rounded-xl font-black text-[10px] uppercase hover:scale-105 active:scale-95 transition-all"
                      >
                        Verify Partner
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">No matching partners found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}