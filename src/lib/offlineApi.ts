// Offline-capable API service

import api, { transactionAPI, budgetAPI, savingsGoalAPI } from './api';
import * as indexedDB from './indexedDB';
import { isOnline, triggerBackgroundSync } from '../serviceWorkerRegistration';
import {
  Transaction,
  TransactionCreateData,
  TransactionUpdateData,
  Budget,
  BudgetData,
  SavingsGoal,
  OfflineTransaction,
  OfflineBudget,
  OfflineSavingsGoal,
  ApiResponse,
  SyncResponse,
  TransactionSummary,
  CategoryAnalysis,
  MonthlyTrend
} from './types';

// Enhanced Transaction API with offline support
export const offlineTransactionAPI = {
  // Get all transactions (from IndexedDB if offline, or from API if online)
  getAll: async (params = {}): Promise<Transaction[]> => {
    try {
      if (isOnline()) {
        // If online, fetch from API and update local cache
        const response = await transactionAPI.getAll(params);
        
        // Cache transactions in IndexedDB
        for (const transaction of response) {
          await indexedDB.updateData('transactions', transaction);
        }
        
        return response;
      } else {
        // If offline, get from IndexedDB
        return await indexedDB.getAllTransactions();
      }
    } catch (error) {
      console.error('Error in getAll transactions:', error);
      // Fallback to IndexedDB if API call fails
      return await indexedDB.getAllTransactions();
    }
  },
  
  // Get transaction by ID
  getById: async (id: string): Promise<Transaction | null> => {
    try {
      if (isOnline()) {
        // If online, fetch from API
        const response = await transactionAPI.getById(id);
        return response;
      } else {
        // If offline, get from IndexedDB
        return await indexedDB.getDataByKey('transactions', id);
      }
    } catch (error) {
      console.error('Error in getById transaction:', error);
      // Fallback to IndexedDB
      return await indexedDB.getDataByKey('transactions', id);
    }
  },
  
  // Create a new transaction
  create: async (transactionData: TransactionCreateData): Promise<Transaction> => {
    try {
      if (isOnline()) {
        // If online, create via API
        const response = await transactionAPI.create(transactionData);
        
        // Cache the new transaction
        await indexedDB.updateData('transactions', response);
        
        return response;
      } else {
        // If offline, store locally with temporary ID
        const tempTransaction: Transaction = {
          ...transactionData,
          _id: `temp_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Add to local transactions
        await indexedDB.updateData('transactions', tempTransaction);
        
        // Add to offline queue for later sync
        await indexedDB.addOfflineTransaction('create', transactionData);
        
        return tempTransaction;
      }
    } catch (error) {
      console.error('Error in create transaction:', error);
      
      // Store offline even if API call fails
      const tempTransaction: Transaction = {
        ...transactionData,
        _id: `temp_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await indexedDB.updateData('transactions', tempTransaction);
      await indexedDB.addOfflineTransaction('create', transactionData);
      
      return tempTransaction;
    }
  },
  
  // Update an existing transaction
  update: async (id: string, transactionData: TransactionUpdateData): Promise<Transaction> => {
    try {
      if (isOnline()) {
        // If online, update via API
        const response = await transactionAPI.update(id, transactionData);
        
        // Update local cache
        await indexedDB.updateData('transactions', response);
        
        return response;
      } else {
        // If offline, update locally
        const existingTransaction = await indexedDB.getDataByKey('transactions', id);
        
        if (!existingTransaction) {
          throw new Error('Transaction not found');
        }
        
        const updatedTransaction: Transaction = {
          ...existingTransaction,
          ...transactionData,
          updatedAt: new Date().toISOString(),
        };
        
        // Update local data
        await indexedDB.updateData('transactions', updatedTransaction);
        
        // Add to offline queue
        await indexedDB.addOfflineTransaction('update', {
          _id: id,
          ...transactionData,
        });
        
        return updatedTransaction;
      }
    } catch (error) {
      console.error('Error in update transaction:', error);
      
      // Try to update offline
      const existingTransaction = await indexedDB.getDataByKey('transactions', id);
      
      if (!existingTransaction) {
        throw new Error('Transaction not found');
      }
      
      const updatedTransaction: Transaction = {
        ...existingTransaction,
        ...transactionData,
        updatedAt: new Date().toISOString(),
      };
      
      await indexedDB.updateData('transactions', updatedTransaction);
      await indexedDB.addOfflineTransaction('update', {
        _id: id,
        ...transactionData,
      });
      
      return updatedTransaction;
    }
  },
  
  // Delete a transaction
  delete: async (id: string): Promise<ApiResponse> => {
    try {
      if (isOnline()) {
        // If online, delete via API
        const response = await transactionAPI.delete(id);
        
        // Remove from local cache
        await indexedDB.deleteData('transactions', id);
        
        return response;
      } else {
        // If offline, mark for deletion
        const existingTransaction = await indexedDB.getDataByKey('transactions', id);
        
        if (!existingTransaction) {
          throw new Error('Transaction not found');
        }
        
        // Remove from local data
        await indexedDB.deleteData('transactions', id);
        
        // Add to offline queue
        await indexedDB.addOfflineTransaction('delete', { _id: id });
        
        return { success: true, message: 'Transaction deleted offline' };
      }
    } catch (error) {
      console.error('Error in delete transaction:', error);
      
      // Try to delete offline
      await indexedDB.deleteData('transactions', id);
      await indexedDB.addOfflineTransaction('delete', { _id: id });
      
      return { success: true, message: 'Transaction deleted offline' };
    }
  },
  
  // Get transaction summary
  getSummary: async (params: { period?: string; startDate?: string; endDate?: string } = {}): Promise<TransactionSummary> => {
    try {
      if (isOnline()) {
        // If online, get from API
        const response = await transactionAPI.getSummary(params);
        return response;
      } else {
        // If offline, calculate from local data
        const transactions = await indexedDB.getAllTransactions();
        
        // Filter transactions based on params if needed
        let filteredTransactions = transactions;
        
        if (params.period) {
          const now = new Date();
          let startDate;
          
          switch (params.period) {
            case 'week':
              startDate = new Date(now.setDate(now.getDate() - 7));
              break;
            case 'month':
              startDate = new Date(now.setMonth(now.getMonth() - 1));
              break;
            case 'year':
              startDate = new Date(now.setFullYear(now.getFullYear() - 1));
              break;
            case 'custom':
              if (params.startDate) {
                startDate = new Date(params.startDate);
              }
              break;
          }
          
          if (startDate) {
            filteredTransactions = transactions.filter((t: Transaction) => new Date(t.date) >= startDate);
          }
          
          if (params.endDate) {
            const endDate = new Date(params.endDate);   
            filteredTransactions = filteredTransactions.filter((t: Transaction) => new Date(t.date) <= endDate);
          }
        }
        
        // Calculate summary
        const income = filteredTransactions
          .filter((t: Transaction) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = filteredTransactions
          .filter((t: Transaction) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        return {
          income: income as number,
          expenses: expenses as number,
          balance: income - expenses,
        };
      }
    } catch (error) {
      console.error('Error in getSummary:', error);
      
      // Calculate from local data as fallback
      const transactions = await indexedDB.getAllTransactions();
      
      const income = transactions
        .filter((t: Transaction) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = transactions
        .filter((t: Transaction) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        income: income as number,
        expenses: expenses as number,
        balance: (income as number) - (expenses as number),
      };
    }
  },
  
  // Get category analysis
  getCategoryAnalysis: async (params: { startDate?: string; endDate?: string; type?: 'income' | 'expense' } = {}): Promise<CategoryAnalysis[]> => {
    try {
      if (isOnline()) {
        return await transactionAPI.getCategoryAnalysis(params);
      } else {
        // Calculate from local data
        const transactions = await indexedDB.getAllTransactions();
        
        // Group by category
        const categoryMap: Record<string, number> = {};
        
        transactions.forEach((transaction: Transaction) => {
          if (transaction.type === 'expense') {
            if (!categoryMap[transaction.category]) {
              categoryMap[transaction.category] = 0;
            }
            categoryMap[transaction.category] += transaction.amount;
          }
        });
        
        // Convert to array format
        return Object.entries(categoryMap).map(([category, amount]) => ({
          category,
          amount,
        }));
      }
    } catch (error) {
      console.error('Error in getCategoryAnalysis:', error);
      
      // Fallback to local calculation
      const transactions = await indexedDB.getAllTransactions();
      const categoryMap: Record<string, number> = {};
      
      transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          if (!categoryMap[transaction.category]) {
            categoryMap[transaction.category] = 0;
          }
          categoryMap[transaction.category] += transaction.amount;
        }
      });
      
      return Object.entries(categoryMap).map(([category, amount]) => ({
        category,
        amount,
      }));
    }
  },
  
  // Get monthly trends
  getMonthlyTrends: async (params: { startDate?: string; endDate?: string } = {}): Promise<MonthlyTrend[]> => {
    try {
      if (isOnline()) {
        return await transactionAPI.getMonthlyTrends(params);
      } else {
        // Calculate from local data
        const transactions = await indexedDB.getAllTransactions();
        
        // Group by month
        const monthlyData: Record<string, MonthlyTrend> = {};
        
        transactions.forEach(transaction => {
          const date = new Date(transaction.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: monthKey,
              income: 0,
              expenses: 0,
            };
          }
          
          if (transaction.type === 'income') {
            monthlyData[monthKey].income += transaction.amount;
          } else {
            monthlyData[monthKey].expenses += transaction.amount;
          }
        });
        
        // Convert to array and sort by month
        return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
      }
    } catch (error) {
      console.error('Error in getMonthlyTrends:', error);
      
      // Fallback to local calculation
      const transactions = await indexedDB.getAllTransactions();
      const monthlyData: Record<string, MonthlyTrend> = {};
      
      transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            income: 0,
            expenses: 0,
          };
        }
        
        if (transaction.type === 'income') {
          monthlyData[monthKey].income += transaction.amount;
        } else {
          monthlyData[monthKey].expenses += transaction.amount;
        }
      });
      
      return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    }
  },
  
  // Sync offline transactions with server
  syncOfflineTransactions: async (): Promise<ApiResponse> => {
    if (!isOnline()) {
      return { success: false, message: 'No internet connection' };
    }
    
    try {
      // Get all offline transactions
      const offlineTransactions = await indexedDB.getAllData<OfflineTransaction>('offlineTransactions');
      
      if (offlineTransactions.length === 0) {
        return { success: true, message: 'No offline transactions to sync' };
      }
      
      // Process each offline transaction
      for (const transaction of offlineTransactions) {
        const { action, data, id } = transaction;
        
        try {
          switch (action) {
            case 'create':
              await transactionAPI.create(data);
              break;
            case 'update':
              await transactionAPI.update(data._id, data);
              break;
            case 'delete':
              await transactionAPI.delete(data._id);
              break;
          }
          
          // Remove from offline queue after successful sync
          await indexedDB.deleteData('offlineTransactions', id as number);
        } catch (error) {
          console.error(`Error syncing transaction ${id}:`, error);
        }
      }
      
      // Refresh local data after sync
      const updatedTransactions = await transactionAPI.getAll();
      
      // Update local cache
      await indexedDB.clearStore('transactions');
      for (const transaction of updatedTransactions) {
        await indexedDB.updateData('transactions', transaction);
      }
      
      return { 
        success: true, 
        message: `Synced ${offlineTransactions.length} transactions` 
      };
    } catch (error) {
      console.error('Error syncing offline transactions:', error);
      return { success: false, message: 'Failed to sync transactions' };
    }
  },
};

