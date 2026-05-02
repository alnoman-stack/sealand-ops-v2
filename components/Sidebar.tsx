'use client'
import { useState, useEffect } from 'react'; 
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  FilePlus, 
  Truck, 
  Wallet, 
  FileText,
  PlusCircle,
  Zap,
  BarChart3,
  LogOut,
  Menu, 
  X,
  MapPin 
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'create-invoice', label: 'New Invoice', icon: FilePlus },
  { id: 'orders', label: 'Order History', icon: ShoppingCart },
  { id: 'sourcing', label: 'Product Sourcing', icon: Zap },
  { id: 'purchase', label: 'Stock In (Buy)', icon: PlusCircle }, 
  { id: 'inventory-report', label: 'Stock Movement', icon: BarChart3 },
  { id: 'vendors', label: 'Vendor Hub', icon: Truck }, 
  { id: 'expenses', label: 'Expenses', icon: Wallet }, 
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'products', label: 'Inventory', icon: Package },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'visit-log', label: 'Daily Visit Log', icon: MapPin },
];

export default function Sidebar({ activeView, setView }: any) {
  const router = useRouter();
  const [userName, setUserName] = useState('Loading...'); 
  const [isOpen, setIsOpen] = useState(false); 

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0];
        setUserName(name || 'Unknown User');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/login');
    } else {
      console.error('Error logging out:', error.message);
    }
  };

  const handleMenuClick = (id: string) => {
    setView(id);
    setIsOpen(false); 
  };

  return (
    <>
      {/* মোবাইল বাটন */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-orange-600 rounded-xl text-black shadow-lg"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* মোবাইল ওভারলে */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* মেইন সাইডবার কন্টেইনার */}
      <div className={`
        fixed lg:relative z-[50] h-screen bg-[#050505] border-r border-gray-900 flex flex-col shrink-0
        transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar
        ${isOpen ? 'left-0 w-72' : '-left-full lg:left-0 w-72'}
      `}>
        
        {/* Logo Section */}
        <div className="p-6 pt-16 lg:pt-8 flex-shrink-0">
          <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">
            SEALAND <span className="text-orange-600">OPS</span>
          </h1>
          <p className="text-[8px] text-gray-600 font-bold tracking-[0.3em] uppercase mt-1">Management Portal</p>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-1.5 mb-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 ${
                activeView === item.id 
                ? (['vendors', 'purchase', 'sourcing', 'inventory-report', 'visit-log'].includes(item.id)
                    ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/20' 
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20')
                : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <item.icon size={16} className={`${activeView === item.id ? 'scale-110' : ''} transition-transform`} />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer & Logout Section */}
        <div className="p-4 mt-auto space-y-3 bg-[#050505] sticky bottom-0 border-t border-white/5">
          <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
            <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest">Logged in as</p>
            <p className="text-[9px] font-bold text-gray-400 truncate capitalize">
              {userName}
            </p>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest text-red-500 bg-red-500/5 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all duration-300 group"
          >
            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
            Logout System
          </button>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: thin; }
      `}</style>
    </>
  );
}