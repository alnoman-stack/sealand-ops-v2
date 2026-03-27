// 'use client'
// import { useState, useEffect, useRef } from 'react';
// import { supabase } from '@/lib/supabase';
// import { useReactToPrint } from 'react-to-print';
// import InvoicePrint from './InvoicePrint';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import { Eye, Edit, Trash2, FileText, Printer, X, Save, Search, Plus, Download, Calendar as CalendarIcon, Loader2, ChevronRight, Hash, Calendar, Banknote } from 'lucide-react';

// export default function OrdersView() {
//   const [orders, setOrders] = useState<any[]>([]);
//   const [selectedOrder, setSelectedOrder] = useState<any>(null);
//   const [orderItems, setOrderItems] = useState<any[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
  
//   // সার্চ স্টেট
//   const [searchTerm, setSearchTerm] = useState(''); // প্রোডাক্ট সার্চের জন্য (Edit Modal)
//   const [orderSearchTerm, setOrderSearchTerm] = useState(''); // মেইন অর্ডার লিস্ট সার্চের জন্য
  
//   const [products, setProducts] = useState<any[]>([]);
//   const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

//   const getTodayString = () => {
//     const now = new Date();
//     const offset = now.getTimezoneOffset() * 60000;
//     return new Date(now.getTime() - offset).toISOString().split('T')[0];
//   };

//   const [selectedDate, setSelectedDate] = useState(getTodayString());
//   const printRef = useRef<any>(null);

//   const handlePrint = useReactToPrint({
//     contentRef: printRef,
//     documentTitle: `Invoice_${selectedOrder?.invoice_number || 'Order'}`,
//   });

//   const handleDownloadPDF = async () => {
//     const element = printRef.current;
//     if (!element || isDownloading) return;
//     setIsDownloading(true);
//     try {
//       const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
//       const imgData = canvas.toDataURL('image/jpeg', 0.8);
//       const pdf = new jsPDF('p', 'mm', 'a4');
//       const pdfWidth = pdf.internal.pageSize.getWidth();
//       const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
//       pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
//       pdf.save(`Invoice_${selectedOrder?.invoice_number}.pdf`);
//     } catch (error) {
//       alert("পিডিএফ তৈরি করতে সমস্যা হয়েছে।");
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOrders();
//     fetchProducts();
//   }, [selectedDate]);

//   const fetchOrders = async () => {
//     const start = `${selectedDate}T00:00:00.000Z`;
//     const end = `${selectedDate}T23:59:59.999Z`;

//     const { data, error } = await supabase
//       .from('invoices')
//       .select('*')
//       .gte('created_at', start)
//       .lte('created_at', end)
//       .order('created_at', { ascending: false });
      
//     if (error) console.error(error);
//     setOrders(data || []);
//   };

//   const fetchProducts = async () => {
//     const { data, error } = await supabase.from('products').select('*');
//     setProducts(data || []);
//     setFilteredProducts(data || []);
//   };

//   const formatDisplayDate = (dateStr: string) => {
//     if (!dateStr) return "N/A";
//     const datePart = dateStr.split('T')[0];
//     const [year, month, day] = datePart.split('-');
//     const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     return `${day} ${months[parseInt(month) - 1]} ${year}`;
//   };

//   // ইনভয়েজ নম্বর বা কাস্টমারের নাম দিয়ে ফিল্টার করার লজিক
//   const filteredOrders = orders.filter(order => 
//     (order.invoice_number?.toLowerCase() || "").includes(orderSearchTerm.toLowerCase()) ||
//     (order.customer_name?.toLowerCase() || "").includes(orderSearchTerm.toLowerCase())
//   );

//   // ঐ দিনের টোটাল সেল ক্যালকুলেশন
//   const dailyTotal = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

//   const handleViewOrder = async (order: any) => {
//     const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', order.id);
//     setSelectedOrder(order);
//     setOrderItems(items || []);
//     setIsModalOpen(true);
//   };

