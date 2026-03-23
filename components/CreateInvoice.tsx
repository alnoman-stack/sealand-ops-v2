'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, Save, Printer, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

export default function InvoiceGenerator() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ✅ তারিখ সিলেক্ট করার স্টেট (ডিফল্ট আজকের তারিখ)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: cust } = await supabase.from('customers').select('*');
    const { data: prod } = await supabase.from('products').select('*');
    setCustomers(cust || []);
    setProducts(prod || []);
    setFilteredProducts(prod || []);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = products.filter(p => 
      (p.name_en || "").toLowerCase().includes(term.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  // ✅ ভিডিওর সমস্যা সমাধান ২: ইউনিক আইডি জেনারেট করা হয়েছে যাতে এরোর না আসে
  const addItem = (product: any) => {
    const newItem = {
      id: Date.now(), // কী এরোর এড়াতে ক্লায়েন্ট সাইড ইউনিক আইডি
      product_id: product.id,
      product_name: product.name_en,
      qty: 1,
      unit_price: product.price || 0,
      total: product.price || 0
    };
    setInvoiceItems([...invoiceItems, newItem]);
  };

  const updateQty = (index: number, qty: number) => {
    const updated = [...invoiceItems];
    updated[index].qty = qty;
    updated[index].total = qty * updated[index].unit_price;
    setInvoiceItems(updated);
  };

  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const grandTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);

  const saveInvoice = async () => {
    if (!selectedCustomer || invoiceItems.length === 0) return alert("Select Customer & Add Items!");
    
    setIsSaving(true);
    const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    
    try {
      // ✅ তারিখসহ ইনভয়েস সেভ
      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .insert([{
          invoice_number: invoiceNumber,
          customer_name: selectedCustomer.name,
          customer_address: selectedCustomer.address || '',
          total_amount: grandTotal,
          status: 'pending',
          created_at: `${invoiceDate}T${new Date().toTimeString().split(' ')[0]}` 
        }])
        .select()
        .single();

      if (invErr) throw invErr;

      const itemsToInsert = invoiceItems.map(item => ({
        invoice_id: invoice.id,
        product_name: item.product_name,
        qty: item.qty,
        unit_price: item.unit_price,
        total: item.total
      }));

      const { error: itemErr } = await supabase.from('invoice_items').insert(itemsToInsert);
      if (itemErr) throw itemErr;

      alert("Invoice Saved Successfully: " + invoiceNumber);
      setInvoiceItems([]);
      setSelectedCustomer(null);
    } catch (err: any) {
      alert("Error saving invoice: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex gap-6 p-6 bg-[#050505] min-h-screen text-white">
      {/* বাম পাশ: প্রোডাক্ট লিস্ট */}
      <div className="w-1/3 bg-[#0a0a0a] border border-gray-900 rounded-3xl p-6">
        <h3 className="text-lg font-black uppercase italic mb-4">Select Products</h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input 
            type="text"
            placeholder="Search product..."
            className="w-full bg-black border border-gray-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
          {/* ✅ সমাধান: key={p.id || index} ব্যবহার করা হয়েছে */}
          {filteredProducts.map((p, idx) => (
            <div key={p.id || `prod-${idx}`} className="flex justify-between items-center p-4 bg-white/5 border border-gray-900 rounded-2xl hover:border-blue-500 transition-all group">
              <div>
                <p className="font-bold text-sm uppercase">{p.name_en}</p>
                <p className="text-xs text-gray-500">{p.price} TK / {p.unit || 'unit'}</p>
              </div>
              <button onClick={() => addItem(p)} className="p-2 bg-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ডান পাশ: ইনভয়েস প্রিভিউ */}
      <div className="flex-1 bg-white text-black rounded-3xl p-8 shadow-2xl flex flex-col">
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-blue-900 leading-none">SEALAND AGRO</h1>
            <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold italic tracking-tighter">Premium Food Supply Chain</p>
            <p className="text-[9px] text-gray-400 w-64 mt-2 font-bold">House # 3, Road # Nobinagar 16, Dhaka Uddan, Mohammadpur</p>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <h2 className="text-2xl font-black uppercase text-gray-200 leading-none">INVOICE</h2>
            
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                <CalendarIcon size={12} className="text-blue-600" />
                <input 
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="bg-transparent text-[10px] font-black outline-none cursor-pointer"
                />
            </div>
          </div>
        </div>

        {/* কাস্টমার সিলেকশন */}
        <div className="mb-4">
          <select 
            className="w-full p-4 border-2 border-gray-100 rounded-2xl font-black outline-none bg-gray-50 text-xs uppercase"
            onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value))}
            value={selectedCustomer?.id || ""}
          >
            <option value="">-- Choose Customer --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
          </select>
        </div>

        {/* কাস্টমারের ঠিকানা */}
        {selectedCustomer && (
          <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex justify-between items-center">
            <div>
              <p className="text-[9px] font-black uppercase text-blue-600 mb-1">Billing Details:</p>
              <p className="text-sm font-black uppercase">{selectedCustomer.name}</p>
              <p className="text-[11px] text-gray-600 font-bold uppercase tracking-tighter">
                {selectedCustomer.address ? selectedCustomer.address : "No Address Found"}
              </p>
            </div>
            <div className="text-right">
                <p className="text-[9px] font-black uppercase text-gray-400">Phone</p>
                <p className="text-xs font-bold">{selectedCustomer.phone}</p>
            </div>
          </div>
        )}

        {/* আইটেম টেবিল */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-blue-900 text-white uppercase text-[10px] font-black italic">
                <th className="p-4 rounded-l-xl">Product Name</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4 text-right">Unit Price</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center rounded-r-xl"></th>
              </tr>
            </thead>
            <tbody>
              {/* ✅ সমাধান: key={item.id} ব্যবহার করা হয়েছে */}
              {invoiceItems.map((item, index) => (
                <tr key={item.id || index} className="border-b text-xs font-bold hover:bg-gray-50 transition-colors">
                  <td className="p-4 uppercase text-blue-900 italic">{item.product_name}</td>
                  <td className="p-4 text-center">
                    <input 
                      type="number" 
                      className="w-14 border-2 border-gray-100 rounded-lg p-1 text-center font-black" 
                      value={item.qty} 
                      onChange={(e) => updateQty(index, parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-4 text-right">{item.unit_price} TK</td>
                  <td className="p-4 text-right text-blue-600">{item.total.toLocaleString()} TK</td>
                  <td className="p-4 text-center">
                    <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 border-t-2 border-dashed pt-6 flex justify-between items-end">
          <div className="text-right w-full">
            <p className="text-[10px] font-black text-gray-400 uppercase">Grand Total Amount</p>
            <p className="text-4xl font-black text-blue-900 tracking-tighter">{grandTotal.toLocaleString()} <span className="text-sm">TK</span></p>
          </div>
        </div>

        <div className="mt-8 flex gap-4 no-print">
          <button 
            onClick={saveInvoice} 
            disabled={isSaving}
            className="flex-1 bg-black text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-xl disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            {isSaving ? "Saving..." : "Confirm & Save"}
          </button>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl">
            <Printer size={18} /> Print Bill
          </button>
        </div>
      </div>
    </div>
  );
}