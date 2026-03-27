'use client'
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHome from '@/components/DashboardHome';
import OrdersView from '@/components/OrdersView';
import CreateInvoice from '@/components/CreateInvoice';
import CustomersView from '@/components/CustomersView';
import ProductsView from '@/components/ProductsView';
// নিশ্চিত করুন যে SourcingPage ঠিকভাবে ইম্পোর্ট করা হয়েছে
import SourcingPage from './sourcing/page'; 

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedEditOrder, setSelectedEditOrder] = useState(null);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardHome />;
      case 'orders': 
        return <OrdersView setView={setActiveView} setSelectedEditOrder={setSelectedEditOrder} />;
      
      // এই অংশটি লক্ষ্য করুন: এখানে আগে হয়তো ProductsView ছিল
      case 'sourcing': 
        return <SourcingPage />; 
      
      case 'create-invoice': 
        return <CreateInvoice editData={selectedEditOrder} setView={setActiveView} />;
      case 'customers': return <CustomersView />;
      case 'products': return <ProductsView />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="flex bg-black min-h-screen overflow-hidden">
      <Sidebar activeView={activeView} setView={setActiveView} />
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
}