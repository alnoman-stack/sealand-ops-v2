// src/hooks/useDashboardData.ts
import { useState, useEffect, useCallback } from 'react';
import { invoiceService } from '@/services/invoiceService';
import { Invoice, Payment } from '@/types';

export function useDashboardData(startDate: string, endDate: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({ totalSell: 0, received: 0, totalDiscount: 0, due: 0, dueCount: 0 });
  const [dueInvoices, setDueInvoices] = useState<Invoice[]>([]);
  const [customerSummary, setCustomerSummary] = useState<any[]>([]);

  const calculateData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [allInvoices, allPayments] = await Promise.all([
        invoiceService.fetchAllInvoices(),
        invoiceService.fetchAllPayments()
      ]);

      // ১. নির্দিষ্ট তারিখ অনুযায়ী ফিল্টার করা
      const filteredInvoices = allInvoices.filter(inv => {
        const date = inv.created_at.split('T')[0];
        return date >= startDate && date <= endDate;
      });

      const filteredPayments = allPayments.filter(p => {
        const pDate = p.payment_date ? p.payment_date.split('T')[0] : '';
        return pDate >= startDate && pDate <= endDate;
      });

      // ২. স্ট্যাটাস ক্যালকুলেশন (Gross Sales, Cash Received, etc.)
      const totalSell = filteredInvoices.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
      const received = filteredPayments.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);
      const totalDiscount = filteredPayments.reduce((acc, curr) => acc + (Number(curr.adjustment_amount) || 0), 0);
      
      // লাইফ-টাইম ডিউ হিসাব (সব ইনভয়েস থেকে)
      const lifeTimeDue = allInvoices.reduce((acc, curr) => {
        return acc + (Number(curr.total_amount) - (Number(curr.received_amount) || 0) - (Number(curr.total_discount) || 0));
      }, 0);

      setStats({
        totalSell,
        received,
        totalDiscount,
        due: lifeTimeDue,
        dueCount: allInvoices.filter(inv => (Number(inv.total_amount) - (Number(inv.received_amount) || 0) - (Number(inv.total_discount) || 0)) > 1).length
      });

      // ৩. ওভারডিউ ইনভয়েস লিস্ট
      setDueInvoices(allInvoices.filter(inv => (Number(inv.total_amount) - (Number(inv.received_amount) || 0) - (Number(inv.total_discount) || 0)) > 1));

      // ৪. কাস্টমার লেজার সামারি
      const uniqueCustomers = [...new Set(allInvoices.map(inv => inv.customer_name))];
      const summary = uniqueCustomers.map(name => {
        const cInvoices = allInvoices.filter(inv => inv.customer_name === name);
        return {
          name,
          totalDue: cInvoices.reduce((acc, curr) => acc + (Number(curr.total_amount) - (Number(curr.received_amount) || 0) - (Number(curr.total_discount) || 0)), 0),
          lastPayment: cInvoices.sort((a, b) => new Date(b.last_payment_date || 0).getTime() - new Date(a.last_payment_date || 0).getTime())[0]?.last_payment_date
        };
      }).filter(c => c.totalDue > 1);

      setCustomerSummary(summary);

    } catch (error) {
      console.error("Calculation Error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    calculateData();
  }, [calculateData]);

  return { stats, dueInvoices, customerSummary, isSyncing, refresh: calculateData };
}