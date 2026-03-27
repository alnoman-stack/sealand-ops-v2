// components/Sidebar.tsx

import { LayoutDashboard, ShoppingCart, Users, Package, FilePlus, Truck } from 'lucide-react';



const menuItems = [

  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },

  { id: 'orders', label: 'Order History', icon: ShoppingCart },

  { id: 'sourcing', label: 'Sourcing', icon: Truck }, // নতুন যুক্ত করা হয়েছে

  { id: 'create-invoice', label: 'New Invoice', icon: FilePlus },

  { id: 'customers', label: 'Customers', icon: Users },

  { id: 'products', label: 'Inventory', icon: Package },

];



export default function Sidebar({ activeView, setView }: any) {

  return (

    <div className="w-72 h-screen bg-[#050505] border-r border-gray-900 p-6 flex flex-col shrink-0">

      <div className="mb-10 px-4">

        <h1 className="text-2xl font-black italic tracking-tighter text-white">SEALAND <span className="text-blue-600">OPS</span></h1>

      </div>

      

      <nav className="flex-1 space-y-2">

        {menuItems.map((item) => (

          <button

            key={item.id}

            onClick={() => setView(item.id)}

            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold uppercase text-[11px] tracking-widest transition-all ${

              activeView === item.id 

              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 

              : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'

            }`}

          >

            <item.icon size={18} />

            {item.label}

          </button>

        ))}

      </nav>

    </div>

  );

}





