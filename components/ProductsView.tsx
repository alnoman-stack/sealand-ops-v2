'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Search, Tag, Hash, BadgeDollarSign } from 'lucide-react';

export default function ProductsView() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('name_en', { ascending: true });
      setProducts(data || []);
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name_bn?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* হেডার সেকশন */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0a0a] p-6 rounded-[2rem] border border-gray-900">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
            <Package className="text-green-500" size={28} /> 
            Product Inventory
          </h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] ml-10">Total: {products.length} Items Indexed</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text"
            placeholder="Search by name or local name..."
            className="w-full bg-black border border-gray-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-green-500 transition-all text-sm text-white font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* প্রোডাক্ট লিস্ট টেবিল */}
      <div className="bg-[#0a0a0a] border border-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111] border-b border-gray-800">
              <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500 tracking-widest">SL</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500 tracking-widest">Product Information</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500 tracking-widest text-center">Category</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500 tracking-widest text-right">Unit Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900">
  {filteredProducts.map((product, index) => (
    <tr 
      key={product.id || index} 
      className={`transition-colors group ${
        index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
      } hover:bg-green-500/5`}
    >
      <td className="px-8 py-6">
        <span className="text-xs font-mono text-gray-600 font-bold">
          {String(index + 1).padStart(2, '0')}
        </span>
      </td>
      <td className="px-8 py-6">
        <div className="flex flex-col">
          <span className="text-white font-bold text-base tracking-tight group-hover:text-green-400 transition-colors uppercase italic">
            {product.name_en}
          </span>
          <span className="text-gray-500 text-xs font-medium mt-0.5">
            {product.name_bn || 'No local name'}
          </span>
        </div>
      </td>
      <td className="px-8 py-6 text-center">
        <span className="inline-block text-[9px] font-black bg-gray-900 border border-gray-800 px-3 py-1 rounded-full text-gray-400 uppercase tracking-widest">
          {product.category || 'General'}
        </span>
      </td>
      <td className="px-8 py-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xl font-black text-white italic">
            {product.price}
          </span>
          <span className="text-[10px] font-black text-green-500 uppercase tracking-tighter bg-green-500/10 px-2 py-1 rounded-md">
            TK/Unit
          </span>
        </div>
      </td>
    </tr>
  ))}
</tbody>
        </table>

        {/* যদি কোনো রেজাল্ট না থাকে */}
        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <div className="inline-block p-6 bg-gray-900/50 rounded-full mb-4">
              <Package className="text-gray-700" size={40} />
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No products found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}