//   const handleDirectPrint = async (order: any) => {
//     const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', order.id);
//     if (!items) return;
//     setSelectedOrder(order);
//     setOrderItems(items);
//     setTimeout(() => { if (printRef.current) handlePrint(); }, 500);
//   };

//   const handleEditOrder = async (order: any) => {
//     const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', order.id);
//     setSelectedOrder({ ...order }); 
//     setOrderItems(items || []);
//     setIsEditModalOpen(true);
//   };

//   const handleSearchProducts = (term: string) => {
//     setSearchTerm(term);
//     const filtered = products.filter(p => (p.name_en || p.name || "").toLowerCase().includes(term.toLowerCase()));
//     setFilteredProducts(filtered);
//   };

//   const addNewItem = (p: any) => {
//     const name = p.name_en || p.name || "Unknown Product";
//     const price = p.price || 0;
//     const existingIndex = orderItems.findIndex(item => item.product_name === name);
//     let updated;
//     if (existingIndex > -1) {
//       updated = [...orderItems];
//       updated[existingIndex].qty += 1;
//       updated[existingIndex].total = Number((updated[existingIndex].qty * updated[existingIndex].unit_price).toFixed(2));
//     } else {
//       updated = [...orderItems, { product_name: name, qty: 1, unit_price: price, total: price }];
//     }
//     setOrderItems(updated);
//     recalculateTotal(updated);
//   };

//   const removeItem = (index: number) => {
//     const updated = orderItems.filter((_, i) => i !== index);
//     setOrderItems(updated);
//     recalculateTotal(updated);
//   };

//   const updateItemQty = (index: number, val: string) => {
//     const qty = parseFloat(val) || 0;
//     const updated = [...orderItems];
//     updated[index].qty = qty;
//     updated[index].total = Number((qty * updated[index].unit_price).toFixed(2));
//     setOrderItems(updated);
//     recalculateTotal(updated);
//   };

//   const recalculateTotal = (items: any[]) => {
//     const total = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
//     setSelectedOrder((prev: any) => ({ ...prev, total_amount: Number(total.toFixed(2)) }));
//   };

//   const saveUpdatedOrder = async () => {
//     if (orderItems.length === 0) return alert("অর্ডার লিস্ট খালি!");
//     setIsSaving(true);
//     try {
//       const { error: invErr } = await supabase
//         .from('invoices')
//         .update({
//           customer_name: selectedOrder.customer_name,
//           customer_address: selectedOrder.customer_address,
//           total_amount: selectedOrder.total_amount
//         })
//         .eq('id', selectedOrder.id);
//       if (invErr) throw invErr;
//       await supabase.from('invoice_items').delete().eq('invoice_id', selectedOrder.id);
//       const toInsert = orderItems.map(item => ({
//         invoice_id: selectedOrder.id,
//         product_name: item.product_name,
//         qty: item.qty,
//         unit_price: item.unit_price,
//         total: item.total
//       }));
//       const { error: insErr } = await supabase.from('invoice_items').insert(toInsert);
//       if (insErr) throw insErr;
//       alert("সফলভাবে আপডেট হয়েছে!");
//       setIsEditModalOpen(false);
//       fetchOrders(); 
//     } catch (e: any) { 
//       alert("Error saving: " + e.message); 
//     } finally { 
//       setIsSaving(false); 
//     }
//   };

//   const deleteOrder = async (id: string) => {
//     if (window.confirm("আপনি কি নিশ্চিত?")) {
//       await supabase.from('invoice_items').delete().eq('invoice_id', id);
//       await supabase.from('invoices').delete().eq('id', id);
//       fetchOrders();
//     }
//   };

//   return (
//     <div className="h-screen flex flex-col bg-black overflow-hidden p-8 gap-6 animate-in fade-in duration-700 font-sans">
      
