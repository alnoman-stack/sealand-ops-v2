'use client'
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useReactToPrint } from 'react-to-print';
import InvoicePrint from './InvoicePrint';
import { Eye, Edit, Trash2, FileText, Printer, X, Save, Search, Plus, Download, Calendar as CalendarIcon } from 'lucide-react';

export default function OrdersView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  
  // ✅ তারিখ ফিল্টার করার স্টেট (ডিফল্ট আজকের তারিখ)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const printRef = useRef<any>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice_${selectedOrder?.invoice_number || 'Order'}`,
    onAfterPrint: () => console.log("Print Success"),
    suppressErrors: true, 
  });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [selectedDate]); // ✅ তারিখ পরিবর্তন হলে অটোমেটিক ডাটা রিলোড হবে

  const fetchOrders = async () => {
    // ✅ তারিখ অনুযায়ী ফিল্টার যুক্ত করা হয়েছে
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .gte('created_at', `${selectedDate}T00:00:00`)
      .lte('created_at', `${selectedDate}T23:59:59`)
      .order('created_at', { ascending: false });

    if (error) console.error("Error fetching orders:", error);
    setOrders(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) console.error("Error fetching products:", error);
    setProducts(data || []);
    setFilteredProducts(data || []);
  };

  const handleViewOrder = async (order: any) => {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', order.id);
    setSelectedOrder(order);
    setOrderItems(items || []);
    setIsModalOpen(true);
  };

  const handleDirectPrint = async (order: any) => {
    try {
      const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', order.id);
      if (!items) return;
      setSelectedOrder(order);
      setOrderItems(items);
      setTimeout(() => { if (printRef.current) handlePrint(); }, 500);
    } catch (err) { alert("প্রিন্ট করতে সমস্যা হয়েছে।"); }
  };

  const handleEditOrder = async (order: any) => {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', order.id);
    setSelectedOrder({ ...order }); 
    setOrderItems(items || []);
    setIsEditModalOpen(true);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = products.filter(p => {
      const pName = p.name_en || p.name || p.product_name || "";
      return pName.toLowerCase().includes(term.toLowerCase());
    });
    setFilteredProducts(filtered);
  };

  const addNewItem = (p: any) => {
    const actualName = p.name_en || p.name || p.product_name || "Unknown Product";
    const actualPrice = p.price || p.unit_price || 0;
    const existingItemIndex = orderItems.findIndex(item => item.product_name === actualName);
    if (existingItemIndex > -1) {
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].qty += 1;
      updatedItems[existingItemIndex].total = Number((updatedItems[existingItemIndex].qty * updatedItems[existingItemIndex].unit_price).toFixed(2));
      setOrderItems(updatedItems);
      recalculateTotal(updatedItems);
    } else {
      const newItem = { product_name: actualName, qty: 1, unit_price: actualPrice, total: actualPrice };
      const updatedItems = [...orderItems, newItem]; 
      setOrderItems(updatedItems);
      recalculateTotal(updatedItems);
    }
  };

  const removeItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
    recalculateTotal(updatedItems);
  };

  const updateItemQty = (index: number, newValue: string) => {
    if (newValue === "") {
        const updatedItems = [...orderItems];
        updatedItems[index].qty = "";
        setOrderItems(updatedItems);
        return;
    }
    const qty = parseFloat(newValue);
    if (isNaN(qty)) return;
    const updatedItems = [...orderItems];
    updatedItems[index].qty = qty;
    updatedItems[index].total = Number((qty * updatedItems[index].unit_price).toFixed(2));
    setOrderItems(updatedItems);
    recalculateTotal(updatedItems);
  };

  const recalculateTotal = (items: any[]) => {
    const newGrandTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setSelectedOrder((prev: any) => ({ ...prev, total_amount: Number(newGrandTotal.toFixed(2)) }));
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
      const itemsToInsert = orderItems.map(item => ({
        invoice_id: selectedOrder.id,
        product_name: item.product_name,
        qty: item.qty,
        unit_price: item.unit_price,
        total: item.total
      }));
      await supabase.from('invoice_items').insert(itemsToInsert);
      alert("সফলভাবে সেভ ও আপডেট হয়েছে!");
      setIsEditModalOpen(false);
      fetchOrders();
    } catch (error) { alert("সেভ করতে এরর হয়েছে।"); } finally { setIsSaving(false); }
  };

  const deleteOrder = async (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিত?")) {
      await supabase.from('invoice_items').delete().eq('invoice_id', id);
      await supabase.from('invoices').delete().eq('id', id);
      fetchOrders();
    }
  };

  return (
    <div className="space-y-6 relative p-4 bg-black min-h-screen text-white">
      
      {/* ✅ তারিখ ফিল্টার এবং টোটাল অর্ডার কাউন্ট UI সেকশন */}
      <div className="flex justify-between items-center bg-[#0a0a0a] p-6 rounded-[2rem] border border-gray-900 shadow-2xl">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">
            Orders History
          </h2>
          {/* টোটাল কাউন্টার অংশ */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              Total Found: <span className="text-green-500 text-sm ml-1">{orders.length}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-red-950/20 p-3 px-5 rounded-2xl border border-red-900/30">
            <CalendarIcon size={14} className="text-red-500" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-[11px] font-black outline-none cursor-pointer uppercase tracking-wider"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {orders.length > 0 ? orders.map(order => (
          <div key={order.id} className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-[2rem] flex justify-between items-center group shadow-xl transition-all hover:border-blue-500/50">
            <div className="flex items-center gap-6">
              <div className="bg-white/5 p-4 rounded-2xl"><FileText className="text-blue-500" size={20} /></div>
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{order.invoice_number}</p>
                <p className="text-lg font-black uppercase text-gray-200">{order.customer_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => handleViewOrder(order)} className="p-3 bg-white/5 rounded-xl text-green-500 hover:bg-green-500/10"><Eye size={18} /></button>
               <button onClick={() => handleEditOrder(order)} className="p-3 bg-white/5 rounded-xl text-blue-500 hover:bg-blue-500/10"><Edit size={18} /></button>
               <button onClick={() => handleDirectPrint(order)} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:bg-white/10"><Printer size={18} /></button>
               <button onClick={() => deleteOrder(order.id)} className="p-3 bg-white/5 rounded-xl text-red-500 hover:bg-red-500/10"><Trash2 size={18} /></button>
            </div>
          </div>
        )) : (
          <div className="text-center p-10 bg-[#0a0a0a] rounded-[2rem] border border-gray-900 text-gray-600 font-bold uppercase italic text-sm">
            No orders found for this date.
          </div>
        )}
      </div>

      {/* View Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-gray-50 flex justify-between items-center border-b">
              <span className="text-black font-black uppercase text-xs tracking-widest">Invoice Preview</span>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-200 p-4 sm:p-8 flex justify-center">
                <div className="bg-white shadow-2xl origin-top scale-[0.55] sm:scale-[0.85] md:scale-100 h-fit">
                   <InvoicePrint ref={printRef} data={selectedOrder} items={orderItems} />
                </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end gap-4 border-t">
              <button onClick={() => handlePrint()} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-[11px] tracking-widest transition-all">
                <Download size={16} /> Download / Print PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-[#0a0a0a] border border-gray-900 w-full max-w-[95vw] h-[90vh] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-900 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Modify Invoice: {selectedOrder.invoice_number}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
            </div>
            <div className="flex-1 flex overflow-hidden">
               <div className="w-1/3 border-r border-gray-900 p-6 overflow-y-auto bg-black/20">
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input placeholder="Search product..." className="bg-black border border-gray-800 w-full py-4 pl-10 rounded-2xl text-white text-xs font-bold outline-none focus:border-blue-500" value={searchTerm} onChange={(e) => handleSearch(e.target.value)}/>
                  </div>
                  <div className="space-y-2">
                    {filteredProducts.map((p, index) => (
                       <div key={p.id || `prod-${index}`} className="p-4 bg-white/5 border border-gray-900 rounded-2xl flex justify-between items-center hover:border-blue-500/50 transition-all">
                          <div>
                            <p className="text-xs font-black text-gray-200 uppercase">{p.name_en || p.name}</p>
                            <p className="text-[10px] text-blue-500 font-bold">{p.price} TK</p>
                          </div>
                          <button onClick={() => addNewItem(p)} className="bg-blue-600 hover:bg-blue-50 p-2 rounded-xl text-white"><Plus size={16}/></button>
                       </div>
                    ))}
                  </div>
               </div>
               <div className="flex-1 p-8 flex flex-col bg-white/5">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                       <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">Customer Name</label>
                       <input className="bg-black border border-gray-800 w-full p-4 rounded-xl text-white font-black italic uppercase outline-none focus:border-blue-500" value={selectedOrder.customer_name} onChange={(e) => setSelectedOrder({...selectedOrder, customer_name: e.target.value})}/>
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">Customer Address</label>
                       <input className="bg-black border border-gray-800 w-full p-4 rounded-xl text-white font-black italic uppercase outline-none focus:border-blue-500" value={selectedOrder.customer_address || ''} onChange={(e) => setSelectedOrder({...selectedOrder, customer_address: e.target.value})} placeholder="Enter Address..."/>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto border border-gray-900 rounded-[1.5rem] bg-black">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-900/50 text-[10px] uppercase text-gray-500 font-black tracking-widest border-b border-gray-800">
                          <tr>
                            <th className="p-5">Product Details</th>
                            <th className="p-5 text-center">Qty</th>
                            <th className="p-5 text-right">Total</th>
                            <th className="p-5 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="text-white text-xs font-bold">
                            {orderItems.map((item, i) => (
                              <tr key={i} className="border-b border-gray-900/50 hover:bg-white/5 transition-colors">
                                 <td className="p-5 uppercase italic text-gray-300">{item.product_name}</td>
                                 <td className="p-5 text-center">
                                    <input type="number" step="any" className="w-20 bg-white/5 border border-gray-800 rounded-lg p-2 text-center text-white font-black outline-none focus:border-blue-500" value={item.qty} onFocus={(e) => e.target.select()} onChange={(e) => updateItemQty(i, e.target.value)}/>
                                 </td>
                                 <td className="p-5 text-right text-blue-400">{item.total} TK</td>
                                 <td className="p-5 text-center">
                                    <button onClick={() => removeItem(i)} className="p-2 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                 </td>
                              </tr>
                            ))}
                        </tbody>
                     </table>
                  </div>
                  <div className="mt-8 flex justify-between items-center bg-black border border-gray-900 p-8 rounded-[2rem] shadow-2xl">
                    <div>
                       <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Total Payable</p>
                       <p className="text-4xl font-black text-white italic">{selectedOrder.total_amount} <span className="text-sm text-blue-500">TK</span></p>
                    </div>
                    <button onClick={saveUpdatedOrder} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50">
                       {isSaving ? "Saving..." : <><Save size={18}/> Update & Save Invoice</>}
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>
        {selectedOrder && ( <InvoicePrint ref={printRef} data={selectedOrder} items={orderItems} /> )}
      </div>
    </div>
  );
}