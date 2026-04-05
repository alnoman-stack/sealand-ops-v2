'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Tag, User, Phone, MapPin, CheckCircle } from 'lucide-react';

export default function AddVendorModal({ isOpen, onClose, onSuccess, editData }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    address: '', 
    category: 'Vegetables' 
  });

  const categories = ['Vegetables', 'Fruits', 'Fish', 'Dairy', 'Spices', 'Meat', 'Others'];

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        phone: editData.phone || '',
        address: editData.address || '',
        category: editData.category || 'Vegetables'
      });
    } else {
      setFormData({ name: '', phone: '', address: '', category: 'Vegetables' });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ফোন নাম্বার ভ্যালিডেশন (ঐচ্ছিক কিন্তু ভালো প্র্যাকটিস)
    if (formData.phone && formData.phone.length < 11) {
      return alert("Please enter a valid 11-digit phone number.");
    }

    setLoading(true);

    try {
      // নাম যেন সবসময় বড় হাতের অক্ষরে সেভ হয়
      const payload = {
        ...formData,
        name: formData.name.toUpperCase().trim()
      };

      if (editData?.id) {
        const { error } = await supabase
          .from('vendors')
          .update(payload)
          .eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert([payload]);
        if (error) throw error;
      }
      
      onSuccess(); 
      onClose();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-6 top-6 text-gray-500 hover:text-white transition-all hover:rotate-90 p-2"
        >
          <X size={20} />
        </button>

        <div className="mb-8">
          <h2 className="text-xl font-black italic uppercase text-orange-500 flex items-center gap-3 tracking-tighter">
            {editData ? 'Edit Supplier' : 'Register New Supplier'}
          </h2>
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Vendor Master Management</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Vendor Name */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500 ml-2 tracking-widest italic">Supplier Name / Business</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-orange-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="e.g. Shahid Enterprise" 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-orange-500 transition-all uppercase" 
              />
            </div>
          </div>

          {/* Product Category */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500 ml-2 tracking-widest italic">Supply Category</label>
            <div className="relative group">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-orange-500 transition-colors" size={16} />
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-orange-500 appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-[#0a0a0a]">{cat.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500 ml-2 tracking-widest italic">Contact Number</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-orange-500 transition-colors" size={16} />
              <input 
                type="tel" 
                placeholder="017xxxxxxxx" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-orange-500 transition-all" 
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500 ml-2 tracking-widest italic">Physical Address / Hub</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-4 text-gray-600 group-focus-within:text-orange-500 transition-colors" size={16} />
              <textarea 
                placeholder="Details of vendor location" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-orange-500 min-h-[90px] resize-none transition-all" 
              />
            </div>
          </div>

          {/* Action Button */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-5 font-black uppercase text-[11px] rounded-2xl tracking-[0.2em] transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-orange-600/5 ${loading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-orange-600 hover:text-white active:scale-95'}`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : editData ? <CheckCircle size={18} /> : <CheckCircle size={18} />} 
            {loading ? 'Processing...' : editData ? 'Update Record' : 'Confirm Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}