//       {/* Header & Main Search */}
//       <div className="flex flex-col gap-6 bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-gray-900 shadow-2xl shrink-0">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//           <div className="flex items-center gap-5">
//             <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
//               <FileText className="text-blue-500" size={32} />
//             </div>
//             <div>
//               <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Orders History</h2>
//               <div className="flex items-center gap-2 mt-1">
//                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
//                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
//                   Total Records: <span className="text-blue-500 ml-1">{filteredOrders.length} Invoices</span>
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="flex items-center gap-4 w-full md:w-auto">
//             {/* Search Box */}
//             <div className="relative flex-1 md:w-80">
//               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
//               <input 
//                 type="text"
//                 placeholder="SEARCH INVOICE OR CLIENT..."
//                 value={orderSearchTerm}
//                 onChange={(e) => setOrderSearchTerm(e.target.value)}
//                 className="bg-black border border-gray-800 w-full py-4 pl-12 pr-4 rounded-2xl text-white text-[10px] font-black outline-none focus:border-blue-500/50 transition-all uppercase tracking-widest shadow-inner"
//               />
//             </div>

//             {/* Date Picker */}
//             <div className="flex items-center gap-3 bg-blue-600/10 p-4 px-6 rounded-2xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all hover:border-blue-500/50">
//               <CalendarIcon size={16} className="text-blue-500" />
//               <input 
//                 type="date" 
//                 value={selectedDate}
//                 onChange={(e) => setSelectedDate(e.target.value)}
//                 className="bg-transparent text-blue-400 text-xs font-black outline-none cursor-pointer uppercase tracking-widest [color-scheme:dark]"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Summary Card - New Feature */}
//         <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
//           <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
//             <Banknote className="text-green-500" size={24} />
//           </div>
//           <div>
//             <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Daily Revenue Summary</p>
//             <p className="text-2xl font-black text-white italic">
//               {dailyTotal.toLocaleString()} <span className="text-xs text-green-500 not-italic uppercase ml-1">BDT Collected</span>
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Orders List Area */}
//       <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
//         {filteredOrders.length > 0 ? filteredOrders.map(order => (
//           <div 
//             key={order.id} 
//             className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-[2rem] flex justify-between items-center group transition-all duration-300 hover:bg-[#111] hover:border-blue-500/50"
//           >
//             <div className="flex items-center gap-6">
//               <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
//                 <Hash className="text-gray-700 group-hover:text-blue-500" size={20} />
//               </div>
//               <div className="text-left">
//                 <div className="flex items-center gap-3">
//                   <p className="text-xs font-black text-blue-500 uppercase tracking-widest">{order.invoice_number}</p>
//                   <span className="text-[9px] px-2 py-1 bg-white/5 border border-white/10 rounded-md text-gray-400 font-black uppercase">
//                      {formatDisplayDate(order.created_at)}
//                   </span>
//                 </div>
//                 <p className="text-xl font-black uppercase italic text-gray-200 group-hover:text-white transition-colors tracking-tight">
//                   {order.customer_name}
//                 </p>
//                 <p className="text-[10px] font-bold text-gray-600 uppercase mt-1 tracking-widest">
//                   Total Payable: <span className="text-gray-400">{order.total_amount} TK</span>
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-2">
//                <button onClick={() => handleViewOrder(order)} className="p-4 bg-white/5 rounded-2xl text-green-500 hover:bg-green-500/10 transition-all shadow-sm"><Eye size={20} /></button>
//                <button onClick={() => handleEditOrder(order)} className="p-4 bg-white/5 rounded-2xl text-blue-500 hover:bg-blue-500/10 transition-all shadow-sm"><Edit size={20} /></button>
//                <button onClick={() => handleDirectPrint(order)} className="p-4 bg-white/5 rounded-2xl text-gray-400 hover:bg-white/10 transition-all shadow-sm"><Printer size={20} /></button>
//                <button onClick={() => deleteOrder(order.id)} className="p-4 bg-white/5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all shadow-sm"><Trash2 size={20} /></button>
//             </div>
//           </div>
//         )) : (
//           <div className="h-64 flex flex-col items-center justify-center bg-[#0a0a0a] rounded-[3rem] border border-dashed border-gray-900">
//             <Search className="text-gray-800 mb-4" size={48} />
//             <p className="text-gray-700 font-black uppercase italic tracking-widest">No matching invoices found</p>
//           </div>
//         )}
//       </div>

