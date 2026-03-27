// src/hooks/useOrders.ts
import { useState, useEffect, useCallback } from 'react';
import { invoiceService } from '@/services/invoiceService';
import { Invoice } from '@/types';

export function useOrders() {
  const [orders, setOrders] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invoiceService.fetchAllInvoices();
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, refresh: fetchOrders };
}