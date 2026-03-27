// src/types/index.ts

export interface Invoice {
  id: string;
  created_at: string;
  customer_name: string;
  total_amount: number;
  received_amount: number;
  total_discount: number;
  invoice_number?: string;
  last_payment_date?: string;
}

export interface Payment {
  id: string;
  payment_date: string;
  amount_paid: number;
  adjustment_amount: number;
  invoice_id: string;
}