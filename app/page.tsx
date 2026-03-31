'use client'
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHome from '@/components/DashboardHome';
import OrdersView from '@/components/OrdersView';
import CreateInvoice from '@/components/CreateInvoice';
import CustomersView from '@/components/CustomersView';
import ProductsView from '@/components/ProductsView';
import SourcingPage from './sourcing/page'; 
import ExpenseManager from '@/components/ExpenseManager';
import CustomerReport from './reports/page'; 
import VendorDashboard from './vendors/page'; // ১. ভেন্ডর পেজটি ইমপোর্ট করুন

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedEditOrder, setSelectedEditOrder] = useState(null);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': 
        return <DashboardHome />;
      
      case 'orders': 
        return <OrdersView setView={setActiveView} setSelectedEditOrder={setSelectedEditOrder} />;
      
      case 'vendors': // ২. নতুন ভেন্ডর কেস যুক্ত করা হলো
        return <VendorDashboard />;
      
      case 'sourcing': 
        return <SourcingPage />; 
      
      case 'expenses': 
        return <ExpenseManager />; 
      
      case 'create-invoice': 
        return <CreateInvoice editData={selectedEditOrder} setView={setActiveView} />;
      
      case 'customers': 
        return <CustomersView />;
      
      case 'products': 
        return <ProductsView />;

      case 'reports': 
        return <CustomerReport />; 
      
      default: 
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex bg-black min-h-screen overflow-hidden font-sans text-white">
      <Sidebar activeView={activeView} setView={setActiveView} />
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
}