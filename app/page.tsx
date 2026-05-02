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
import VendorDashboard from './vendors/page';
import InventoryReport from '@/components/InventoryReport'; // ইনভেন্টরি রিপোর্ট ইমপোর্ট
import PurchaseEntry from '@/components/PurchaseEntry'; // পারচেজ এন্ট্রি ইমপোর্ট
import VisitForm from '@/components/VisitForm';

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedEditOrder, setSelectedEditOrder] = useState(null);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': 
        return <DashboardHome />;
      
      case 'orders': 
        return <OrdersView setView={setActiveView} setSelectedEditOrder={setSelectedEditOrder} />;
      
      case 'vendors': 
        return <VendorDashboard />;
      
      case 'sourcing': 
        return <SourcingPage />; 

      case 'purchase': // সাইডবারে "Stock In (Buy)" এ ক্লিক করলে এটি ওপেন হবে
        return <PurchaseEntry />; 

      case 'inventory-report': // সাইডবারে "Stock Movement" এ ক্লিক করলে এটি ওপেন হবে
        return <InventoryReport />; 
      
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
      
      // নতুন ভিউ যুক্ত করা হলো
      case 'visit-log': 
        return (
          <div className="p-8 max-w-2xl mx-auto">
             <VisitForm onSuccess={() => setActiveView('dashboard')} />
          </div>
        ); 
      
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