//       {/* Modals are kept same as they were, just updated Search handler for Products in Edit Modal */}
//       {/* View Modal */}
//       {isModalOpen && selectedOrder && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
//           <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
//             <div className="p-6 bg-gray-50 flex justify-between items-center border-b">
//               <div className="flex items-center gap-3">
//                 <span className="text-black font-black uppercase text-xs tracking-widest italic">Digital Invoice Preview</span>
//                 <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
//                     Dated: {formatDisplayDate(selectedOrder.created_at)}
//                 </span>
//               </div>
//               <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full hover:bg-red-600 transition-colors"><X size={20}/></button>
//             </div>
//             <div className="flex-1 overflow-y-auto bg-gray-200 p-8 flex justify-center no-scrollbar">
//                 <div className="bg-white shadow-2xl origin-top scale-[0.55] sm:scale-[0.85] md:scale-100 h-fit rounded-sm">
//                    <InvoicePrint ref={printRef} data={selectedOrder} items={orderItems} />
//                 </div>
//             </div>
//             <div className="p-8 bg-gray-50 flex justify-end gap-4 border-t">
//               <button onClick={handleDownloadPDF} disabled={isDownloading} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[11px] tracking-widest shadow-xl disabled:opacity-50">
//                 {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF
//               </button>
//               <button onClick={() => handlePrint()} className="bg-black hover:bg-gray-800 text-white px-10 py-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[11px] tracking-widest transition-all shadow-xl"><Printer size={16} /> Print Copy</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Modal */}
//       {isEditModalOpen && selectedOrder && (
//         <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-4">
//           <div className="bg-[#0a0a0a] border border-gray-900 w-full max-w-[95vw] h-[92vh] rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
//             <div className="p-8 border-b border-gray-900 flex justify-between items-center bg-[#0d0d0d]">
//               <div>
//                 <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Modify Invoice</h3>
//                 <div className="flex items-center gap-4 mt-1">
//                     <p className="text-[10px] text-blue-500 font-bold tracking-widest uppercase">{selectedOrder.invoice_number}</p>
//                     <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
//                         Original Date: {formatDisplayDate(selectedOrder.created_at)}
//                     </span>
//                 </div>
//               </div>
//               <button onClick={() => setIsEditModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 text-white rounded-2xl hover:bg-red-600 transition-colors"><X size={24}/></button>
//             </div>
            
