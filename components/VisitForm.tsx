'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  MapPin, Plus, List, Clock, Calendar, Search, Phone,
  LayoutDashboard, UserPlus, RefreshCcw, 
  Bell, Users, Target, CheckCircle, Trash2, Edit3, UserCheck, X, Download, AlertCircle, Database
} from 'lucide-react';

interface VisitFormProps {
  onSuccess?: () => void;
}

export default function VisitForm({ onSuccess }: VisitFormProps) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [visitHistory, setVisitHistory] = useState<any[]>([]); 
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'archive' | 'existing'>('all');
  
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
    assigned_to: 'Noman',
    customer_issue: '', 
    resolution_status: 'Pending' 
  });

  const todayStr = new Date().toISOString().split('T')[0];
  
  // সব পার্মানেন্ট লিড বা কাস্টমার যারা এন্ট্রি হয়েছে (ভেরিফাই হওয়া বা না হওয়া সব)
  const allPermanentLeads = visitHistory.filter(v => v.temp_customer_name || v.mobile_number);

  const stats = {
    totalVisits: visitHistory.length,
    newLeads: allPermanentLeads.length,
    existingIssues: visitHistory.filter(v => v.customer_id && v.customer_issue).length,
    followUpsToday: visitHistory.filter(v => v.next_follow_up === todayStr).length,
    todayReminders: visitHistory.filter(v => v.next_follow_up === todayStr)
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const { data: custData } = await supabase.from('customers').select('id, name').order('name');
      if (custData) setCustomers(custData);

      const { data: visitData, error } = await supabase
        .from('visit_logs')
        .select(`*, customers ( name, phone )`)
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

  const displayedVisits = visitHistory.filter(v => {
    const targetName = v.customers?.name || v.temp_customer_name || '';
    const matchesSearch = targetName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (v.customer_issue && v.customer_issue.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === 'new') {
      const isToday = v.visit_date?.startsWith(filterDate);
      return matchesSearch && v.temp_customer_name && isToday;
    } else if (activeTab === 'archive') {
      // আর্কাইভ ট্যাবে ভেরিফাই হওয়া ও নতুন সব লিড একসাথে চিরতরে শো করবে
      return matchesSearch && (v.temp_customer_name || v.mobile_number);
    } else if (activeTab === 'existing') {
      return matchesSearch && v.customer_id;
    }
    return matchesSearch;
  });

  const filteredPartners = visitHistory.filter(v => 
    (v.temp_customer_name || v.customers?.name) && 
    (v.temp_customer_name || v.customers?.name).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadAllFilteredData = () => {
    if (filteredPartners.length === 0) return alert("No data to download!");
    
    const headers = "Name,Phone,Address,Assigned To,Date\n";
    const rows = filteredPartners.map(p => 
      `"${p.temp_customer_name || p.customers?.name || 'N/A'}","${p.mobile_number || p.customers?.phone || 'N/A'}","${p.location_name || 'N/A'}","${p.assigned_to || 'N/A'}","${p.visit_date?.split('T')[0] || 'N/A'}"`
    ).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SeaLand_Master_Customer_Database_${todayStr}.csv`);
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
      visit_type: log.visit_type || 'Routine Check',
      status: log.status || 'Follow-up Needed',
      notes: log.notes || '',
      location_name: log.location_name || '',
      next_follow_up: log.next_follow_up || '',
      assigned_to: log.assigned_to || 'Noman',
      customer_issue: log.customer_issue || '',
      resolution_status: log.resolution_status || 'Pending'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ভেরিফাই করলে কাস্টমার টেবিলে এন্ট্রি হবে, কিন্তু লগ থেকে রিমুভ না হয়ে স্ট্যাটাস 'Verified' হয়ে আর্কাইভে থেকে যাবে
  const promoteToCustomer = async (log: any) => {
    try {
      const customerName = log.temp_customer_name || log.customers?.name;
      const customerPhone = log.mobile_number || log.customers?.phone || 'N/A';
      const customerAddress = log.location_name || 'N/A';

      const { data, error } = await supabase
        .from('customers')
        .insert([{ 
          name: customerName, 
          phone: customerPhone,
          address: customerAddress 
        }])
        .select().single();
      
      if (error) throw error;
      
      await supabase.from('visit_logs').update({ 
        customer_id: data.id, 
        status: 'Verified' 
      }).eq('id', log.id);

      alert("Partner successfully verified and added to official client list!");
      fetchData();
    } catch (err: any) { alert("Error adding customer: " + err.message); }
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
        mobile_number: isQuickAdd ? newCustomer.phone : null,
        customer_issue: !isQuickAdd ? formData.customer_issue : null,
        resolution_status: !isQuickAdd ? formData.resolution_status : null
      };

      if (isQuickAdd) {
        visitPayload.temp_customer_name = newCustomer.name;
        visitPayload.customer_id = null;
        visitPayload.customer_issue = null;
        visitPayload.resolution_status = null;
      } else {
        visitPayload.customer_id = selectedCustomerId;
      }

      const { error } = editingId 
        ? await supabase.from('visit_logs').update(visitPayload).eq('id', editingId)
        : await supabase.from('visit_logs').insert([visitPayload]);
      
      if (error) throw error;
      setFormData({ 
        visit_type: 'Routine Check', 
        status: 'Follow-up Needed', 
        notes: '', 
        location_name: '', 
        next_follow_up: '', 
        assigned_to: 'Noman',
        customer_issue: '',
        resolution_status: 'Pending'
      });
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
    </div>
  )}
</div>

               <button onClick={fetchData} className="p-2 lg:p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/50 transition-all">
                  <RefreshCcw size={16} className={refreshing ? 'animate-spin' : 'text-gray-400'} />
               </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-white/5 p-4 lg:p-5 rounded-3xl border border-white/10 hover:bg-white/[0.07] transition-all">
               <p className="text-[8px] font-black uppercase text-gray-500">Total Logs</p>
               <h2 className="text-xl lg:text-2xl font-black">{stats.totalVisits}</h2>
            </div>
            <div className="bg-orange-600/5 p-4 lg:p-5 rounded-3xl border border-orange-600/10 hover:bg-orange-600/10 transition-all">
               <p className="text-[8px] font-black uppercase text-orange-500">All Leads Archive</p>
               <h2 className="text-xl lg:text-2xl font-black">{stats.newLeads}</h2>
            </div>
            <div className="bg-blue-600/5 p-4 lg:p-5 rounded-3xl border border-blue-600/10">
               <p className="text-[8px] font-black uppercase text-blue-500">Customer Issues</p>
               <h2 className="text-xl lg:text-2xl font-black">{stats.existingIssues}</h2>
            </div>
            <button onClick={() => setShowPartnerSearch(true)} className="bg-white/5 p-4 lg:p-5 rounded-3xl border border-white/10 hover:border-orange-600 group transition-all text-left">
               <p className="text-[8px] font-black uppercase text-gray-400 group-hover:text-orange-500">Directory</p>
               <h2 className="text-xl lg:text-2xl font-black group-hover:translate-x-1 transition-transform">FIND →</h2>
            </button>
          </div>

          {/* ট্যাব সুইচিং বার */}
          <div className="flex items-center gap-3 border-b border-white/10 pb-4 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'all' 
                  ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/20' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              All Activities ({visitHistory.length})
            </button>
            <button 
              onClick={() => setActiveTab('archive')}
              className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'archive' 
                  ? 'bg-green-600 text-black shadow-lg shadow-green-600/20' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Database size={14}/>
              <span>📂 নতুন কাস্টমার স্থায়ী ডাটাবেজ (All-time Leads)</span>
              <span className="bg-black/20 px-2 py-0.5 rounded-full text-[9px]">
                {allPermanentLeads.length}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('existing')}
              className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'existing' 
                  ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/20' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>🔵 পুরাতন কাস্টমার সমস্যা ও সমাধান (Existing)</span>
            </button>
          </div>
        </div>

        {/* টেবিল লিস্ট ফরম্যাট */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {displayedVisits.length > 0 ? (
            <div className="w-full overflow-x-auto border border-white/10 rounded-2xl bg-[#0d0d0d] shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    <th className="p-4">Customer / Partner Name</th>
                    <th className="p-4">Mobile Number</th>
                    <th className="p-4">Location / Address</th>
                    <th className="p-4">Assigned Staff</th>
                    <th className="p-4">Status / Issue</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {displayedVisits.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-4 font-bold uppercase text-white flex items-center gap-2">
                        {log.customers?.name || log.temp_customer_name || 'N/A'}
                        {log.customer_id ? (
                          <span className="text-[7px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/25">VERIFIED CLIENT</span>
                        ) : (
                          <span className="text-[7px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/25">LEAD</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-orange-400">
                        {log.customers?.phone || log.mobile_number || 'N/A'}
                      </td>
                      <td className="p-4 text-gray-300 italic">
                        {log.location_name || 'N/A'}
                      </td>
                      <td className="p-4 font-bold text-gray-400 uppercase">
                        {log.assigned_to || 'Noman'}
                      </td>
                      <td className="p-4">
                        {log.customer_issue ? (
                          <span className="text-[10px] text-blue-400 font-medium">
                            Issue: {log.customer_issue} ({log.resolution_status || 'Pending'})
                          </span>
                        ) : (
                          <span className={`text-[10px] px-2.5 py-1 rounded-md uppercase font-bold border ${
                            log.customer_id ? 'bg-blue-600/10 text-blue-400 border-blue-600/20' : 'bg-orange-600/10 text-orange-500 border-orange-600/20'
                          }`}>
                            {log.customer_id ? 'Verified' : (log.status || 'Active')}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        {/* ভেরিফাই না করা থাকলে Verify বাটন দেখাবে, ভেরিফাই হয়ে গেলেও ডেটা লিস্টে শো করবে */}
                        {!log.customer_id && (
                          <button 
                            onClick={() => promoteToCustomer(log)} 
                            title="Verify and Add to Client"
                            className="px-2.5 py-1 bg-orange-600/20 text-orange-400 rounded-lg font-bold text-[9px] hover:bg-orange-600 hover:text-black transition-all"
                          >
                            <UserCheck size={12} className="inline mr-1"/> Verify
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(log)} 
                          className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all inline-block"
                        >
                          <Edit3 size={14}/>
                        </button>
                        <button 
                          onClick={() => handleDelete(log.id)} 
                          className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all inline-block"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center opacity-20">
              <List size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest mt-4">No records found in this view</p>
            </div>
          )}
        </div>
      </div>

      {/* Entry Panel */}
      <div className="w-full lg:w-[400px] xl:w-[450px] bg-black p-6 lg:p-10 border-l border-white/5 order-1 lg:order-2">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl lg:text-2xl font-black uppercase italic text-orange-600">
              {editingId ? 'Edit Log' : (isQuickAdd ? '🟢 New Customer' : '🔵 Existing Issue')}
            </h3>
          </div>
          <button 
            type="button" 
            onClick={() => {
              setIsQuickAdd(!isQuickAdd); 
              setEditingId(null);
            }} 
            className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
              isQuickAdd ? 'bg-green-600 text-black border-green-600' : 'bg-blue-600/20 text-blue-400 border-blue-500/30'
            }`}
          >
            {isQuickAdd ? 'Switch to Existing' : '+ Add New Customer'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isQuickAdd ? (
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase ml-1 mb-1 block">Select Existing Customer</label>
                <select 
                  required 
                  value={selectedCustomerId} 
                  onChange={(e) => setSelectedCustomerId(e.target.value)} 
                  className="w-full bg-[#0d0d0d] border border-white/10 p-3.5 rounded-xl text-xs outline-none focus:border-orange-600"
                >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="bg-blue-600/5 p-3.5 rounded-2xl border border-blue-500/20 space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-blue-400 uppercase ml-1 mb-1 block">Customer Issue / Problem Description</label>
                  <textarea 
                    rows={2} 
                    placeholder="কাস্টমারের সমস্যা এখানে লিখুন..." 
                    value={formData.customer_issue || ''} 
                    onChange={(e) => setFormData({...formData, customer_issue: e.target.value})} 
                    className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs resize-none outline-none focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-blue-400 uppercase ml-1 mb-1 block">Resolution Status</label>
                  <select 
                    value={formData.resolution_status || 'Pending'} 
                    onChange={(e) => setFormData({...formData, resolution_status: e.target.value})} 
                    className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-blue-500"
                  >
                    <option value="Pending">🔴 Pending (অমীমাংসিত)</option>
                    <option value="In Progress">🟡 In Progress (চলমান)</option>
                    <option value="Resolved">🟢 Resolved (সমাধানকৃত)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-green-600/5 p-4 rounded-2xl border border-green-600/20">
              <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">New Customer Quick Registration</p>
              <input required type="text" placeholder="Customer / Partner Name" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-green-500" />
              <input required type="tel" placeholder="Mobile Number" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-green-500" />
              <input required type="text" placeholder="Address / Location" value={newCustomer.address} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-green-500" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-bold text-gray-400 uppercase ml-1 mb-1 block">Assigned Staff</label>
              <select value={formData.assigned_to || 'Noman'} onChange={(e) => setFormData({...formData, assigned_to: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600">
                  <option value="Noman">Noman</option>
                  <option value="Shafin">Shafin</option>
                  <option value="Rabbi">Rabbi</option>
              </select>
            </div>
            <div>
              <label className="text-[8px] font-bold text-gray-400 uppercase ml-1 mb-1 block">Visit Type</label>
              <select value={formData.visit_type || 'Routine Check'} onChange={(e) => setFormData({...formData, visit_type: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600">
                  <option>Routine Check</option>
                  <option>New Lead</option>
                  <option>Order Collection</option>
                  <option>Issue Resolution</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[8px] font-bold text-gray-400 uppercase ml-1 mb-1 block">Location</label>
            <input type="text" placeholder="Visit Location" value={formData.location_name || ''} onChange={(e) => setFormData({...formData, location_name: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600" />
          </div>

          <div>
            <label className="text-[8px] font-bold text-gray-400 uppercase ml-1 mb-1 block">General Discussion Notes</label>
            <textarea rows={2} value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="What was discussed overall?" className="w-full bg-[#0d0d0d] border border-white/10 p-3 rounded-xl text-xs resize-none outline-none focus:border-orange-600" />
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-bold text-gray-400 uppercase ml-1 block">Next Follow-up Date</label>
            <input type="date" value={formData.next_follow_up || ''} onChange={(e) => setFormData({...formData, next_follow_up: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-orange-600" />
          </div>

          <button disabled={loading} className="w-full py-3.5 lg:py-5 bg-orange-600 text-black font-black rounded-xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 mt-2">
            {loading ? 'SAVING...' : (editingId ? 'UPDATE RECORD' : 'SAVE VISIT RECORD')}
          </button>
        </form>
      </div>

      {/* Directory Modal */}
      {showPartnerSearch && (
        <div className="fixed inset-0 z-[101] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <button onClick={() => setShowPartnerSearch(false)} className="absolute top-6 right-6 lg:top-8 lg:right-8 text-gray-500 hover:text-white transition-colors"><X size={24}/></button>
            
            <div className="mb-6 lg:mb-8 pr-12">
              <h2 className="text-2xl lg:text-3xl font-black uppercase italic text-orange-600 leading-tight">Master Directory</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Manage & Bulk Download All Leads</p>
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
                      <h4 className="font-black uppercase text-sm text-gray-200">{p.temp_customer_name || p.customers?.name}</h4>
                      <div className="flex flex-col gap-1 mt-1.5">
                        <p className="text-[9px] lg:text-[10px] text-gray-500 flex items-center gap-2 italic"><MapPin size={10} className="text-blue-500/50"/> {p.location_name || 'N/A'}</p>
                        <p className="text-[9px] lg:text-[10px] text-orange-500/70 flex items-center gap-2 font-bold"><Phone size={10}/> {p.mobile_number || p.customers?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">No matching records found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}