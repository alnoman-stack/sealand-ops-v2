import { Search, Plus } from 'lucide-react';

export default function InventoryTable({ products, searchTerm, setSearchTerm, addToCart }) {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-white">Inventory Control</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="bg-[#111] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 w-64 text-white focus:border-green-500 outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#111] text-gray-400 text-xs uppercase font-bold">
            <tr>
              <th className="px-8 py-5">Product Name</th>
              <th className="px-8 py-5">Price</th>
              <th className="px-8 py-5 text-right">Add</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.02] text-white">
                <td className="px-8 py-6 font-bold">{p.name_en}</td>
                <td className="px-8 py-6 font-mono text-green-400 font-bold">{p.price} TK / {p.unit}</td>
                <td className="px-8 py-6 text-right">
                  <button onClick={() => addToCart(p)} className="bg-green-500/10 text-green-500 p-2 rounded-lg hover:bg-green-500 hover:text-black transition-all">
                    <Plus size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}