//             <div className="flex-1 flex overflow-hidden">
//                 <div className="w-1/3 border-r border-gray-900 p-8 overflow-y-auto bg-black/40 custom-scrollbar">
//                   <div className="relative mb-8">
//                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
//                     <input placeholder="Search products..." className="bg-black border border-gray-800 w-full py-5 pl-14 pr-6 rounded-[1.5rem] text-white text-sm font-bold outline-none focus:border-blue-500/50 transition-all shadow-inner" value={searchTerm} onChange={(e) => handleSearchProducts(e.target.value)}/>
//                   </div>
//                   <div className="space-y-3">
//                     {filteredProducts.map((p, index) => (
//                        <div key={p.id || index} className="p-5 bg-white/5 border border-gray-900 rounded-[1.5rem] flex justify-between items-center hover:border-blue-500/40 hover:bg-white/10 transition-all group">
//                          <div className="text-left">
//                            <p className="text-xs font-black text-gray-300 uppercase italic">{p.name_en || p.name}</p>
//                            <p className="text-[10px] text-blue-500 font-black mt-1 uppercase tracking-widest">{p.price} TK/UNIT</p>
//                          </div>
//                          <button onClick={() => addNewItem(p)} className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl text-white shadow-lg active:scale-90 transition-transform"><Plus size={18}/></button>
//                        </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="flex-1 p-10 flex flex-col bg-transparent overflow-y-auto custom-scrollbar">
//                   <div className="grid grid-cols-2 gap-8 mb-10 text-left">
//                     <div className="space-y-2">
//                        <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-1">Client Identity</label>
//                        <input className="bg-black border border-gray-800 w-full p-5 rounded-2xl text-white font-black italic uppercase outline-none focus:border-blue-500/50 shadow-inner" value={selectedOrder.customer_name} onChange={(e) => setSelectedOrder({...selectedOrder, customer_name: e.target.value})}/>
//                     </div>
//                     <div className="space-y-2">
//                        <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-1">Delivery Destination</label>
//                        <input className="bg-black border border-gray-800 w-full p-5 rounded-2xl text-white font-black italic uppercase outline-none focus:border-blue-500/50 shadow-inner" value={selectedOrder.customer_address || ''} onChange={(e) => setSelectedOrder({...selectedOrder, customer_address: e.target.value})} placeholder="Location Details..."/>
//                     </div>
//                   </div>

//                   <div className="flex-1 overflow-y-auto border border-gray-900 rounded-[2.5rem] bg-black shadow-inner">
//                       <table className="w-full text-left border-collapse">
//                         <thead className="sticky top-0 bg-[#0d0d0d] text-[10px] uppercase text-gray-600 font-black tracking-[0.2em] border-b border-gray-900 z-10">
//                           <tr>
//                             <th className="px-8 py-6 italic">Cargo Description</th>
//                             <th className="px-8 py-6 text-center italic">Quantity</th>
//                             <th className="px-8 py-6 text-right italic">Sub-Total</th>
//                             <th className="px-8 py-6"></th>
//                           </tr>
//                         </thead>
//                         <tbody className="divide-y divide-gray-900/50">
//                             {orderItems.map((item, i) => (
//                               <tr key={i} className="hover:bg-white/5 transition-colors group">
//                                  <td className="px-8 py-6 uppercase italic text-gray-300 font-black tracking-tight">{item.product_name}</td>
//                                  <td className="px-8 py-6 text-center">
//                                     <input type="number" step="any" className="w-24 bg-white/5 border border-gray-800 rounded-xl p-3 text-center text-white font-black outline-none focus:border-blue-500/50" value={item.qty} onChange={(e) => updateItemQty(i, e.target.value)}/>
//                                  </td>
//                                  <td className="px-8 py-6 text-right font-black text-blue-500 tracking-tighter text-lg">{item.total} TK</td>
//                                  <td className="px-8 py-6 text-center">
//                                     <button onClick={() => removeItem(i)} className="p-3 text-gray-800 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
//                                  </td>
//                               </tr>
//                             ))}
//                         </tbody>
//                       </table>
//                   </div>

//                   <div className="mt-10 flex justify-between items-center bg-[#0d0d0d] border border-gray-900 p-10 rounded-[3rem] shadow-2xl">
//                     <div className="text-left">
//                        <p className="text-[10px] text-gray-600 uppercase font-black tracking-[0.3em] mb-2 italic">Net Payable Amount</p>
//                        <p className="text-5xl font-black text-white italic tracking-tighter">
//                          {selectedOrder.total_amount} <span className="text-base text-blue-500 ml-2 uppercase not-italic">Taka</span>
//                        </p>
//                     </div>
//                     <button onClick={saveUpdatedOrder} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-2xl flex items-center gap-3 font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50">
//                        {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
//                        {isSaving ? "Syncing..." : "Commit Changes"}
//                     </button>
//                   </div>
//                 </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Hidden PDF Container */}
//       <div className="hidden">
//         <div ref={printRef}>
//           {selectedOrder && <InvoicePrint data={selectedOrder} items={orderItems} />}
//         </div>
//       </div>

