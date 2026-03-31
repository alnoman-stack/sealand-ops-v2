// components/Sidebar.tsx
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  FilePlus, 
  Truck, 
  Wallet, 
  FileText,
  UserCheck // ভেন্ডর প্রোফাইলের জন্য নতুন আইকন
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Order History', icon: ShoppingCart },
  { id: 'vendors', label: 'Vendor Hub', icon: Truck }, // এখানে আপনার ভেন্ডর ম্যানেজমেন্ট
  { id: 'expenses', label: 'Expenses', icon: Wallet }, 
  { id: 'create-invoice', label: 'New Invoice', icon: FilePlus },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'products', label: 'Inventory', icon: Package },
  { id: 'reports', label: 'Reports', icon: FileText }, 
];

export default function Sidebar({ activeView, setView }: any) {
  return (
    <div className="w-72 h-screen bg-[#050505] border-r border-gray-900 p-6 flex flex-col shrink-0">
      <div className="mb-10 px-4">
        <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">
          SEALAND <span className="text-orange-600">OPS</span>
        </h1>
        <p className="text-[8px] text-gray-600 font-bold tracking-[0.3em] uppercase mt-1">Management Portal</p>
      </div>
      
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 ${
              activeView === item.id 
              ? (item.id === 'vendors' 
                  ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/20' // ভেন্ডর সিলেক্ট থাকলে অরেঞ্জ থিম
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20')
              : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <item.icon size={18} className={`${activeView === item.id ? 'scale-110' : ''} transition-transform`} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="mt-auto p-4 bg-white/[0.02] rounded-2xl border border-white/5">
        <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Logged in as</p>
        <p className="text-[10px] font-bold text-gray-400 truncate">MD Abdullah Al Noman</p>
      </div>
    </div>
  );
}