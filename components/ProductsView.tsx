'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Search, Loader2, Tag, Plus, Check, X, ArrowUpRight } from 'lucide-react';
import FileUpload from './FileUpload'; 

export default function ProductsView() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name_en: '', price: '', category: 'Vegetables', unit: 'kg' });

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name_en', { ascending: true });
    
    if (error) console.error("Error fetching:", error);
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleUpdatePrice = async (id: number) => {
    const { error } = await supabase
      .from('products')
      .update({ price: parseInt(tempPrice) })
      .eq('id', id);
    
    if (!error) {
      setProducts(products.map(p => p.id === id ? { ...p, price: tempPrice } : p));
      setEditingId(null);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name_en || !newProduct.price) return alert("সব তথ্য দিন");
    const { error } = await supabase.from('products').insert([{ 
        name_en: newProduct.name_en, 
        price: parseInt(newProduct.price), 
        category: newProduct.category,
        unit: newProduct.unit
    }]);
    if (!error) {
      fetchProducts();
      setIsModalOpen(false);
      setNewProduct({ name_en: '', price: '', category: 'Vegetables', unit: 'kg' });
    }
  };

  const filteredProducts = products.filter((p: any) => 
    (p.name_en || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-[#020202] text-white flex flex-col overflow-hidden font-sans">
      
      {/* --- HEADER --- */}
      <header className="shrink-0 z-20 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto p-4 md:p-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
              SeaLand <span className="text-green-500">Vault</span>
            </h1>
            <p className="hidden md:block text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Inventory Management System</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-green-500" size={14} />
              <input 
                type="text" 
                placeholder="SEARCH..." 
                className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-[10px] font-bold tracking-widest outline-none focus:border-green-500/30 transition-all uppercase"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex-1 sm:flex-none bg-green-500 hover:bg-white text-black px-4 md:px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all font-black uppercase text-[10px]"
              >
                <Plus size={16} /> Add
              </button>
              <FileUpload onUploadSuccess={fetchProducts} />
            </div>
          </div>
        </div>
      </header>

      {/* --- CONTENT --- */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-6 md:py-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="animate-spin text-green-500 mb-4" size={40} />
              <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Syncing...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((p) => (
                <div key={p.id} className="group relative bg-[#080808] border border-white/5 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 hover:border-green-500/40 transition-all duration-500">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-green-500/20">
                      <Package className="text-gray-600 group-hover:text-green-500 transition-colors" size={18} />
                    </div>
                    <span className="text-[9px] font-mono text-gray-800">ID: {p.id}</span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter text-gray-200 group-hover:text-white transition-colors truncate">
                      {p.name_en}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Tag size={10} className="text-green-500" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 bg-white/5 px-2 py-0.5 rounded">
                        {p.category} • {p.unit}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-end justify-between">
                    <div className="flex-1">
                      <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Rate / {p.unit}</p>
                      {editingId === p.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            autoFocus
                            className="bg-black border border-green-500 rounded-lg w-20 px-2 py-1 text-xl font-black text-white outline-none"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdatePrice(p.id)}
                          />
                          <button onClick={() => handleUpdatePrice(p.id)} className="bg-green-500 p-1 rounded text-black"><Check size={14}/></button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => { setEditingId(p.id); setTempPrice(p.price); }}
                          className="flex items-baseline gap-1 cursor-pointer group/price"
                        >
                          <span className="text-2xl md:text-3xl font-black italic tracking-tighter text-white group-hover/price:text-green-500 transition-colors">
                            {p.price}
                          </span>
                          <span className="text-[9px] text-gray-400 font-black uppercase">TK</span>
                        </div>
                      )}
                    </div>
                    <button className="w-8 h-8 md:w-10 md:h-10 bg-white/5 rounded-lg md:rounded-xl flex items-center justify-center hover:bg-green-500 hover:text-black transition-all">
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* --- ADD PRODUCT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2rem] p-6 md:p-10 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X /></button>
            <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter mb-6 md:mb-8 text-center sm:text-left">Add New <span className="text-green-500">Asset</span></h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-600 ml-1">Product Name</label>
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 outline-none focus:border-green-500 transition-all text-sm"
                  onChange={(e) => setNewProduct({...newProduct, name_en: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-600 ml-1">Price (TK)</label>
                  <input 
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 outline-none focus:border-green-500 transition-all text-sm"
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-600 ml-1">Unit</label>
                  <input 
                    placeholder="e.g. kg, pcs"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 outline-none focus:border-green-500 transition-all text-sm"
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-600 ml-1">Category</label>
                <select 
                  className="w-full bg-[#111] border border-white/10 rounded-xl py-3 px-5 outline-none focus:border-green-500 text-sm"
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                >
                  <option value="Vegetables">Vegetables</option>
                  <option value="Frozen">Frozen</option>
                  <option value="Fish">Fish</option>
                  <option value="Meat">Meat</option>
                  <option value="Sauce">Sauce</option>
                </select>
              </div>
              <button 
                onClick={handleAddProduct}
                className="w-full bg-green-500 hover:bg-white text-black font-black uppercase py-4 rounded-xl transition-all mt-4 text-xs tracking-widest"
              >
                Insert to Vault
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        @media (max-width: 480px) {
            .xs\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
    </div>
  );
}