export type Person = "Ire" | "Ebe";

export interface Bill {
  id: string;
  name: string;
  totalAmount: number;
  dueDate: string;
  irePaid: boolean;
  ebePaid: boolean;
  irePaidDate: string | null;
  ebePaidDate: string | null;
  irePaidAmount?: number; // For Credit Card Pot - amount paid
  ebePaidAmount?: number; // For Credit Card Pot - amount paid
  createdAt: number;
}

export interface BillSummary {
  totalBills: number;
  totalAmount: number;
  unpaidBills: number;
  overdueBills: number;
  ireOutstanding: number;
  ebeOutstanding: number;
  irePaidTotal: number;
  ebePaidTotal: number;
}
