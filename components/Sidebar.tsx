'use client'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  LogOut,
  ChevronRight,
  ShoppingBag // সোর্সিং লিস্টের জন্য নতুন আইকন
} from 'lucide-react';
import { useRouter } from 'next/navigation'; // পেজ নেভিগেশনের জন্য

export default function Sidebar({ activeView, setView }) {
  const router = useRouter();

  // মেনু আইটেমগুলোর লিস্ট
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, type: 'view' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, type: 'view' },
    { id: 'customers', label: 'Customers', icon: Users, type: 'view' },
    { id: 'products', label: 'Products', icon: Package, type: 'view' },
    // ✅ নতুন সোর্সিং লিস্ট বাটন (এটি সরাসরি পেজে নিয়ে যাবে)
    { id: 'sourcing', label: 'Sourcing List', icon: ShoppingBag, type: 'link', href: '/sourcing' },
  ];

  const handleMenuClick = (item: any) => {
    if (item.type === 'link') {
      router.push(item.href); // আলাদা পেজে নিয়ে যাবে
    } else {
      setView(item.id); // একই ড্যাশবোর্ডের ভিউ পরিবর্তন করবে
    }
  };

  return (
    <aside className="w-72 bg-[#050505] border-r border-gray-900 flex flex-col h-screen sticky top-0">
      {/* লোগো সেকশন */}
      <div className="p-8">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <span className="text-black font-black text-xl">S</span>
          </div>
          <div>
            <h2 className="text-white font-black tracking-tighter text-xl group-hover:text-green-500 transition-colors">
              SEALAND OPS
            </h2>
            <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.3em]">Management v2.0</p>
          </div>
        </div>
      </div>

      {/* মেনু লিস্ট */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={`
                w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-green-500 text-black shadow-[0_10px_30px_rgba(34,197,94,0.2)]' 
                  : 'text-gray-500 hover:bg-white/[0.03] hover:text-white'}
              `}
            >
              <div className="flex items-center gap-4">
                <Icon size={22} strokeWidth={isActive ? 3 : 2} />
                <span className={`font-bold tracking-tight ${isActive ? 'text-black' : 'text-inherit'}`}>
                  {item.label}
                </span>
              </div>
              {isActive && <ChevronRight size={18} strokeWidth={3} />}
            </button>
          );
        })}
      </nav>

      {/* ফুটার/লগআউট সেকশন */}
      <div className="p-6 border-t border-gray-900">
        <button className="w-full flex items-center gap-4 p-4 text-gray-600 hover:text-red-500 transition-colors font-bold">
          <LogOut size={20} />
          <span>Logout System</span>
        </button>
      </div>
    </aside>
  );
}