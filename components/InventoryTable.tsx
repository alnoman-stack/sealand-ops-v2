'use client'
import { Search, Package, Hash } from 'lucide-react'; 
import FileUpload from './FileUpload';

export default function InventoryTable({ products, searchTerm, setSearchTerm, fetchProducts }: any) {
  
  const filteredCount = products?.filter((p: any) => 
    (p.name_en || p.name || p.product_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  ).length || 0;

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] text-white overflow-hidden">
      {/* Header Section */}
      <div className="mx-6 mt-6 mb-4 bg-[#0a0a0a] border border-gray-900 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
            <Package className="text-green-500" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Product Inventory</h2>
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">
              Total: {filteredCount} Items Indexed
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative group w-full md:w-80">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-gray-900 rounded-2xl py-3.5 pl-14 pr-6 text-[11px] font-bold text-white outline-none focus:border-green-500/30 transition-all"
            />
          </div>
          <div className="shrink-0 min-w-fit">
            <FileUpload onUploadSuccess={fetchProducts} />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 mx-6 mb-6 bg-[#0a0a0a] border border-gray-900 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl min-h-0">
        <div className="overflow-y-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0d0d0d] z-10 border-b border-gray-900/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-700 uppercase italic tracking-widest">SL</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-700 uppercase italic tracking-widest">Product Information</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-700 uppercase italic tracking-widest text-center">Category</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-700 uppercase italic tracking-widest">Unit Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/30">
              {products
                ?.filter((p: any) => (p.name_en || p.name || p.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()))
                .map((p: any, index: number) => (
                <tr key={p.id || index} className="hover:bg-white/[0.01] transition-all group border-l-2 border-transparent hover:border-green-500">
                  <td className="px-8 py-6 text-[11px] font-mono text-gray-800">{String(index + 1).padStart(2, '0')}</td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-gray-300 uppercase italic group-hover:text-white transition-colors">
                        {p.name_en || p.product_name || p.name || 'Unnamed Product'}
                    </div>
                    <div className="text-[9px] text-gray-700 font-bold mt-1 uppercase italic flex items-center gap-2">
                       <Hash size={10}/> ID: {p.id?.toString().slice(0,8) || 'N/A'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-[9px] bg-gray-900/50 text-gray-600 px-3 py-1 rounded-full font-black uppercase tracking-tighter">
                        {p.category || 'General'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="font-black italic text-xl tracking-tighter flex items-center justify-end gap-2">
                      {p.price} <span className="text-[9px] bg-green-500 text-black px-1.5 py-0.5 rounded font-black tracking-normal">TK/UNIT</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}