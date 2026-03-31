'use client';
import { useState, useEffect, useCallback } from 'react';
import { invoiceService } from '@/services/invoiceService';
import { supabase } from '@/lib/supabase';
import { Invoice } from '@/types';

export function useDashboardData(startDate: string, endDate: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({ 
    totalSell: 0, 
    received: 0, 
    totalDiscount: 0, 
    due: 0, 
    dueCount: 0,
    totalExpense: 0,
    totalVendorDue: 0 // ড্যাশবোর্ডের অরেঞ্জ রো-এর জন্য
  });
  
  const [dueInvoices, setDueInvoices] = useState<Invoice[]>([]);
  const [customerSummary, setCustomerSummary] = useState<any[]>([]);
  const [salesGrowth, setSalesGrowth] = useState<any[]>([]);
  const [productRanking, setProductRanking] = useState<any[]>([]);

  const calculateData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];

      // ১. সব ডাটা একযোগে ফেচ করা (প্যাচ আপডেট: purchases বদলে সরাসরি suppliers থেকে ব্যালেন্স আনা)
      const [
        allInvoices, 
        allPayments, 
        { data: expenseData },
        { data: chartData }, 
        { data: itemsData },
        { data: vendorData } 
      ] = await Promise.all([
        invoiceService.fetchAllInvoices(),
        invoiceService.fetchAllPayments(),
        supabase.from('expenses').select('amount, date').gte('date', startDate).lte('date', endDate),
        supabase.from('invoices').select('total_amount, created_at').gte('created_at', sevenDaysStr),
        supabase.from('invoice_items').select('product_name, qty, total'),
        // সরাসরি সাপ্লায়ার টেবিল থেকে বকেয়া (Balance Due) আনা হচ্ছে
        supabase.from('suppliers').select('balance_due') 
      ]);

      // ২. ফিল্টারিং (Sales & Payments)
      const filteredInvoices = allInvoices.filter(inv => {
        const date = inv.created_at.split('T')[0];
        return date >= startDate && date <= endDate;
      });

      const filteredPayments = allPayments.filter(p => {
        const pDate = p.payment_date ? p.payment_date.split('T')[0] : '';
        return pDate >= startDate && pDate <= endDate;
      });

      // ৩. বেসিক ক্যালকুলেশন
      const totalSell = filteredInvoices.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
      const received = filteredPayments.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);
      const totalDiscount = filteredPayments.reduce((acc, curr) => acc + (Number(curr.adjustment_amount) || 0), 0);
      const totalExpense = expenseData?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;
      
      // কাস্টমার লাইফটাইম ডিউ
      const lifeTimeDue = allInvoices.reduce((acc, curr) => {
        const invDue = Number(curr.total_amount) - (Number(curr.received_amount) || 0) - (Number(curr.total_discount) || 0);
        return acc + (invDue > 0 ? invDue : 0);
      }, 0);

      // ৪. ভেন্ডর বকেয়া ক্যালকুলেশন (VENDOR PAYABLE LOGIC - সরাসরি সামারি)
      const calculatedVendorDue = vendorData?.reduce((acc, curr) => {
        return acc + (Number(curr.balance_due) || 0);
      }, 0) || 0;

      setStats({
        totalSell, 
        received, 
        totalDiscount, 
        totalExpense,
        totalVendorDue: calculatedVendorDue, 
        due: lifeTimeDue,
        dueCount: allInvoices.filter(inv => (Number(inv.total_amount) - (Number(inv.received_amount) || 0) - (Number(inv.total_discount) || 0)) > 1).length
      });

      // ৫. Sales Growth (Weekly)
      const dayMap: { [key: string]: number } = {};
      chartData?.forEach(inv => {
        const day = new Date(inv.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        dayMap[day] = (dayMap[day] || 0) + (Number(inv.total_amount) || 0);
      });
      setSalesGrowth(Object.keys(dayMap).map(key => ({ name: key, sales: dayMap[key] })));

      // ৬. Product Ranking
      const prodMap: { [key: string]: number } = {};
      itemsData?.forEach(item => {
        prodMap[item.product_name] = (prodMap[item.product_name] || 0) + (Number(item.qty) || 0);
      });

      const kgKeywords = ['fish', 'tomato', 'ginger', 'leaf', 'choy', 'chili', 'potato', 'onion', 'garlic', 'spinach', 'bean', 'lemon', 'shrimp', 'prawn', 'capsicum', 'broccoli', 'mushroom', 'cucumber', 'carrot', 'coriander', 'mint', 'basil', 'cabbage', 'cauliflower', 'eggplant', 'okra'];

      const finalRanking = Object.keys(prodMap)
        .map(name => {
          const lowerName = name.toLowerCase();
          const isKG = kgKeywords.some(kw => lowerName.includes(kw));
          return { name, actualValue: prodMap[name], unit: isKG ? 'KG' : 'Pcs' };
        })
        .sort((a, b) => b.actualValue - a.actualValue)
        .slice(0, 5);

      setProductRanking(finalRanking);

      // ৭. কাস্টমার লেজার সামারি
      const uniqueCustomers = [...new Set(allInvoices.map(inv => inv.customer_name))];
      const summary = uniqueCustomers.map(name => {
        const cInvoices = allInvoices.filter(inv => inv.customer_name === name);
        const totalDue = cInvoices.reduce((acc, curr) => acc + (Number(curr.total_amount) - (Number(curr.received_amount) || 0) - (Number(curr.total_discount) || 0)), 0);
        
        return {
          name,
          totalDue: totalDue > 0 ? totalDue : 0,
          lastPayment: cInvoices.sort((a, b) => new Date(b.last_payment_date || 0).getTime() - new Date(a.last_payment_date || 0).getTime())[0]?.last_payment_date
        };
      }).filter(c => c.totalDue > 1);

      setCustomerSummary(summary);
      setDueInvoices(allInvoices.filter(inv => (Number(inv.total_amount) - (Number(inv.received_amount) || 0) - (Number(inv.total_discount) || 0)) > 1));

    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    calculateData();
  }, [calculateData]);

  return { 
    stats, 
    dueInvoices, 
    customerSummary, 
    salesGrowth, 
    productRanking, 
    isSyncing, 
    refresh: calculateData 
  };
}