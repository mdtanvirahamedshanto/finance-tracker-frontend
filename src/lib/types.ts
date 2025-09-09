// Type definitions for the finance tracker application

// Transaction types
export interface Transaction {
  _id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreateData {
  amount: number;
  category: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
}

export interface TransactionUpdateData {
  amount?: number;
  category?: string;
  date?: string;
  description?: string;
  type?: 'income' | 'expense';
}

// Budget types
export interface Budget {
  _id: string;
  category: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetData {
  category: string;
  amount: number;
}

// Savings Goal types
export interface SavingsGoal {
  _id: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

// Offline queue types
export interface OfflineTransaction {
  id?: number;
  action: 'create' | 'update' | 'delete';
  data: TransactionCreateData | { _id: string } | any;
  timestamp: number;
}

export interface OfflineBudget {
  id?: number;
  action: 'update' | 'updateBatch' | 'delete';
  data: BudgetData | BudgetData[] | { _id: string } | any;
  timestamp: number;
}

export interface OfflineSavingsGoal {
  id?: number;
  data: { amount: number } | any;
  timestamp: number;
}

// API response types
export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface SyncResponse extends ApiResponse {
  details?: {
    transactions: ApiResponse;
    budgets: ApiResponse;
    savingsGoals: ApiResponse;
  };
}

// Summary types
export interface TransactionSummary {
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryAnalysis {
  category: string;
  amount: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}