// Enhanced Budget API with offline support
export const offlineBudgetAPI = {
  // Get all budgets
  getAll: async (): Promise<Budget[]> => {
    try {
      if (isOnline()) {
        // If online, fetch from API and update local cache
        const response = await budgetAPI.getAll();
        
        // Cache budgets in IndexedDB
        for (const budget of response) {
          await indexedDB.updateData('budgets', budget);
        }
        
        return response;
      } else {
        // If offline, get from IndexedDB
        return await indexedDB.getAllBudgets();
      }
    } catch (error) {
      console.error('Error in getAll budgets:', error);
      // Fallback to IndexedDB
      return await indexedDB.getAllBudgets();
    }
  },
  
  // Create or update a budget
  createOrUpdate: async (category: string, amount: number): Promise<Budget> => {
    try {
      if (isOnline()) {
        // If online, create/update via API
        const response = await budgetAPI.createOrUpdate(category, amount);
        
        // Update local cache
        await indexedDB.updateData('budgets', response);
        
        return response;
      } else {
        // If offline, update locally
        const budgets = await indexedDB.getAllBudgets();
        const existingBudget = budgets.find(b => b.category === category);
        
        const updatedBudget: Budget = existingBudget
          ? { ...existingBudget, amount }
          : { 
              _id: `temp_${Date.now()}`, 
              category, 
              amount,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
        
        // Update local data
        await indexedDB.updateData('budgets', updatedBudget);
        
        // Add to offline queue
        await indexedDB.addOfflineBudget('update', { category, amount });
        
        return updatedBudget;
      }
    } catch (error) {
      console.error('Error in createOrUpdate budget:', error);
      
      // Try to update offline
      const budgets = await indexedDB.getAllBudgets();
      const existingBudget = budgets.find(b => b.category === category);
      
      const updatedBudget: Budget = existingBudget
        ? { ...existingBudget, amount }
        : { 
            _id: `temp_${Date.now()}`, 
            category, 
            amount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
      
      await indexedDB.updateData('budgets', updatedBudget);
      await indexedDB.addOfflineBudget('update', { category, amount });
      
      return updatedBudget;
    }
  },
  
  // Update multiple budgets at once
  updateBatch: async (budgets: BudgetData[]): Promise<Budget[]> => {
    try {
      if (isOnline()) {
        // If online, update via API
        const response = await budgetAPI.updateBatch(budgets);
        
        // Update local cache
        for (const budget of response) {
          await indexedDB.updateData('budgets', budget);
        }
        
        return response;
      } else {
        // If offline, update locally
        const updatedBudgets: Budget[] = [];
        
        for (const budget of budgets) {
          const { category, amount } = budget;
          const existingBudgets = await indexedDB.getAllBudgets();
          const existingBudget = existingBudgets.find(b => b.category === category);
          
          const updatedBudget: Budget = existingBudget
            ? { ...existingBudget, amount }
            : { 
                _id: `temp_${Date.now()}_${category}`, 
                category, 
                amount,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
          
          // Update local data
          await indexedDB.updateData('budgets', updatedBudget);
          updatedBudgets.push(updatedBudget);
        }
        
        // Add to offline queue
        await indexedDB.addOfflineBudget('updateBatch', budgets);
        
        return updatedBudgets;
      }
    } catch (error) {
      console.error('Error in updateBatch budgets:', error);
      
      // Try to update offline
      const updatedBudgets = [];
      
      for (const budget of budgets) {
        const { category, amount } = budget;
        const existingBudgets = await indexedDB.getAllBudgets();
        const existingBudget = existingBudgets.find(b => b.category === category);
        
        const updatedBudget = existingBudget
          ? { ...existingBudget, amount }
          : { 
              _id: `temp_${Date.now()}_${category}`, 
              category, 
              amount,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
        
        await indexedDB.updateData('budgets', updatedBudget);
        updatedBudgets.push(updatedBudget);
      }
      
      await indexedDB.addOfflineBudget('updateBatch', budgets);
      
      return updatedBudgets;
    }
  },
  
  // Delete a budget
  delete: async (id: string): Promise<ApiResponse> => {
    try {
      if (isOnline()) {
        // If online, delete via API
        const response = await budgetAPI.delete(id);
        
        // Remove from local cache
        await indexedDB.deleteData('budgets', id);
        
        return response;
      } else {
        // If offline, mark for deletion
        const existingBudget = await indexedDB.getDataByKey('budgets', id);
        
        if (!existingBudget) {
          throw new Error('Budget not found');
        }
        
        // Remove from local data
        await indexedDB.deleteData('budgets', id);
        
        // Add to offline queue
        await indexedDB.addOfflineBudget('delete', { _id: id });
        
        return { success: true, message: 'Budget deleted offline' };
      }
    } catch (error) {
      console.error('Error in delete budget:', error);
      
      // Try to delete offline
      await indexedDB.deleteData('budgets', id);
      await indexedDB.addOfflineBudget('delete', { _id: id });
      
      return { success: true, message: 'Budget deleted offline' };
    }
  },
  
  // Sync offline budgets with server
  syncOfflineBudgets: async (): Promise<ApiResponse> => {
    if (!isOnline()) {
      return { success: false, message: 'No internet connection' };
    }
    
    try {
      // Get all offline budgets
      const offlineBudgets = await indexedDB.getAllData<OfflineBudget>('offlineBudgets');
      
      if (offlineBudgets.length === 0) {
        return { success: true, message: 'No offline budgets to sync' };
      }
      
      // Process each offline budget
      for (const budget of offlineBudgets) {
        const { action, data, id } = budget;
        
        try {
          switch (action) {
            case 'update':
              await budgetAPI.createOrUpdate(data.category, data.amount);
              break;
            case 'updateBatch':
              await budgetAPI.updateBatch(data);
              break;
            case 'delete':
              await budgetAPI.delete(data._id);
              break;
          }
          
          // Remove from offline queue after successful sync
          await indexedDB.deleteData('offlineBudgets', id as number);
        } catch (error) {
          console.error(`Error syncing budget ${id}:`, error);
        }
      }
      
      // Refresh local data after sync
      const updatedBudgets = await budgetAPI.getAll();
      
      // Update local cache
      await indexedDB.clearStore('budgets');
      for (const budget of updatedBudgets) {
        await indexedDB.updateData('budgets', budget);
      }
      
      return { 
        success: true, 
        message: `Synced ${offlineBudgets.length} budgets` 
      };
    } catch (error) {
      console.error('Error syncing offline budgets:', error);
      return { success: false, message: 'Failed to sync budgets' };
    }
  },
};

// Enhanced Savings Goal API with offline support
export const offlineSavingsGoalAPI = {
  // Get savings goal
  get: async (): Promise<SavingsGoal | null> => {
    try {
      if (isOnline()) {
        // If online, fetch from API and update local cache
        const response = await savingsGoalAPI.get();
        
        // Cache savings goal in IndexedDB
        await indexedDB.updateData('savingsGoals', response);
        
        return response;
      } else {
        // If offline, get from IndexedDB
        return await indexedDB.getSavingsGoal();
      }
    } catch (error) {
      console.error('Error in get savings goal:', error);
      // Fallback to IndexedDB
      return await indexedDB.getSavingsGoal();
    }
  },
  
  // Update savings goal
  update: async (amount: number): Promise<SavingsGoal> => {
    try {
      if (isOnline()) {
        // If online, update via API
        const response = await savingsGoalAPI.update(amount);
        
        // Update local cache
        await indexedDB.updateData('savingsGoals', response);
        
        return response;
      } else {
        // If offline, update locally
        const existingGoal = await indexedDB.getSavingsGoal();
        
        const updatedGoal: SavingsGoal = existingGoal
          ? { ...existingGoal, amount }
          : { 
              _id: `temp_${Date.now()}`, 
              amount,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
        
        // Update local data
        await indexedDB.updateData('savingsGoals', updatedGoal);
        
        // Add to offline queue
        await indexedDB.addOfflineSavingsGoal({ amount });
        
        return updatedGoal;
      }
    } catch (error) {
      console.error('Error in update savings goal:', error);
      
      // Try to update offline
      const existingGoal = await indexedDB.getSavingsGoal();
      
      const updatedGoal: SavingsGoal = existingGoal
        ? { ...existingGoal, amount }
        : { 
            _id: `temp_${Date.now()}`, 
            amount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
      
      await indexedDB.updateData('savingsGoals', updatedGoal);
      await indexedDB.addOfflineSavingsGoal({ amount });
      
      return updatedGoal;
    }
  },
  
  // Sync offline savings goals with server
  syncOfflineSavingsGoals: async (): Promise<ApiResponse> => {
    if (!isOnline()) {
      return { success: false, message: 'No internet connection' };
    }
    
    try {
      // Get all offline savings goals
      const offlineSavingsGoals = await indexedDB.getAllData<OfflineSavingsGoal>('offlineSavingsGoals');
      
      if (offlineSavingsGoals.length === 0) {
        return { success: true, message: 'No offline savings goals to sync' };
      }
      
      // Process each offline savings goal
      for (const goal of offlineSavingsGoals) {
        const { data, id } = goal;
        
        try {
          await savingsGoalAPI.update(data.amount);
          
          // Remove from offline queue after successful sync
          await indexedDB.deleteData('offlineSavingsGoals', id as number);
        } catch (error) {
          console.error(`Error syncing savings goal ${id}:`, error);
        }
      }
      
      // Refresh local data after sync
      const updatedGoal = await savingsGoalAPI.get();
      
      // Update local cache
      await indexedDB.clearStore('savingsGoals');
      await indexedDB.updateData('savingsGoals', updatedGoal);
      
      return { 
        success: true, 
        message: `Synced ${offlineSavingsGoals.length} savings goals` 
      };
    } catch (error) {
      console.error('Error syncing offline savings goals:', error);
      return { success: false, message: 'Failed to sync savings goals' };
    }
  },
};

// Function to sync all offline data
export const syncAllOfflineData = async (): Promise<SyncResponse> => {
  if (!isOnline()) {
    return { success: false, message: 'No internet connection' };
  }
  
  try {
    // Trigger background sync via service worker
    triggerBackgroundSync();
    
    // Always perform manual sync as a fallback
    try {
      // Sync all data types
      const transactionResult = await offlineTransactionAPI.syncOfflineTransactions();
      const budgetResult = await offlineBudgetAPI.syncOfflineBudgets();
      const savingsResult = await offlineSavingsGoalAPI.syncOfflineSavingsGoals();
      
      return {
        success: true,
        message: 'Sync completed',
        details: {
          transactions: transactionResult,
          budgets: budgetResult,
          savingsGoals: savingsResult,
        },
      };
    } catch (syncError) {
      console.error('Error during manual sync:', syncError);
      return { success: false, message: 'Failed to sync data: ' + syncError.message };
    }
  } catch (error) {
    console.error('Error syncing all offline data:', error);
    return { success: false, message: 'Failed to sync data: ' + error.message };
  }
};

// Initialize IndexedDB when the app starts
export const initializeOfflineStorage = async (): Promise<ApiResponse> => {
  try {
    // Always open the database to ensure all stores are created
    await indexedDB.openDB();
    console.log('IndexedDB initialized for offline storage');
    
    // Set up event listener for sync fallback
    document.addEventListener('sync-fallback-needed', async (event: CustomEvent<{ type: string }>) => {
      console.log('Background sync not available, using manual sync');
      if (isOnline()) {
        try {
          await syncAllOfflineData();
        } catch (syncError) {
          console.error('Manual sync fallback failed:', syncError);
        }
      }
    });
    
    // If online, sync any pending offline data
    if (isOnline()) {
      setTimeout(() => syncAllOfflineData(), 1000); // Delay sync to ensure DB is ready
    }
    
    return { success: true, message: 'Offline storage initialized' };
  } catch (error) {
    console.error('Error initializing offline storage:', error);
    return { success: false, message: 'Error initializing offline storage' };
  }
};