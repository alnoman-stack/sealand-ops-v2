'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useReactToPrint } from 'react-to-print';
import InvoicePrint from './InvoicePrint';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Eye, Edit, Trash2, FileText, Printer, X, Save, Search, 
  Plus, Download, Calendar as CalendarIcon, Loader2, Hash, Banknote 
} from 'lucide-react';

interface OrdersViewProps {
  setView: (view: string) => void;
  setSelectedEditOrder: (order: any) => void;
}

export default function OrdersView({ setView, setSelectedEditOrder }: OrdersViewProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState(''); 
  const [orderSearchTerm, setOrderSearchTerm] = useState(''); 
  
  const [products, setProducts] = useState<any[]>([]);

  // --- নতুন যুক্ত করা স্টেট (Payment Tracking) ---
  const [payments, setPayments] = useState<any[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const getTodayString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      const updateScale = () => {
        const container = document.getElementById('invoice-container');
        const wrapper = document.getElementById('invoice-wrapper');
        if (container && wrapper) {
          const containerWidth = container.offsetWidth - 20;
          const invoiceWidth = 800;
          if (containerWidth < invoiceWidth) {
            const scale = containerWidth / invoiceWidth;
            wrapper.style.transform = `scale(${scale})`;
            wrapper.style.transformOrigin = 'top center';
          } else {
            wrapper.style.transform = `scale(1)`;
          }
        }
      };
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, [isModalOpen]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice_${selectedOrder?.invoice_number || 'Order'}`,
  });

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element || isDownloading) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${selectedOrder?.invoice_number || 'Order'}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("পিডিএফ তৈরি করা সম্ভব হচ্ছে না।");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchPayments(); // নতুন পেমেন্ট ফেচ ফাংশন কল
  }, [selectedDate]);

  const fetchOrders = async () => {
    const start = `${selectedDate}T00:00:00.000Z`;
    const end = `${selectedDate}T23:59:59.999Z`;
    const { data, error } = await supabase.from('invoices').select('*').gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false });
    if (error) console.error(error);
    setOrders(data || []);
  };

  // --- নতুন পেমেন্ট ফেচ ফাংশন ---
  const fetchPayments = async () => {
    const start = `${selectedDate}T00:00:00.000Z`;
    const end = `${selectedDate}T23:59:59.999Z`;
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .gte('payment_date', start)
      .lte('payment_date', end);
    if (error) console.error("Payment Fetch Error:", error);
    setPayments(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    setProducts(data || []);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredOrders = orders.filter(order => 
    (order.invoice_number?.toLowerCase() || "").includes(orderSearchTerm.toLowerCase()) ||
    (order.customer_name?.toLowerCase() || "").includes(orderSearchTerm.toLowerCase())
  );

  const dailyTotalSales = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  // আজকের মোট কালেকশন হিসাব
  const dailyTotalCollected = payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);

  const handleViewOrder = async (order: any) => {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', order.id);
    setSelectedOrder(order);
    setOrderItems(items || []);
    setIsModalOpen(true);
  };

  const handleEditOrder = async (order: any) => {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', order.id);
    setSelectedOrder({ ...order }); 
    setOrderItems(items || []);
    setIsEditModalOpen(true);
  };

  const deleteOrder = async (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিত?")) {
      await supabase.from('invoice_items').delete().eq('invoice_id', id);
      await supabase.from('invoices').delete().eq('id', id);
      fetchOrders();
    }
  };

  const addNewItem = (p: any) => {
    const name = p.name_en || p.name || "Unknown Product";
    const price = p.price || 0;
    const existingIndex = orderItems.findIndex(item => item.product_name === name);
    let updated;
    if (existingIndex > -1) {
      updated = [...orderItems];
      updated[existingIndex].qty += 1;
      updated[existingIndex].total = Number((updated[existingIndex].qty * updated[existingIndex].unit_price).toFixed(2));
    } else {
      updated = [...orderItems, { product_name: name, qty: 1, unit_price: price, total: price }];
    }
    setOrderItems(updated);
    const total = updated.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setSelectedOrder((prev: any) => ({ ...prev, total_amount: Number(total.toFixed(2)) }));
  };

  const saveUpdatedOrder = async () => {
    if (orderItems.length === 0) return alert("অর্ডার লিস্ট খালি!");
    setIsSaving(true);
    try {
      await supabase.from('invoices').update({
        customer_name: selectedOrder.customer_name,
        customer_address: selectedOrder.customer_address,
        total_amount: selectedOrder.total_amount
      }).eq('id', selectedOrder.id);
      
      await supabase.from('invoice_items').delete().eq('invoice_id', selectedOrder.id);
      const toInsert = orderItems.map(item => ({
        invoice_id: selectedOrder.id,
        product_name: item.product_name,
        qty: item.qty,
        unit_price: item.unit_price,
        total: item.total
      }));
      await supabase.from('invoice_items').insert(toInsert);
      
      alert("সফলভাবে আপডেট হয়েছে!");
      setIsEditModalOpen(false);
      fetchOrders(); 
    } catch (e: any) { 
      alert("Error: " + e.message); 
    } finally { 
      setIsSaving(false); 
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-black overflow-x-hidden p-3 md:p-8 gap-4 md:gap-6 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col gap-4 bg-[#0a0a0a] p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-gray-900 shadow-2xl shrink-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <FileText className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className="text-lg md:text-3xl font-black uppercase italic tracking-tighter text-white leading-none">Orders History</h2>
              <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mt-1">
                {filteredOrders.length} Invoices Found
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64 md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
              <input 
                type="text"
                placeholder="SEARCH INVOICE..."
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
                className="bg-black border border-gray-800 w-full py-3 pl-10 pr-4 rounded-xl text-white text-[10px] font-black outline-none focus:border-blue-500/50 uppercase tracking-widest"
              />
            </div>

            <div className="flex items-center gap-3 bg-blue-600/10 p-3 rounded-xl border border-blue-500/30 w-full sm:w-auto justify-center">
              <CalendarIcon size={14} className="text-blue-500" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-blue-400 text-[10px] font-black outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* --- আপডেট করা সামারি কার্ডস (Sales & Collection) --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 bg-white/5 p-3 md:p-4 rounded-xl border border-white/5">
            <Banknote className="text-blue-500 hidden md:block" size={20} />
            <div>
              <p className="text-[7px] md:text-[8px] font-black text-gray-500 uppercase tracking-widest">Total Sales</p>
              <p className="text-sm md:text-xl font-black text-white italic leading-none md:mt-1">{dailyTotalSales.toLocaleString()} TK</p>
            </div>
          </div>

          <div 
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 bg-green-500/10 p-3 md:p-4 rounded-xl border border-green-500/20 cursor-pointer hover:bg-green-500/20 transition-all"
          >
            <Banknote className="text-green-500 hidden md:block" size={20} />
            <div>
              <p className="text-[7px] md:text-[8px] font-black text-green-500 uppercase tracking-widest italic">Collected</p>
              <p className="text-sm md:text-xl font-black text-white italic leading-none md:mt-1">{dailyTotalCollected.toLocaleString()} TK</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 bg-red-500/5 p-3 md:p-4 rounded-xl border border-red-500/10">
            <Hash className="text-red-500 hidden md:block" size={20} />
            <div>
              <p className="text-[7px] md:text-[8px] font-black text-gray-500 uppercase tracking-widest">Pending Due</p>
              <p className="text-sm md:text-xl font-black text-white italic leading-none md:mt-1">{(dailyTotalSales - dailyTotalCollected).toLocaleString()} TK</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 bg-white/5 p-3 md:p-4 rounded-xl border border-white/5">
            <Hash className="text-blue-500 hidden md:block" size={20} />
            <div>
              <p className="text-[7px] md:text-[8px] font-black text-gray-500 uppercase tracking-widest">Invoices</p>
              <p className="text-sm md:text-xl font-black text-white italic leading-none md:mt-1">{filteredOrders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List Container */}
      <div className="flex-1 overflow-y-auto space-y-2 md:space-y-3 custom-scrollbar pr-1">
        {filteredOrders.length > 0 ? filteredOrders.map(order => (
          <div key={order.id} className="bg-[#0a0a0a] border border-gray-900 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-[#111]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                <Hash className="text-gray-700" size={16} />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black text-blue-500 uppercase leading-none">{order.invoice_number}</p>
                <p className="text-base font-black uppercase italic text-gray-200 tracking-tight mt-1 truncate max-w-[180px] md:max-w-none">{order.customer_name}</p>
                <p className="text-[8px] font-bold text-gray-600 uppercase mt-1">
                  {order.total_amount} TK • {formatDisplayDate(order.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t border-gray-900/50 sm:border-0 pt-3 sm:pt-0">
               <button onClick={() => handleViewOrder(order)} className="flex-1 sm:flex-none p-3 bg-white/5 rounded-xl text-green-500 flex justify-center hover:bg-green-500/10"><Eye size={18} /></button>
               <button onClick={() => handleEditOrder(order)} className="flex-1 sm:flex-none p-3 bg-white/5 rounded-xl text-blue-500 flex justify-center hover:bg-blue-500/10"><Edit size={18} /></button>
               <button onClick={() => deleteOrder(order.id)} className="flex-1 sm:flex-none p-3 bg-white/5 rounded-xl text-red-500 flex justify-center hover:bg-red-500/10"><Trash2 size={18} /></button>
            </div>
          </div>
        )) : (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-gray-900 rounded-[2rem]">
            <p className="text-gray-700 font-black uppercase italic text-xs tracking-widest">No matching invoices</p>
          </div>
        )}
      </div>

      {/* --- পেমেন্ট লিস্ট দেখার মডাল (Daily Collection Log) --- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] w-full max-w-md rounded-[2.5rem] border border-gray-900 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-900 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white uppercase italic">Daily Collections</h3>
                <p className="text-[8px] text-gray-500 uppercase tracking-widest">{formatDisplayDate(selectedDate)}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 text-white rounded-full"><X size={18}/></button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
              {payments.length > 0 ? payments.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-transparent hover:border-blue-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg"><Banknote size={16} className="text-green-500" /></div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase leading-none">{p.customer_name}</p>
                      <p className="text-[8px] text-gray-500 uppercase mt-1">{p.payment_method} • {new Date(p.payment_date).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-green-400">৳{p.amount_paid}</p>
                    {p.adjustment_amount > 0 && <p className="text-[8px] text-orange-400">Adj: ৳{p.adjustment_amount}</p>}
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center">
                  <p className="text-gray-600 text-[10px] font-black uppercase italic">No Collections Found Today</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-[#0d0d0d] border-t border-gray-900">
               <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-gray-500 uppercase">Total Collected</p>
                  <p className="text-xl font-black text-green-400 italic">৳{dailyTotalCollected.toLocaleString()}</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL (INVOICE PREVIEW) */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-0 md:p-4">
          <div className="bg-white w-full max-w-2xl h-full md:h-[95vh] md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 md:p-5 bg-gray-50 flex justify-between items-center border-b shrink-0 no-print">
              <span className="text-black font-black uppercase text-[10px] italic flex items-center gap-2">
                <FileText size={14} className="text-blue-600" /> Preview: {selectedOrder.invoice_number}
              </span>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-black text-white rounded-full"><X size={18}/></button>
            </div>
            
            <div id="invoice-container" className="flex-1 overflow-auto bg-gray-200/50 p-2 md:p-10 flex justify-center scroll-smooth">
               <div id="invoice-wrapper" ref={printRef} className="bg-white shadow-2xl w-[800px] min-h-[1120px] origin-top">
                  <InvoicePrint data={selectedOrder} items={orderItems} />
               </div>
            </div>

            <div className="p-4 bg-white border-t flex gap-2 shrink-0 no-print">
              <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
              </button>
              <button onClick={() => handlePrint()} className="flex-1 bg-black text-white py-4 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
                <Printer size={16} /> PRINT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black p-0 md:p-4">
          <div className="bg-[#0a0a0a] w-full h-full md:h-[92vh] md:rounded-[2.5rem] flex flex-col overflow-hidden border border-gray-900">
            <div className="p-4 md:p-6 border-b border-gray-900 flex justify-between items-center bg-[#0d0d0d] shrink-0">
              <h3 className="text-sm md:text-xl font-black italic uppercase text-white">Modify Invoice</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white/5 text-white rounded-lg"><X size={18}/></button>
            </div>
            
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-900 p-4 md:p-6 overflow-y-auto h-[40%] lg:h-full">
                  <div className="sticky top-0 bg-[#0a0a0a] pb-4 z-10">
                    <input 
                      placeholder="SEARCH PRODUCTS..." 
                      className="bg-black border border-gray-800 w-full p-3 rounded-xl text-white text-[10px] uppercase font-black focus:border-blue-500" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {products.filter(p => (p.name_en || "").toLowerCase().includes(searchTerm.toLowerCase())).map((p, i) => (
                       <div key={i} className="p-3 bg-white/5 rounded-xl flex justify-between items-center border border-transparent hover:border-blue-500/30">
                         <div className="text-left overflow-hidden">
                            <p className="text-[9px] font-black text-gray-300 uppercase italic truncate">{p.name_en}</p>
                            <p className="text-[9px] font-bold text-blue-500 mt-1">{p.price} TK</p>
                         </div>
                         <button onClick={() => addNewItem(p)} className="bg-blue-600 p-2 rounded-lg text-white"><Plus size={14}/></button>
                       </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 p-4 md:p-10 flex flex-col overflow-y-auto h-[60%] lg:h-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                        <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest ml-1">Customer Name</label>
                        <input className="bg-black border border-gray-800 w-full p-3 rounded-xl text-white text-xs uppercase font-black focus:border-blue-500/50 outline-none" value={selectedOrder.customer_name} onChange={(e) => setSelectedOrder({...selectedOrder, customer_name: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest ml-1">Delivery Address</label>
                        <input className="bg-black border border-gray-800 w-full p-3 rounded-xl text-white text-xs uppercase font-black focus:border-blue-500/50 outline-none" value={selectedOrder.customer_address || ''} onChange={(e) => setSelectedOrder({...selectedOrder, customer_address: e.target.value})}/>
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto rounded-2xl border border-gray-900 mb-6 bg-black/50">
                      <table className="w-full text-left min-w-[450px]">
                        <thead className="bg-[#0d0d0d] text-[8px] uppercase text-gray-500 font-black border-b border-gray-900 sticky top-0">
                          <tr>
                            <th className="p-4 italic">Product</th>
                            <th className="p-4 text-center">Qty</th>
                            <th className="p-4 text-right">Subtotal</th>
                            <th className="p-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-900/50">
                            {orderItems.map((item, i) => (
                              <tr key={i} className="text-[10px] text-gray-300">
                                 <td className="p-4 uppercase font-black italic text-blue-400 truncate max-w-[120px]">{item.product_name}</td>
                                 <td className="p-4 text-center">
                                    <input type="number" className="w-14 bg-white/5 border border-gray-800 rounded-lg p-1.5 text-center text-[10px] font-black outline-none focus:border-blue-500" value={item.qty} onChange={(e) => {
                                      const qty = parseFloat(e.target.value) || 0;
                                      const updated = [...orderItems];
                                      updated[i].qty = qty;
                                      updated[i].total = Number((qty * updated[i].unit_price).toFixed(2));
                                      setOrderItems(updated);
                                      const total = updated.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
                                      setSelectedOrder((prev: any) => ({ ...prev, total_amount: Number(total.toFixed(2)) }));
                                    }}/>
                                 </td>
                                 <td className="p-4 text-right font-black text-white italic tracking-tight">{item.total.toLocaleString()} TK</td>
                                 <td className="p-4 text-center">
                                    <button onClick={() => {
                                      const updated = orderItems.filter((_, idx) => idx !== i);
                                      setOrderItems(updated);
                                      const total = updated.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
                                      setSelectedOrder((prev: any) => ({ ...prev, total_amount: Number(total.toFixed(2)) }));
                                    }} className="text-red-500/50 hover:text-red-500"><Trash2 size={14}/></button>
                                 </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0d0d0d] p-5 rounded-[1.5rem] md:rounded-[2rem] border border-gray-900 shrink-0 mt-auto">
                    <div className="text-center sm:text-left">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Amount Due</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter mt-1">{selectedOrder.total_amount.toLocaleString()} <span className="text-xs not-italic text-blue-500">TK</span></p>
                    </div>
                    <button onClick={saveUpdatedOrder} disabled={isSaving} className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                       {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save Invoice
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        @media print { .no-print { display: none !important; } }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
      `}</style>
    </div>
  );
}