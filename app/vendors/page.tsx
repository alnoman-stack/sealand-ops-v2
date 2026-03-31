'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import VendorEntryForm from '@/components/VendorEntryForm';
import AddVendorModal from '@/components/AddVendorModal';
import VendorLedgerModal from '@/components/VendorLedgerModal'; // নতুন কম্পোনেন্ট
import { Truck, Users, PlusCircle, Search, Phone, MapPin, Loader2, Edit3, Trash2, FileText, Tag } from 'lucide-react';

export default function VendorDashboard() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  
  // স্টেটমেন্ট বা লেজার দেখার জন্য স্টেট
  const [selectedForLedger, setSelectedForLedger] = useState<any>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  // ভেন্ডর ডাটা ফেচ করা
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_summaries')
        .select('*')
        .order('name');
      
      if (error) throw error;
      if (data) setVendors(data);
    } catch (error: any) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // ডিলিট লজিক
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete all purchase and payment records for this vendor!")) return;
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', id);
      if (error) throw error;
      fetchVendors();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  // সার্চ ফিল্টার
  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-orange-500 flex items-center gap-3">
            <Truck size={36} className="text-white" /> Vendor Hub
          </h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-2 ml-1">
            SeaLand Agro | Supplier Management
          </p>
        </div>
        
        <button 
          onClick={() => { setEditData(null); setIsModalOpen(true); }}
          className="bg-orange-600 text-black px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-orange-500 transition-all shadow-2xl shadow-orange-600/20 active:scale-95"
        >
          <PlusCircle size={20} /> Register Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side: Supplier Management List */}
        <div className="lg:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="relative mb-10">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input 
              type="text" 
              placeholder="Search by vendor name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-bold outline-none focus:border-orange-500 transition-all placeholder:text-gray-800"
            />
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[650px] pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-orange-500" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Loading Vendors...</p>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-20 opacity-20">
                <Users size={48} className="mx-auto mb-4" />
                <p className="font-bold italic uppercase tracking-widest">No Vendors Found</p>
              </div>
            ) : (
              filteredVendors.map((vendor) => (
                <div 
                  key={vendor.id} 
                  className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] flex justify-between items-center hover:bg-white/[0.05] transition-all group border-l-4 border-l-transparent hover:border-l-orange-600"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-black italic text-lg text-white uppercase group-hover:text-orange-500 transition-colors">
                        {vendor.name}
                      </h4>
                      <span className="flex items-center gap-1 text-[8px] bg-orange-600/10 border border-orange-600/20 px-2 py-1 rounded-md text-orange-500 font-black uppercase tracking-widest">
                        <Tag size={10} /> {vendor.category || 'General'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                      <span className="flex items-center gap-2 font-mono"><Phone size={12} className="text-orange-600/50" /> {vendor.phone || '---'}</span>
                      <span className="flex items-center gap-2 italic"><MapPin size={12} className="text-orange-600/50" /> {vendor.address || 'Dhaka, BD'}</span>
                    </div>

                    {/* Action Icons Panel */}
                    <div className="flex gap-5 pt-3 opacity-30 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={() => { setEditData(vendor); setIsModalOpen(true); }}
                        className="text-[9px] font-black uppercase text-blue-500 flex items-center gap-1 hover:text-blue-400 transition-colors"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(vendor.id)}
                        className="text-[9px] font-black uppercase text-red-500 flex items-center gap-1 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                      <button 
                        onClick={() => { setSelectedForLedger(vendor); setIsLedgerOpen(true); }}
                        className="text-[9px] font-black uppercase text-orange-500 flex items-center gap-1 hover:text-orange-400 transition-colors"
                      >
                        <FileText size={13} /> Statement
                      </button>
                    </div>
                  </div>

                  <div className="text-right bg-black/40 p-5 rounded-2xl min-w-[140px] border border-white/5 shadow-inner">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1 italic">Balance Due</p>
                    <p className={`text-2xl font-black italic tracking-tighter ${vendor.current_due > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                      ৳ {vendor.current_due.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Quick Entry Form */}
        <div className="lg:col-span-5 space-y-6">
          <VendorEntryForm onRefresh={fetchVendors} />
          
          <div className="bg-orange-600/5 border border-white/5 rounded-[2.5rem] p-8">
             <h5 className="font-black italic uppercase text-xs tracking-widest text-orange-500 mb-2">SeaLand Pro Tip:</h5>
             <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase italic">
               Click on 'Statement' to view detailed purchase and payment logs for each supplier. Records are updated instantly across all devices.
             </p>
          </div>
        </div>
      </div>

      {/* Modals Section */}
      <AddVendorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchVendors} 
        editData={editData} 
      />

      <VendorLedgerModal 
        isOpen={isLedgerOpen} 
        onClose={() => setIsLedgerOpen(false)} 
        vendor={selectedForLedger} 
      />
    </div>
  );
}