'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useReactToPrint } from 'react-to-print';
import InvoicePrint from './InvoicePrint';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Eye, Edit, Trash2, FileText, Printer, X, Save, Search, Plus, Download, Calendar as CalendarIcon, Loader2, Hash, Banknote } from 'lucide-react';

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
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  const getTodayString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const printRef = useRef<any>(null);

  // প্রিন্ট হ্যান্ডলার
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice_${selectedOrder?.invoice_number || 'Order'}`,
  });

  // পিডিএফ ডাউনলোড হ্যান্ডলার
  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element || isDownloading) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          const invoiceEl = clonedDoc.body;
          invoiceEl.style.colorScheme = 'light';
          invoiceEl.querySelectorAll('*').forEach((el: any) => {
            el.style.colorInterpolationFilters = 'sRGB';
          });
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${selectedOrder?.invoice_number || 'Order'}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("সফটওয়্যারটি আপনার ব্রাউজারের কালার সাপোর্ট করতে পারছে না।");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [selectedDate]);

  const fetchOrders = async () => {
    const start = `${selectedDate}T00:00:00.000Z`;
    const end = `${selectedDate}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });
      
    if (error) console.error(error);
    setOrders(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    setProducts(data || []);
    setFilteredProducts(data || []);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
  };

  const filteredOrders = orders.filter(order => 
    (order.invoice_number?.toLowerCase() || "").includes(orderSearchTerm.toLowerCase()) ||
    (order.customer_name?.toLowerCase() || "").includes(orderSearchTerm.toLowerCase())
  );

  const dailyTotal = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const handleViewOrder = async (order: any) => {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', order.id);
    setSelectedOrder(order);
    setOrderItems(items || []);
    setIsModalOpen(true);
  };

  const handleDirectPrint = async (order: any) => {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', order.id);
    if (!items) return;
    setSelectedOrder(order);
    setOrderItems(items);
    setTimeout(() => { if (printRef.current) handlePrint(); }, 500);
  };

  const handleEditOrder = async (order: any) => {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', order.id);
    setSelectedOrder({ ...order }); 
    setOrderItems(items || []);
    setIsEditModalOpen(true);
  };

  const handleSearchProducts = (term: string) => {
    setSearchTerm(term);
    const filtered = products.filter(p => (p.name_en || p.name || "").toLowerCase().includes(term.toLowerCase()));
    setFilteredProducts(filtered);
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
    recalculateTotal(updated);
  };

  const removeItem = (index: number) => {
    const updated = orderItems.filter((_, i) => i !== index);
    setOrderItems(updated);
    recalculateTotal(updated);
  };

  const updateItemQty = (index: number, val: string) => {
    const qty = parseFloat(val) || 0;
    const updated = [...orderItems];
    updated[index].qty = qty;
    updated[index].total = Number((qty * updated[index].unit_price).toFixed(2));
    setOrderItems(updated);
    recalculateTotal(updated);
  };

  const recalculateTotal = (items: any[]) => {
    const total = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setSelectedOrder((prev: any) => ({ ...prev, total_amount: Number(total.toFixed(2)) }));
  };

  const saveUpdatedOrder = async () => {
    if (orderItems.length === 0) return alert("অর্ডার লিস্ট খালি!");
    setIsSaving(true);
    try {
      const { error: invErr } = await supabase
        .from('invoices')
        .update({
          customer_name: selectedOrder.customer_name,
          customer_address: selectedOrder.customer_address,
          total_amount: selectedOrder.total_amount
        })
        .eq('id', selectedOrder.id);
      if (invErr) throw invErr;
      await supabase.from('invoice_items').delete().eq('invoice_id', selectedOrder.id);
      const toInsert = orderItems.map(item => ({
        invoice_id: selectedOrder.id,
        product_name: item.product_name,
        qty: item.qty,
        unit_price: item.unit_price,
        total: item.total
      }));
      const { error: insErr } = await supabase.from('invoice_items').insert(toInsert);
      if (insErr) throw insErr;
      alert("সফলভাবে আপডেট হয়েছে!");
      setIsEditModalOpen(false);
      fetchOrders(); 
    } catch (e: any) { 
      alert("Error saving: " + e.message); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const deleteOrder = async (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিত?")) {
      await supabase.from('invoice_items').delete().eq('invoice_id', id);
      await supabase.from('invoices').delete().eq('id', id);
      fetchOrders();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden p-8 gap-6 font-sans">
      
      {/* Header & Search */}
      <div className="flex flex-col gap-6 bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-gray-900 shadow-2xl shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <FileText className="text-blue-500" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Orders History</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                  Matches: <span className="text-blue-500 ml-1">{filteredOrders.length} Invoices Found</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input 
                type="text"
                placeholder="SEARCH INVOICE OR CLIENT..."
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
                className="bg-black border border-gray-800 w-full py-4 pl-12 pr-4 rounded-2xl text-white text-[10px] font-black outline-none focus:border-blue-500/50 uppercase tracking-widest"
              />
            </div>

            <div className="flex items-center gap-3 bg-blue-600/10 p-4 px-6 rounded-2xl border border-blue-500/30">
              <CalendarIcon size={16} className="text-blue-500" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-blue-400 text-xs font-black outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards: Total Sales & Total Orders Count */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Sales Card */}
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
              <Banknote className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Total Sales (Selected Filters)</p>
              <p className="text-2xl font-black text-white italic">
                {dailyTotal.toLocaleString()} <span className="text-xs text-green-500 not-italic uppercase ml-1">BDT</span>
              </p>
            </div>
          </div>

          {/* NEW: Total Orders Card (Calendar Replacement Design) */}
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Hash className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Total Orders on {formatDisplayDate(selectedDate)}</p>
              <p className="text-2xl font-black text-white italic">
                {filteredOrders.length} <span className="text-xs text-blue-500 not-italic uppercase ml-1">Invoices</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {filteredOrders.length > 0 ? filteredOrders.map(order => (
          <div key={order.id} className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-[2rem] flex justify-between items-center group transition-all hover:bg-[#111] hover:border-blue-500/50">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                <Hash className="text-gray-700 group-hover:text-blue-500" size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-blue-500 uppercase tracking-widest">{order.invoice_number}</p>
                <p className="text-xl font-black uppercase italic text-gray-200 tracking-tight">{order.customer_name}</p>
                <p className="text-[10px] font-bold text-gray-600 uppercase mt-1">
                  Amount: {order.total_amount} TK | {formatDisplayDate(order.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
               <button onClick={() => handleViewOrder(order)} className="p-4 bg-white/5 rounded-2xl text-green-500 hover:bg-green-500/10"><Eye size={20} /></button>
               <button onClick={() => handleEditOrder(order)} className="p-4 bg-white/5 rounded-2xl text-blue-500 hover:bg-blue-500/10"><Edit size={20} /></button>
               <button onClick={() => handleDirectPrint(order)} className="p-4 bg-white/5 rounded-2xl text-gray-400 hover:bg-white/10"><Printer size={20} /></button>
               <button onClick={() => deleteOrder(order.id)} className="p-4 bg-white/5 rounded-2xl text-red-500 hover:bg-red-500/10"><Trash2 size={20} /></button>
            </div>
          </div>
        )) : (
          <div className="h-64 flex flex-col items-center justify-center bg-[#0a0a0a] rounded-[3rem] border border-dashed border-gray-900">
            <Search className="text-gray-800 mb-4" size={48} />
            <p className="text-gray-700 font-black uppercase italic tracking-widest">No matching invoices found</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col">
            <div className="p-6 bg-gray-50 flex justify-between items-center border-b">
              <span className="text-black font-black uppercase text-xs italic tracking-widest">Sealand Agro - Invoice Preview</span>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-200 p-8 flex justify-center no-scrollbar">
               <div className="bg-white shadow-2xl h-fit">
                  <div ref={printRef} style={{ colorScheme: 'light' }}>
                      <InvoicePrint data={selectedOrder} items={orderItems} />
                  </div>
               </div>
            </div>

            <div className="p-8 bg-gray-50 flex justify-end gap-4 border-t">
              <button 
                onClick={handleDownloadPDF} 
                disabled={isDownloading} 
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[11px] disabled:opacity-50"
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF
              </button>
              <button onClick={() => handlePrint()} className="bg-black text-white px-10 py-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[11px]"><Printer size={16} /> Print Copy</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-4">
          <div className="bg-[#0a0a0a] border border-gray-900 w-full max-w-[95vw] h-[92vh] rounded-[3rem] flex flex-col overflow-hidden">
            <div className="p-8 border-b border-gray-900 flex justify-between items-center bg-[#0d0d0d]">
              <h3 className="text-2xl font-black italic uppercase text-white">Modify Invoice</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 text-white rounded-2xl"><X size={24}/></button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
                <div className="w-1/3 border-r border-gray-900 p-8 overflow-y-auto custom-scrollbar">
                  <div className="relative mb-8">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input placeholder="Search products..." className="bg-black border border-gray-800 w-full py-5 pl-14 pr-6 rounded-[1.5rem] text-white text-sm font-bold outline-none focus:border-blue-500/50" value={searchTerm} onChange={(e) => handleSearchProducts(e.target.value)}/>
                  </div>
                  <div className="space-y-3">
                    {filteredProducts.map((p, index) => (
                       <div key={index} className="p-5 bg-white/5 border border-gray-900 rounded-[1.5rem] flex justify-between items-center hover:border-blue-500/40">
                         <div className="text-left">
                           <p className="text-xs font-black text-gray-300 uppercase italic">{p.name_en || p.name}</p>
                           <p className="text-[10px] text-blue-500 font-black mt-1">{p.price} TK</p>
                         </div>
                         <button onClick={() => addNewItem(p)} className="bg-blue-600 p-3 rounded-xl text-white"><Plus size={18}/></button>
                       </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 p-10 flex flex-col overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-600">Client Identity</label>
                       <input className="bg-black border border-gray-800 w-full p-5 rounded-2xl text-white font-black italic uppercase outline-none" value={selectedOrder.customer_name} onChange={(e) => setSelectedOrder({...selectedOrder, customer_name: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-600">Delivery Destination</label>
                       <input className="bg-black border border-gray-800 w-full p-5 rounded-2xl text-white font-black italic uppercase outline-none" value={selectedOrder.customer_address || ''} onChange={(e) => setSelectedOrder({...selectedOrder, customer_address: e.target.value})}/>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto border border-gray-900 rounded-[2.5rem] bg-black">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-[#0d0d0d] text-[10px] uppercase text-gray-600 font-black tracking-[0.2em] border-b border-gray-900">
                          <tr>
                            <th className="px-8 py-6">Cargo Description</th>
                            <th className="px-8 py-6 text-center">Quantity</th>
                            <th className="px-8 py-6 text-right">Sub-Total</th>
                            <th className="px-8 py-6"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-900/50">
                            {orderItems.map((item, i) => (
                              <tr key={i} className="hover:bg-white/5">
                                 <td className="px-8 py-6 uppercase italic text-gray-300 font-black">{item.product_name}</td>
                                 <td className="px-8 py-6 text-center">
                                    <input type="number" step="any" className="w-24 bg-white/5 border border-gray-800 rounded-xl p-3 text-center text-white font-black outline-none" value={item.qty} onChange={(e) => updateItemQty(i, e.target.value)}/>
                                 </td>
                                 <td className="px-8 py-6 text-right font-black text-blue-500">{item.total} TK</td>
                                 <td className="px-8 py-6 text-center">
                                    <button onClick={() => removeItem(i)} className="text-red-500"><Trash2 size={20}/></button>
                                 </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                  </div>

                  <div className="mt-10 flex justify-between items-center bg-[#0d0d0d] border border-gray-900 p-10 rounded-[3rem]">
                    <div className="text-left">
                       <p className="text-[10px] text-gray-600 uppercase font-black italic">Net Payable Amount</p>
                       <p className="text-5xl font-black text-white italic tracking-tighter">{selectedOrder.total_amount} <span className="text-base text-blue-500 uppercase not-italic">TK</span></p>
                    </div>
                    <button onClick={saveUpdatedOrder} disabled={isSaving} className="bg-blue-600 text-white px-12 py-5 rounded-2xl flex items-center gap-3 font-black uppercase text-xs tracking-widest disabled:opacity-50">
                       {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} {isSaving ? "Saving..." : "Commit Changes"}
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Container for Print & PDF */}
      <div className="hidden">
        <div ref={printRef}>
          {selectedOrder && (
            <div style={{ colorScheme: 'light', background: 'white' }}>
              <InvoicePrint data={selectedOrder} items={orderItems} />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
      `}</style>
    </div>
  );
}