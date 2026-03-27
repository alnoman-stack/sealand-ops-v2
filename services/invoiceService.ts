// src/services/invoiceService.ts
import { supabase } from '@/lib/supabase';
import { Invoice, Payment } from '@/types';

export const invoiceService = {
  // ১. সব ইনভয়েস নিয়ে আসার জন্য
  async fetchAllInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // ২. সব পেমেন্ট নিয়ে আসার জন্য
  async fetchAllPayments(): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) throw error;
    return data || [];
  },

  // ৩. ইনভয়েস ডিলিট করার জন্য (প্রথমে আইটেম ডিলিট হবে, তারপর মূল ইনভয়েস)
  async deleteInvoice(id: string) {
    // আগে রিলেটেড আইটেমগুলো ডিলিট করতে হবে
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    // এরপর মূল ইনভয়েস ডিলিট
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  },

  // ৪. ইনভয়েস আপডেট করার জন্য
  async updateInvoice(id: string, invoiceData: any, items: any[]) {
    // ক. ইনভয়েস এর সাধারণ তথ্য (Customer name, total amount ইত্যাদি) আপডেট
    await supabase.from('invoices').update(invoiceData).eq('id', id);
    
    // খ. আগের সব আইটেম ডিলিট করে নতুন আইটেম যোগ করা (Clean approach)
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    
    // গ. নতুন আইটেমগুলো ইনসার্ট করা
    const { error } = await supabase.from('invoice_items').insert(items);
    if (error) throw error;
  }
};