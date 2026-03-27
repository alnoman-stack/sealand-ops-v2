'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Search, Hash, Loader2, ChevronRight } from 'lucide-react';
import FileUpload from './FileUpload'; 

export default function ProductsView() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('name_en', { ascending: true });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p: any) => 
    (p.name_en || p.name || p.product_name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.name_bn || "")?.includes(searchTerm)
  );

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden p-8 gap-6 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-gray-900 shadow-2xl shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
            <Package className="text-green-500" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
              Product Inventory
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">
              Total: {products.length} Items Indexed
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-green-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search products..."
              className="w-full bg-black border border-gray-800 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-green-500/50 transition-all text-sm text-white font-bold placeholder:text-gray-700 shadow-inner"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="shrink-0">
            <FileUpload onUploadSuccess={fetchProducts} />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 bg-transparent flex flex-col min-h-0">
        <div className="overflow-y-auto no-scrollbar flex-1 pr-2">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead className="sticky top-0 z-20 bg-black">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-600 tracking-widest italic">SL</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-600 tracking-widest italic">Product Information</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-600 tracking-widest italic text-center">Category</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-600 tracking-widest italic text-right">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product: any, index) => (
                <tr 
                  key={product.id ? String(product.id) : `prod-${index}`} 
                  className="transition-all duration-300 ease-out group bg-[#0a0a0a] border border-gray-900 hover:bg-[#111] hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] cursor-pointer"
                >
                  <td className="px-8 py-6 first:rounded-l-[1.5rem] border-y border-l border-gray-900 group-hover:border-green-500/30 transition-colors">
                    <span className="font-mono text-[11px] text-gray-700 group-hover:text-green-500 transition-colors font-bold">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </td>
                  
                  <td className="px-8 py-6 border-y border-gray-900 group-hover:border-green-500/30 transition-colors">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300 font-bold text-lg tracking-tight uppercase italic group-hover:text-white transition-colors">
                          {product.name_en || product.name || product.product_name || 'Unnamed Product'}
                        </span>
                        <ChevronRight size={14} className="text-green-500 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                      </div>
                      <span className="text-gray-600 text-[10px] font-black mt-1 uppercase flex items-center gap-2 tracking-widest">
                        <Hash size={10} /> {product.id?.toString().slice(0,8) || 'N/A'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-8 py-6 text-center border-y border-gray-900 group-hover:border-green-500/30 transition-colors">
                    <span className="text-[9px] font-black bg-black px-4 py-2 rounded-lg text-gray-500 uppercase tracking-widest border border-gray-800 group-hover:border-green-500/20 group-hover:text-gray-300">
                      {product.category || 'General'}
                    </span>
                  </td>
                  
                  <td className="px-8 py-6 text-right last:rounded-r-[1.5rem] border-y border-r border-gray-900 group-hover:border-green-500/30 transition-colors">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-2xl font-black text-white italic tracking-tighter group-hover:text-green-400 transition-colors">
                        {product.price}
                      </span>
                      <span className="text-[10px] font-black text-black bg-green-500 px-2 py-0.5 rounded italic shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                        TK/UNIT
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="text-green-500 animate-spin mb-4" size={40} />
              <p className="text-xs font-black uppercase tracking-widest text-gray-600 italic">Accessing SeaLand Vault...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}