import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { Plus, TrendingUp, TrendingDown, DollarSign, Target, CreditCard, PiggyBank, LogOut, Download, User, Settings, Loader2 } from 'lucide-react';
import { transactionAPI,authAPI } from '@/lib/api.js';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { ProfileSettings } from '@/components/ProfileSettings';
import { TransactionList } from '@/components/TransactionList';
import { SpendingChart } from '@/components/SpendingChart';
import { BudgetOverview } from '@/components/BudgetOverview';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { QuickStats } from '@/components/QuickStats';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';

// Define types for our financial data
interface FinancialSummary {
  income: number;
  expenses: number;
  balance: number;
}

interface Transaction {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  notes?: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
}

// Default values for financial data
const defaultFinancialData = {
  balance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  savingsGoal: 10000, // Default savings goal
  currentSavings: 0,
  recentTransactions: []
};

const Index = () => {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'custom'>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({ income: 0, expenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingsGoal, setSavingsGoal] = useState(10000); // Default savings goal
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Fetch financial summary and transactions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Prepare params based on selected period and date range
        const params = { period: selectedPeriod };
        
        // Add date range params if custom period is selected
        if (selectedPeriod === 'custom' && dateRange?.from) {
          Object.assign(params, { startDate: dateRange.from.toISOString() });
          if (dateRange.to) {
            Object.assign(params, { endDate: dateRange.to.toISOString() });
          }
        }
        
        // Fetch financial summary
        const summaryData = await transactionAPI.getSummary(params);
        setFinancialSummary(summaryData);
        
        // Fetch transactions
        const transactionsData = await transactionAPI.getAll(params);
        setTransactions(transactionsData);
        
        // Set user profile from AuthContext
        if (user) {
          setUserProfile({
            _id: user.id,
            name: user.name,
            email: user.email
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, selectedPeriod, dateRange]);
  
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    // No need to manually redirect as this will be handled by the AuthContext
  };
  
  const handleExportData = (format: 'json' | 'csv' = 'json') => {
    if (!transactions || transactions.length === 0) {
      return;
    }
    
    let data: string;
    let mimeType: string;
    let fileExtension: string;
    
    if (format === 'csv') {
      // Create CSV header
      const headers = ['ID', 'Description', 'Amount', 'Category', 'Date', 'Type', 'Notes'];
      
      // Create CSV rows
      const rows = transactions.map(t => [
        t._id,
        t.description,
        t.amount.toString(),
        t.category,
        t.date,
        t.type,
        t.notes || ''
      ]);
      
      // Combine header and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      data = csvContent;
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else {
      // JSON format
      data = JSON.stringify(transactions, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    }
    
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `finance-data-${date}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  };
  
  // Function to retry loading data
  const retryLoading = () => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch financial summary
        const summaryData = await transactionAPI.getSummary();
        setFinancialSummary(summaryData);
        
        // Fetch transactions
        const transactionsData = await transactionAPI.getAll();
        setTransactions(transactionsData);
        
        // Fetch user profile
        const profileData = await authAPI.getProfile();
        setUserProfile(profileData);
        
        // Store user info in localStorage for profile display
        localStorage.setItem('username', profileData.name);
        localStorage.setItem('email', profileData.email);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading your dashboard</h2>
          <p className="text-muted-foreground">Please wait while we fetch your financial data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-destructive text-lg mb-4">{error}</div>
          <p className="text-muted-foreground mb-6">We encountered an error while loading your dashboard data.</p>
          <Button onClick={retryLoading}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className=" border-b border-border/50 sticky top-0 z-50 backdrop-blur-sm bg-surface/80">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">FinanceTracker</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <TimePeriodSelector 
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>
              <Button 
                onClick={() => setIsAddTransactionOpen(true)}
                className="bg-gradient-to-r from-primary to-primary-light hover:shadow-lg transition-all duration-300 h-8 px-3 sm:h-10 sm:px-4"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Transaction</span>
              </Button>
              
              {/* Profile dropdown */}
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                      <span className="sr-only">Open profile menu</span>
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="cursor-default">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email || 'user@example.com'}</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsProfileSettingsOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportData('json')}>
                      <Download className="mr-2 h-4 w-4" />
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportData('csv')}>
                      <Download className="mr-2 h-4 w-4" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleLogout()} className="text-destructive">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <div className="block sm:hidden mt-3">
            <TimePeriodSelector 
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-gradient-to-br from-primary to-primary-light text-primary-foreground border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium opacity-90">
                Total Balance
                <PiggyBank className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${financialSummary.balance.toLocaleString()}</div>
              <div className="flex items-center mt-2 text-xs opacity-75">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                Monthly Income
                <TrendingUp className="h-4 w-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${financialSummary.income.toLocaleString()}</div>
              <div className="text-xs text-success mt-2">This month</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                Monthly Expenses
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${financialSummary.expenses.toLocaleString()}</div>
              <div className="text-xs text-destructive mt-2">This month</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats & Goals */}
        <QuickStats 
          savingsGoal={savingsGoal}
          currentSavings={financialSummary.balance > 0 ? financialSummary.balance : 0}
          selectedPeriod={selectedPeriod}
          dateRange={dateRange}
          transactions={transactions}
        />

        {/* Charts & Budget Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <SpendingChart propTransactions={transactions} />
            <div className="space-y-4 sm:space-y-6">
              <BudgetOverview />
              <SavingsGoalCard 
                currentSavings={financialSummary.balance > 0 ? financialSummary.balance : 0} 
                initialGoal={savingsGoal}
              />
            </div>
          </div>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transactions</span>
              <Badge variant="secondary">
                {transactions.length} transactions
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full sm:w-auto mb-4">
                <TabsTrigger value="all" className="flex-1 sm:flex-none">All Transactions</TabsTrigger>
                <TabsTrigger value="income" className="flex-1 sm:flex-none">Income</TabsTrigger>
                <TabsTrigger value="expenses" className="flex-1 sm:flex-none">Expenses</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <TransactionList transactions={transactions} />
              </TabsContent>
              <TabsContent value="income">
                <TransactionList transactions={transactions.filter(t => t.type === 'income')} />
              </TabsContent>
              <TabsContent value="expenses">
                <TransactionList transactions={transactions.filter(t => t.type === 'expense')} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Add Transaction Dialog */}
      <AddTransactionDialog 
        open={isAddTransactionOpen}
        onOpenChange={setIsAddTransactionOpen}
        onAddTransaction={async (transactionData) => {
          try {
            await transactionAPI.create(transactionData);
            // Refresh data after adding a transaction
            const summaryData = await transactionAPI.getSummary();
            setFinancialSummary(summaryData);
            
            const transactionsData = await transactionAPI.getAll();
            setTransactions(transactionsData);
            
            setIsAddTransactionOpen(false);
          } catch (error) {
            console.error('Error adding transaction:', error);
          }
        }}
      />
      
      <ProfileSettings
        open={isProfileSettingsOpen}
        onOpenChange={setIsProfileSettingsOpen}
      />
    </div>
  );
};

export default Index;