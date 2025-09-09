// IndexedDB service for offline data storage

// Database name and version
const DB_NAME = 'FinanceTrackerDB';
const DB_VERSION = 2; // Increment version to trigger onupgradeneeded

// Store names for different data types
const STORES = {
  transactions: 'transactions',
  offlineTransactions: 'offlineTransactions',
  budgets: 'budgets',
  offlineBudgets: 'offlineBudgets',
  savingsGoals: 'savingsGoals',
  offlineSavingsGoals: 'offlineSavingsGoals',
};

// Open database connection
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Handle database upgrade (first time or version change)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.transactions)) {
        const transactionsStore = db.createObjectStore(STORES.transactions, { keyPath: '_id' });
        transactionsStore.createIndex('date', 'date', { unique: false });
        transactionsStore.createIndex('type', 'type', { unique: false });
        transactionsStore.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.offlineTransactions)) {
        const offlineTransactionsStore = db.createObjectStore(STORES.offlineTransactions, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        offlineTransactionsStore.createIndex('action', 'action', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.budgets)) {
        const budgetsStore = db.createObjectStore(STORES.budgets, { keyPath: '_id' });
        budgetsStore.createIndex('category', 'category', { unique: true });
      }

      if (!db.objectStoreNames.contains(STORES.offlineBudgets)) {
        const offlineBudgetsStore = db.createObjectStore(STORES.offlineBudgets, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        offlineBudgetsStore.createIndex('action', 'action', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.savingsGoals)) {
        db.createObjectStore(STORES.savingsGoals, { keyPath: '_id' });
      }

      if (!db.objectStoreNames.contains(STORES.offlineSavingsGoals)) {
        const offlineSavingsGoalsStore = db.createObjectStore(STORES.offlineSavingsGoals, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(`IndexedDB error: ${(event.target as IDBOpenDBRequest).error}`);
    };
  });
};

// Generic function to add data to a store
export const addData = async <T>(storeName: string, data: T): Promise<IDBValidKey> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(data);

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result);
    };

    request.onerror = (event) => {
      reject(`Error adding data to ${storeName}: ${(event.target as IDBRequest).error}`);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Generic function to update data in a store
export const updateData = async <T>(storeName: string, data: T): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(`Error updating data in ${storeName}: ${(event.target as IDBRequest).error}`);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Generic function to delete data from a store
export const deleteData = async (storeName: string, key: IDBValidKey): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(`Error deleting data from ${storeName}: ${(event.target as IDBRequest).error}`);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Generic function to get all data from a store
export const getAllData = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result);
    };

    request.onerror = (event) => {
      reject(`Error getting data from ${storeName}: ${(event.target as IDBRequest).error}`);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Generic function to get data by key
export const getDataByKey = async <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result);
    };

    request.onerror = (event) => {
      reject(`Error getting data by key from ${storeName}: ${(event.target as IDBRequest).error}`);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Generic function to get data by index
export const getDataByIndex = async <T>(
  storeName: string, 
  indexName: string, 
  value: IDBValidKey
): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result);
    };

    request.onerror = (event) => {
      reject(`Error getting data by index from ${storeName}: ${(event.target as IDBRequest).error}`);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Clear all data from a store
export const clearStore = async (storeName: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(`Error clearing store ${storeName}: ${(event.target as IDBRequest).error}`);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Add transaction to offline queue
export const addOfflineTransaction = async (action: string, data: any): Promise<IDBValidKey> => {
  return addData(STORES.offlineTransactions, { action, data, timestamp: Date.now() });
};

// Add budget to offline queue
export const addOfflineBudget = async (action: string, data: any): Promise<IDBValidKey> => {
  return addData(STORES.offlineBudgets, { action, data, timestamp: Date.now() });
};

// Add savings goal to offline queue
export const addOfflineSavingsGoal = async (data: any): Promise<IDBValidKey> => {
  return addData(STORES.offlineSavingsGoals, { data, timestamp: Date.now() });
};

// Get all transactions
export const getAllTransactions = async () => {
  return getAllData(STORES.transactions);
};

// Get all budgets
export const getAllBudgets = async () => {
  return getAllData(STORES.budgets);
};

// Get savings goal
export const getSavingsGoal = async () => {
  const goals = await getAllData(STORES.savingsGoals);
  return goals[0]; // Assuming there's only one savings goal
};

// Check if database exists
export const checkDatabaseExists = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME);
    let exists = true;
    
    request.onupgradeneeded = () => {
      exists = false;
    };
    
    request.onsuccess = () => {
      request.result.close();
      resolve(exists);
    };
    
    request.onerror = () => {
      resolve(false);
    };
  });
};