'use client'
import { Search, Package, Hash } from 'lucide-react'; 
import FileUpload from './FileUpload';

export default function InventoryTable({ products, searchTerm, setSearchTerm, fetchProducts }: any) {
  
  const filteredProducts = products?.filter((p: any) => 
    (p.name_en || p.name || p.product_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredCount = filteredProducts.length;

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] text-white overflow-hidden font-sans">
      
      {/* Header Section */}
      <div className="mx-4 md:mx-6 mt-6 mb-4 bg-[#0a0a0a] border border-gray-900 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0 shadow-xl">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
            <Package className="text-green-500" size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Inventory</h2>
            <p className="text-[9px] md:text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">
              Total: {filteredCount} Items Indexed
            </p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full md:w-80">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH PRODUCT..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-gray-900 rounded-xl md:rounded-2xl py-3.5 pl-14 pr-6 text-[10px] font-bold text-white outline-none focus:border-green-500/30 transition-all uppercase tracking-widest"
            />
          </div>
          <div className="w-full md:w-auto shrink-0">
            <FileUpload onUploadSuccess={fetchProducts} />
          </div>
        </div>
      </div>

      {/* Table/List Area */}
      <div className="flex-1 mx-4 md:mx-6 mb-6 bg-[#0a0a0a] border border-gray-900 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl min-h-0">
        
        {/* desktop view table */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse hidden md:table">
            <thead className="sticky top-0 bg-[#0d0d0d] z-10 border-b border-gray-900/50">
              <tr>
                <th className="px-8 py-5 text-[9px] font-black text-gray-700 uppercase italic tracking-widest">SL</th>
                <th className="px-8 py-5 text-[9px] font-black text-gray-700 uppercase italic tracking-widest">Product Information</th>
                <th className="px-8 py-5 text-[9px] font-black text-gray-700 uppercase italic tracking-widest text-center">Category</th>
                <th className="px-8 py-5 text-right text-[9px] font-black text-gray-700 uppercase italic tracking-widest">Unit Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/30">
              {filteredProducts.map((p: any, index: number) => (
                <tr key={p.id || index} className="hover:bg-white/[0.02] transition-all group border-l-2 border-transparent hover:border-green-500">
                  <td className="px-8 py-6 text-[11px] font-mono text-gray-800">{String(index + 1).padStart(2, '0')}</td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-gray-300 uppercase italic group-hover:text-white transition-colors text-sm">
                        {p.name_en || p.product_name || p.name || 'Unnamed Product'}
                    </div>
                    <div className="text-[9px] text-gray-700 font-bold mt-1 uppercase italic flex items-center gap-2">
                       <Hash size={10}/> ID: {p.id?.toString().slice(0,8) || 'N/A'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-[9px] bg-gray-900 text-gray-500 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-gray-800">
                        {p.category || 'General'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="font-black italic text-xl tracking-tighter flex items-center justify-end gap-2">
                      {p.price} <span className="text-[8px] bg-green-500 text-black px-1.5 py-0.5 rounded font-black tracking-normal leading-none">BDT</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* mobile view cards */}
          <div className="md:hidden flex flex-col p-4 gap-3">
            {filteredProducts.map((p: any, index: number) => (
               <div key={p.id || index} className="bg-black/40 border border-gray-900 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-[9px] font-black text-gray-700 uppercase mb-1">#{String(index + 1).padStart(2, '0')}</p>
                        <h3 className="font-black text-gray-200 uppercase italic leading-tight text-sm">{p.name_en || p.product_name || 'Unnamed'}</h3>
                     </div>
                     <span className="text-[8px] bg-gray-900 text-gray-600 px-2 py-1 rounded font-black uppercase border border-gray-800">{p.category || 'General'}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-900 pt-3">
                    <div className="text-[9px] text-gray-700 font-bold uppercase italic"><Hash size={8} className="inline mr-1"/>{p.id?.toString().slice(0,8)}</div>
                    <div className="font-black italic text-lg text-white tracking-tighter">{p.price} <span className="text-[9px] text-green-500">TK</span></div>
                  </div>
               </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center opacity-20">
               <Package size={48} />
               <p className="mt-4 font-black uppercase italic text-xs tracking-[0.3em]">No items found</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
      `}</style>
    </div>
  );
}