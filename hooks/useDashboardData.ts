'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoiceService } from '@/services/invoiceService';
import { supabase } from '@/lib/supabase';

export function useDashboardData(startDate: string, endDate: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [rawData, setRawData] = useState<{
    invoices: any[],
    payments: any[],
    expenses: any[],
    purchases: any[],
    charts: any[],
    items: any[],
    vendors: any[],
    inventory: any[]
  }>({
    invoices: [], payments: [], expenses: [], purchases: [], charts: [], items: [], vendors: [], inventory: []
  });

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const sevenDaysStr = sevenDaysAgo.toISOString();

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const thirtyDaysStr = thirtyDaysAgo.toISOString();

      const [
        allInvoices, 
        allPayments, 
        { data: expenseData },
        { data: purchaseData }, 
        { data: chartData }, 
        { data: itemsData },
        { data: vendorData }, 
        { data: inventoryData } 
      ] = await Promise.all([
        invoiceService.fetchAllInvoices() || [],
        invoiceService.fetchAllPayments() || [],
        supabase.from('expenses').select('amount, date').gte('date', startDate).lte('date', endDate),
        supabase.from('purchases').select('total_amount, purchase_date').gte('purchase_date', startDate).lte('purchase_date', endDate),
        supabase.from('invoices').select('total_amount, created_at').gte('created_at', sevenDaysStr),
        
        supabase.from('invoice_items')
          .select(`product_name, qty, invoices!inner(created_at)`)
          .gte('invoices.created_at', thirtyDaysStr) 
          .limit(1000),

        supabase.from('vendor_summaries').select('current_due'), 
        supabase.from('products').select('current_stock, last_buying_price') 
      ]);

      setRawData({
        invoices: allInvoices || [],
        payments: allPayments || [],
        expenses: expenseData || [],
        purchases: purchaseData || [],
        charts: chartData || [],
        items: itemsData || [],
        vendors: vendorData || [],
        inventory: inventoryData || []
      });

    } catch (error: any) {
      console.error("Dashboard Sync Error Detail:", error.message || error);
    } finally {
      setIsSyncing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ১. মূল পরিসংখ্যান (Calculations Updated)
  const stats = useMemo(() => {
    const { invoices, payments, expenses, purchases, vendors } = rawData;
    
    // নির্দিষ্ট তারিখের মধ্যে ইনভয়েস ফিল্টার
    const filteredInvoices = invoices.filter(inv => {
      const date = inv.created_at?.split('T')[0];
      return date >= startDate && date <= endDate;
    });

    // মোট সেলস
    const totalSell = filteredInvoices.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);

    // মোট ডিসকাউন্ট / অ্যাডজাস্টমেন্ট (আপনার সমস্যার সমাধান)
    const totalDiscount = filteredInvoices.reduce((acc, curr) => acc + (Number(curr.total_discount) || 0), 0);

    // ক্যাশ রিসিভড
    const received = payments.reduce((acc, curr) => {
      const pDate = curr.payment_date?.split('T')[0];
      return (pDate >= startDate && pDate <= endDate) ? acc + (Number(curr.amount_paid) || 0) : acc;
    }, 0);

    // নিট বকেয়া (সব সময়ের মোট বকেয়া)
    const due = invoices.reduce((acc, curr) => 
      acc + (Number(curr.total_amount) - (Number(curr.received_amount) || 0) - (Number(curr.total_discount) || 0)), 0
    );

    const totalExpense = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalPurchaseAmount = purchases.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    const totalVendorDue = vendors.reduce((acc, curr: any) => acc + (Number(curr.current_due) || 0), 0);

    return { 
      totalSell, 
      received, 
      totalExpense, 
      totalPurchaseAmount, 
      totalVendorDue, 
      due, 
      totalDiscount // এখন আর ০ দেখাবে না
    };
  }, [rawData, startDate, endDate]);

  // ২. কাস্টমার লেজার (Due balance calculation corrected)
  const customerSummary = useMemo(() => {
    const { invoices, payments } = rawData;
    const customerMap: { [key: string]: any } = {};

    invoices.forEach(inv => {
      const name = inv.customer_name;
      const currentDue = (Number(inv.total_amount) || 0) - (Number(inv.received_amount) || 0) - (Number(inv.total_discount) || 0);
      if (!customerMap[name]) customerMap[name] = { name, totalDue: 0, lastPayment: null };
      customerMap[name].totalDue += currentDue;
    });

    payments.forEach(p => {
      const name = p.customer_name;
      if (customerMap[name]) {
        const pDate = p.payment_date;
        if (!customerMap[name].lastPayment || new Date(pDate) > new Date(customerMap[name].lastPayment)) {
          customerMap[name].lastPayment = pDate;
        }
      }
    });

    return Object.values(customerMap)
      .filter((c: any) => c.totalDue > 1)
      .sort((a, b) => b.totalDue - a.totalDue);
  }, [rawData.invoices, rawData.payments]);

  // ৩. সেলস গ্রোথ চার্ট
  const salesGrowth = useMemo(() => {
    const dataMap: { [key: string]: number } = {};
    rawData.charts.forEach(inv => {
      const invDate = inv.created_at?.split('T')[0];
      if (invDate) dataMap[invDate] = (dataMap[invDate] || 0) + (Number(inv.total_amount) || 0);
    });
    return Object.keys(dataMap).sort().map(date => ({
      name: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      sales: dataMap[date]
    }));
  }, [rawData.charts]);

  // ৪. টপ প্রোডাক্ট র‍্যাঙ্কিং
  const productRanking = useMemo(() => {
    const productMap: { [key: string]: number } = {};
    rawData.items.forEach(item => {
      const name = item.product_name;
      const qty = Number(item.qty) || 0;
      if (name) productMap[name] = (productMap[name] || 0) + qty;
    });
    return Object.entries(productMap)
      .map(([name, actualValue]) => ({ name, actualValue, unit: 'KG' }))
      .sort((a, b) => b.actualValue - a.actualValue).slice(0, 5); 
  }, [rawData.items]);

  // ৫. ওভারডিউ ইনভয়েস লিস্ট
  const dueInvoices = useMemo(() => {
    return rawData.invoices
      .filter(inv => (Number(inv.total_amount) - (Number(inv.received_amount) || 0) - (Number(inv.total_discount) || 0)) > 1)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15);
  }, [rawData.invoices]);

  return { stats, dueInvoices, customerSummary, salesGrowth, productRanking, isSyncing, refresh: fetchData };
}