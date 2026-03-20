'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import DashboardHome from '@/components/DashboardHome';
import OrdersView from '@/components/OrdersView';
import CustomersView from '@/components/CustomersView';
import ProductsView from '@/components/ProductsView';
import CreateInvoice from '@/components/CreateInvoice'; // নতুন ইমপোর্ট
import FileUpload from '@/components/FileUpload'; 
import { Plus, CreditCard } from 'lucide-react';

export default function Page() {
  const [view, setView] = useState('dashboard');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  return (
    <div className="flex bg-black min-h-screen text-white font-sans selection:bg-blue-500/30">
      {/* সাইডবার মেনু */}
      <Sidebar activeView={view} setView={setView} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {/* টপ বার ও হেডার */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">
              {view === 'dashboard' ? 'Business Overview' : 
               view === 'create-invoice' ? 'Generate New Invoice' : 
               view === 'orders' ? 'Order History' : 
               view === 'customers' ? 'Customer Management' : 'Product Inventory'}
            </h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">
              Sealand Agro Operations Management
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* CSV ফাইল আপলোড বাটন */}
            <FileUpload onUploadSuccess={() => window.location.reload()} /> 
            
            {view === 'dashboard' && (
              <>
                <button 
                  onClick={() => setView('create-invoice')} // সরাসরি ইনভয়েস পেজে নিয়ে যাবে
                  className="bg-white text-black px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
                >
                  <Plus size={18} strokeWidth={3} /> CREATE ORDER
                </button>
              </>
            )}
          </div>
        </div>

        {/* মেইন কন্টেন্ট - এখানে ভিউ পরিবর্তন হবে */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {view === 'dashboard' ? <DashboardHome /> : 
           view === 'create-invoice' ? <CreateInvoice /> : 
           view === 'orders' ? <OrdersView /> : 
           view === 'customers' ? <CustomersView /> : 
           <ProductsView />}
        </div>
      </main>
    </div>
  );
}