//       <style jsx>{`
//         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
//         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
//         .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
//       `}</style>
//     </div>
//   );
// }



'use client'
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useReactToPrint } from 'react-to-print';
import InvoicePrint from './InvoicePrint';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Eye, Edit, Trash2, FileText, Printer, X, Save, Search, Plus, Download, Calendar as CalendarIcon, Loader2, Hash, Banknote } from 'lucide-react';

export default function OrdersView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // সার্চ স্টেট
  const [searchTerm, setSearchTerm] = useState(''); // প্রোডাক্ট সার্চের জন্য (Edit Modal)
  const [orderSearchTerm, setOrderSearchTerm] = useState(''); // মেইন ইনভয়েস সার্চের জন্য
  
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  const getTodayString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const printRef = useRef<any>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice_${selectedOrder?.invoice_number || 'Order'}`,
  });

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element || isDownloading) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${selectedOrder?.invoice_number}.pdf`);
    } catch (error) {
      alert("পিডিএফ তৈরি করতে সমস্যা হয়েছে।");
    } finally {
      setIsDownloading(false);
    }
  };

  // স্মার্ট সার্চ: তারিখ অথবা সার্চ টার্ম পরিবর্তন হলে ডাটা ফেচ হবে
  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [selectedDate, orderSearchTerm]);

  const fetchOrders = async () => {
    let query = supabase.from('invoices').select('*');

    if (orderSearchTerm.trim() === '') {
      // সার্চ বক্স খালি থাকলে নির্দিষ্ট তারিখের ডাটা আনবে
      const start = `${selectedDate}T00:00:00.000Z`;
      const end = `${selectedDate}T23:59:59.999Z`;
      query = query.gte('created_at', start).lte('created_at', end);
    } else {
      // সার্চ বক্সে কিছু থাকলে সব ডেট থেকে খুঁজবে
      query = query.or(`invoice_number.ilike.%${orderSearchTerm}%,customer_name.ilike.%${orderSearchTerm}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
    if (error) console.error(error);
    setOrders(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
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

  // সামারি ক্যালকুলেশন
  const totalAmountSum = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  // অ্যাকশন হ্যান্ডলার্স
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

  // প্রোডাক্ট এডিট লজিক (Modal এর ভেতর)
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
      await supabase.from('invoice_items').insert(toInsert);
      alert("সফলভাবে আপডেট হয়েছে!");
      setIsEditModalOpen(false);
      fetchOrders(); 
    } catch (e: any) { alert("Error: " + e.message); } finally { setIsSaving(false); }
  };

  const deleteOrder = async (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিত?")) {
      await supabase.from('invoice_items').delete().eq('invoice_id', id);
      await supabase.from('invoices').delete().eq('id', id);
      fetchOrders();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden p-8 gap-6 animate-in fade-in duration-700 font-sans">
      
      {/* Header & Smart Search */}
      <div className="flex flex-col gap-6 bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-gray-900 shadow-2xl shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <FileText className="text-blue-500" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Orders History</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                   {orderSearchTerm ? 'Search Mode Active' : `Showing: ${formatDisplayDate(selectedDate)}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Main Search Input */}
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input 
                type="text"
                placeholder="SEARCH INVOICE # OR CLIENT..."
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
                className="bg-black border border-gray-800 w-full py-4 pl-12 pr-4 rounded-2xl text-white text-[10px] font-black outline-none focus:border-blue-500/50 transition-all uppercase tracking-widest shadow-inner placeholder:text-gray-700"
              />
              {orderSearchTerm && (
                <button onClick={() => setOrderSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Date Picker */}
            <div className={`flex items-center gap-3 bg-blue-600/10 p-4 px-6 rounded-2xl border border-blue-500/30 transition-all ${orderSearchTerm ? 'opacity-20 pointer-events-none' : 'hover:border-blue-500/50'}`}>
              <CalendarIcon size={16} className="text-blue-500" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-blue-400 text-xs font-black outline-none cursor-pointer uppercase tracking-widest [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Daily Summary Card */}
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
            <Banknote className="text-green-500" size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">{orderSearchTerm ? 'Search Result Value' : 'Daily Revenue Summary'}</p>
            <p className="text-2xl font-black text-white italic">
              {totalAmountSum.toLocaleString()} <span className="text-xs text-green-500 not-italic uppercase ml-1">BDT</span>
            </p>
          </div>
        </div>
      </div>

      {/* Orders List Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {orders.length > 0 ? orders.map((order) => (
          <div 
            key={order.id} 
            className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-[2rem] flex justify-between items-center group transition-all duration-300 hover:bg-[#111] hover:border-blue-500/50"
          >
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                <Hash className="text-gray-700 group-hover:text-blue-500" size={20} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-black text-blue-500 uppercase tracking-widest">{order.invoice_number}</p>
                  <span className="text-[9px] px-2 py-1 bg-white/5 border border-white/10 rounded-md text-gray-400 font-black uppercase">
                     {formatDisplayDate(order.created_at)}
                  </span>
                </div>
                <p className="text-xl font-black uppercase italic text-gray-200 group-hover:text-white transition-colors tracking-tight">
                  {order.customer_name}
                </p>
                <p className="text-[10px] font-bold text-gray-600 uppercase mt-1 tracking-widest">
                  Payable: <span className="text-gray-400">{order.total_amount} TK</span>
                </p>
              </div>
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-2">
               <button onClick={() => handleViewOrder(order)} className="p-4 bg-white/5 rounded-2xl text-green-500 hover:bg-green-500/10 transition-all active:scale-90"><Eye size={20} /></button>
               <button onClick={() => handleEditOrder(order)} className="p-4 bg-white/5 rounded-2xl text-blue-500 hover:bg-blue-500/10 transition-all active:scale-90"><Edit size={20} /></button>
               <button onClick={() => handleDirectPrint(order)} className="p-4 bg-white/5 rounded-2xl text-gray-400 hover:bg-white/10 transition-all active:scale-90"><Printer size={20} /></button>
               <button onClick={() => deleteOrder(order.id)} className="p-4 bg-white/5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all active:scale-90"><Trash2 size={20} /></button>
            </div>
          </div>
        )) : (
          <div className="h-64 flex flex-col items-center justify-center bg-[#0a0a0a] rounded-[3rem] border border-dashed border-gray-900">
            <p className="text-gray-700 font-black uppercase italic tracking-widest">No matching cargo records found</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 bg-gray-50 flex justify-between items-center border-b">
              <span className="text-black font-black uppercase text-xs tracking-widest italic">Invoice Preview</span>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full hover:bg-red-600 transition-colors"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-200 p-8 flex justify-center no-scrollbar">
                <div className="bg-white shadow-2xl origin-top scale-[0.55] sm:scale-[0.85] md:scale-100 h-fit">
                   <InvoicePrint ref={printRef} data={selectedOrder} items={orderItems} />
                </div>
            </div>
            <div className="p-8 bg-gray-50 flex justify-end gap-4 border-t">
              <button onClick={handleDownloadPDF} disabled={isDownloading} className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[11px] disabled:opacity-50">
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
              </button>
              <button onClick={() => handlePrint()} className="bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[11px]"><Printer size={16} /> Print</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-4">
          <div className="bg-[#0a0a0a] border border-gray-900 w-full max-w-[95vw] h-[92vh] rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-900 flex justify-between items-center">
              <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Modify Invoice</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 text-white rounded-2xl hover:bg-red-600 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Product Search */}
                <div className="w-1/3 border-r border-gray-900 p-8 overflow-y-auto bg-black/40 custom-scrollbar">
                  <div className="relative mb-8">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input placeholder="Search products..." className="bg-black border border-gray-800 w-full py-5 pl-14 pr-6 rounded-2xl text-white text-sm font-bold outline-none" value={searchTerm} onChange={(e) => handleSearchProducts(e.target.value)}/>
                  </div>
                  <div className="space-y-3">
                    {filteredProducts.map((p, index) => (
                       <div key={p.id || index} className="p-5 bg-white/5 border border-gray-900 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-all group">
                         <div>
                           <p className="text-xs font-black text-gray-300 uppercase italic">{p.name_en || p.name}</p>
                           <p className="text-[10px] text-blue-500 font-black mt-1 uppercase">{p.price} TK</p>
                         </div>
                         <button onClick={() => addNewItem(p)} className="bg-blue-600 p-3 rounded-xl text-white active:scale-90 transition-transform"><Plus size={18}/></button>
                       </div>
                    ))}
                  </div>
                </div>

                {/* Right: Invoice Details */}
                <div className="flex-1 p-10 flex flex-col bg-transparent overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <input className="bg-black border border-gray-800 w-full p-5 rounded-2xl text-white font-black italic uppercase outline-none" value={selectedOrder.customer_name} onChange={(e) => setSelectedOrder({...selectedOrder, customer_name: e.target.value})} placeholder="Client Name"/>
                    <input className="bg-black border border-gray-800 w-full p-5 rounded-2xl text-white font-black italic uppercase outline-none" value={selectedOrder.customer_address || ''} onChange={(e) => setSelectedOrder({...selectedOrder, customer_address: e.target.value})} placeholder="Delivery Address"/>
                  </div>

                  <div className="flex-1 overflow-y-auto border border-gray-900 rounded-[2rem] bg-black shadow-inner">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#0d0d0d] text-[10px] uppercase text-gray-600 font-black border-b border-gray-900">
                          <tr>
                            <th className="px-8 py-6">Cargo</th>
                            <th className="px-8 py-6 text-center">Qty</th>
                            <th className="px-8 py-6 text-right">Sub-Total</th>
                            <th className="px-8 py-6"></th>
                          </tr>
                        </thead>
                        <tbody>
                            {orderItems.map((item, i) => (
                              <tr key={i} className="hover:bg-white/5 border-b border-gray-900/50">
                                 <td className="px-8 py-6 uppercase italic text-gray-300 font-black">{item.product_name}</td>
                                 <td className="px-8 py-6 text-center">
                                    <input type="number" step="any" className="w-20 bg-white/5 border border-gray-800 rounded-xl p-2 text-center text-white" value={item.qty} onChange={(e) => updateItemQty(i, e.target.value)}/>
                                 </td>
                                 <td className="px-8 py-6 text-right font-black text-blue-500">{item.total} TK</td>
                                 <td className="px-8 py-6 text-center">
                                    <button onClick={() => removeItem(i)} className="text-gray-800 hover:text-red-500"><Trash2 size={18}/></button>
                                 </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                  </div>

                  <div className="mt-10 flex justify-between items-center bg-[#0d0d0d] border border-gray-900 p-8 rounded-[2rem]">
                    <p className="text-4xl font-black text-white italic">{selectedOrder.total_amount} <span className="text-sm text-blue-500 ml-2">TK</span></p>
                    <button onClick={saveUpdatedOrder} disabled={isSaving} className="bg-blue-600 text-white px-10 py-4 rounded-2xl flex items-center gap-3 font-black uppercase text-xs disabled:opacity-50">
                       {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} {isSaving ? "Syncing..." : "Update Invoice"}
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Container */}
      <div className="hidden">
        <div ref={printRef}>
          {selectedOrder && <InvoicePrint data={selectedOrder} items={orderItems} />}
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