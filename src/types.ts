export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PAID = 'paid',
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  category: string;
  isFixed: boolean;
  endMonth?: string;
  paymentDate?: string;
  parentId?: string; // Links a specific month occurrence to its fixed parent
  status: TransactionStatus;
  person?: string; // Used for loans
  paymentMethod?: 'cash' | 'credit';
}

export interface LoanReport {
  person: string;
  out: number;
  in: number;
  balance: number;
}

export type View = 'dashboard' | 'monthly' | 'fixed' | 'loans' | 'credit-card';
