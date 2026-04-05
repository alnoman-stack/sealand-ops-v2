'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import VendorEntryForm from '@/components/VendorEntryForm';
import AddVendorModal from '@/components/AddVendorModal';
import VendorLedgerModal from '@/components/VendorLedgerModal';
import { Truck, Users, PlusCircle, Search, Phone, MapPin, Loader2, Edit3, Trash2, FileText, Tag } from 'lucide-react';

export default function VendorDashboard() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  
  const [selectedForLedger, setSelectedForLedger] = useState<any>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure? This will delete all records!")) return;
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', id);
      if (error) throw error;
      fetchVendors();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleEdit = (e: React.MouseEvent, vendor: any) => {
    e.stopPropagation();
    setEditData(vendor);
    setIsModalOpen(true);
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-orange-500 flex items-center gap-3">
            <Truck size={30} className="text-white md:w-9 md:h-9" /> Vendor Hub
          </h1>
          <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] md:tracking-[0.3em] mt-2 ml-1">
            SeaLand Agro | Supplier Management
          </p>
        </div>
        
        <button 
          onClick={() => { setEditData(null); setIsModalOpen(true); }}
          className="w-full md:w-auto bg-orange-600 text-black px-6 md:px-8 py-4 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-orange-500 transition-all active:scale-95 shadow-xl shadow-orange-600/10"
        >
          <PlusCircle size={18} /> Register Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        
        {/* Left Side: Supplier List */}
        <div className="order-2 lg:order-1 lg:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[1.5rem] md:rounded-[3rem] p-4 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="relative mb-6 md:mb-10">
            <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            <input 
              type="text" 
              placeholder="Search vendor or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-12 md:pl-14 pr-6 text-xs md:text-sm font-bold outline-none focus:border-orange-500 transition-all placeholder:text-gray-800"
            />
          </div>

          <div className="space-y-3 md:space-y-4 overflow-y-auto max-h-[500px] md:max-h-[650px] pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-orange-500" size={32} />
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Loading...</p>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-20 opacity-20">
                <Users size={40} className="mx-auto mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">No Vendors</p>
              </div>
            ) : (
              filteredVendors.map((vendor) => (
                <div 
                  key={vendor.id} 
                  onClick={() => { setSelectedForLedger(vendor); setIsLedgerOpen(true); }}
                  className="bg-white/[0.02] border border-white/5 p-4 md:p-6 rounded-[1.2rem] md:rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/[0.05] transition-all group border-l-4 border-l-transparent hover:border-l-orange-600 cursor-pointer active:scale-[0.98]"
                >
                  <div className="space-y-2 md:space-y-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 md:gap-3">
                      <h4 className="font-black italic text-base md:text-lg text-white uppercase group-hover:text-orange-500 transition-colors truncate max-w-[150px] md:max-w-none">
                        {vendor.name}
                      </h4>
                      <span className="flex items-center gap-1 text-[7px] md:text-[8px] bg-orange-600/10 border border-orange-600/20 px-2 py-1 rounded-md text-orange-500 font-black uppercase tracking-widest whitespace-nowrap">
                        <Tag size={10} /> {vendor.category || 'General'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1 text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                      <span className="flex items-center gap-2 font-mono"><Phone size={12} className="text-orange-600/50" /> {vendor.phone || '---'}</span>
                      <span className="flex items-center gap-2 italic"><MapPin size={12} className="text-orange-600/50" /> {vendor.address || 'Dhaka, BD'}</span>
                    </div>

                    {/* Actions - Visible on mobile for better UX */}
                    <div className="flex gap-4 pt-2 md:pt-3 md:opacity-30 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleEdit(e, vendor)} className="text-[8px] md:text-[9px] font-black uppercase text-blue-500 flex items-center gap-1 hover:text-blue-400">
                        <Edit3 size={12} /> Edit
                      </button>
                      <button onClick={(e) => handleDelete(e, vendor.id)} className="text-[8px] md:text-[9px] font-black uppercase text-red-500 flex items-center gap-1 hover:text-red-400">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto text-left sm:text-right bg-black/40 p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/5 shadow-inner">
                    <p className="text-[7px] md:text-[8px] font-black text-gray-600 uppercase tracking-[0.1em] md:tracking-[0.2em] mb-1 italic">Balance Due</p>
                    <p className={`text-xl md:text-2xl font-black italic tracking-tighter ${vendor.current_due > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                      ৳ {vendor.current_due.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Quick Entry Form */}
        <div className="order-1 lg:order-2 lg:col-span-5 space-y-6">
          <VendorEntryForm onRefresh={fetchVendors} />
          
          <div className="hidden md:block bg-orange-600/5 border border-white/5 rounded-[2.5rem] p-8">
             <h5 className="font-black italic uppercase text-xs tracking-widest text-orange-500 mb-2">MD's Dashboard Tip:</h5>
             <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase italic">
                You can now click anywhere on a vendor card to instantly open their statement.
             </p>
          </div>
        </div>
      </div>

      <AddVendorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchVendors} editData={editData} />
      <VendorLedgerModal isOpen={isLedgerOpen} onClose={() => setIsLedgerOpen(false)} vendor={selectedForLedger} />
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
      `}</style>
    </div>
  );
}