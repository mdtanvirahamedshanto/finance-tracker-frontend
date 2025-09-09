import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Target, CreditCard, PiggyBank, LogOut, Download, User } from 'lucide-react';
import { transactionAPI, authAPI } from '@/lib/api.js';
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
import { TransactionList } from '@/components/TransactionList';
import { SpendingChart } from '@/components/SpendingChart';
import { BudgetOverview } from '@/components/BudgetOverview';
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
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({ income: 0, expenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingsGoal, setSavingsGoal] = useState(10000); // Default savings goal
  
  // Fetch financial summary and transactions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    
    // Redirect to login page
    window.location.href = '/login';
  };
  
  const handleExportData = () => {
    // Get transactions data
    const transactionsData = JSON.stringify(mockData.recentTransactions, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([transactionsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border/50 sticky top-0 z-50 backdrop-blur-sm bg-surface/80">
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
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                      <span className="sr-only">Open profile menu</span>
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {localStorage.getItem('username')?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="cursor-default">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{localStorage.getItem('username') || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{localStorage.getItem('email') || 'user@example.com'}</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportData()}>
                      Export Data
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
          savingsGoal={mockData.savingsGoal}
          currentSavings={mockData.currentSavings}
          selectedPeriod={selectedPeriod}
          transactions={mockData.recentTransactions}
        />

        {/* Charts & Budget Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <SpendingChart transactions={mockData.recentTransactions} />
          <BudgetOverview />
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transactions</span>
              <Badge variant="secondary">
                {mockData.recentTransactions.length} transactions
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
                <TransactionList transactions={mockData.recentTransactions.filter(t => t.type === 'income')} />
              </TabsContent>
              <TabsContent value="expenses">
                <TransactionList transactions={mockData.recentTransactions.filter(t => t.type === 'expense')} />
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
    </div>
  );
};

export default Index;