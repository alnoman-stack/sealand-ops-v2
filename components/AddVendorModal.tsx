'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Tag, User, Phone, MapPin } from 'lucide-react';

export default function AddVendorModal({ isOpen, onClose, onSuccess, editData }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    address: '', 
    category: 'Vegetables' 
  });

  // SeaLand Agro-র জন্য প্রডাক্ট ক্যাটাগরি লিস্ট
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editData?.id) {
        // আপডেট লজিক
        const { error } = await supabase
          .from('vendors')
          .update(formData)
          .eq('id', editData.id);
        if (error) throw error;
      } else {
        // নতুন অ্যাড করার লজিক
        const { error } = await supabase
          .from('vendors')
          .insert([formData]);
        if (error) throw error;
      }
      
      onSuccess(); // লিস্ট রিফ্রেশ করার জন্য
      onClose();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-6 top-6 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-black italic uppercase text-orange-500 mb-8 flex items-center gap-3">
          {editData ? 'Edit Supplier' : 'Add New Supplier'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Vendor Name */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-600 ml-2 tracking-widest">Supplier Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input 
                type="text" 
                placeholder="e.g. Shahid Enterprise" 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-orange-500 transition-all" 
              />
            </div>
          </div>

          {/* Product Category */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-600 ml-2 tracking-widest">Product Category</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-orange-500 appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-[#0a0a0a]">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-600 ml-2 tracking-widest">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input 
                type="text" 
                placeholder="017xxxxxxxx" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-orange-500 transition-all" 
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-600 ml-2 tracking-widest">Location / Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 text-gray-600" size={16} />
              <textarea 
                placeholder="Address Details" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-orange-500 min-h-[100px] resize-none transition-all" 
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-orange-600 text-black font-black uppercase text-[11px] rounded-2xl tracking-[0.2em] transition-all hover:bg-orange-500 active:scale-95 shadow-xl shadow-orange-600/10 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : editData ? 'Update Supplier' : 'Register Supplier'}
          </button>
        </form>
      </div>
    </div>
  );
}