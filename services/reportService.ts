import { supabase } from '@/lib/supabase';

export const reportService = {
  async getCustomerReport(customerName: string) {
    // ১. ইনভয়েস এবং পেমেন্ট ডাটা আনা
    const [invoices, payments] = await Promise.all([
      supabase.from('invoices')
        .select('*')
        .eq('customer_name', customerName)
        .order('created_at', { ascending: false }),
      supabase.from('payments')
        .select('*')
        .eq('customer_name', customerName)
        .order('payment_date', { ascending: false })
    ]);

    // ২. ইনভয়েস আইটেমগুলো আনা (টপ প্রোডাক্ট বের করার জন্য)
    const { data: items } = await supabase
      .from('invoice_items')
      .select('product_name, qty, total, invoice_id')
      .in('invoice_id', invoices.data?.map(inv => inv.id) || []);

    return {
      invoices: invoices.data || [],
      payments: payments.data || [],
      items: items || []
    };
  }
};