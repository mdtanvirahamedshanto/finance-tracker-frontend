import { Target, TrendingUp, TrendingDown, Calendar, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface QuickStatsProps {
  savingsGoal: number;
  currentSavings: number;
  selectedPeriod: 'week' | 'month' | 'year';
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    type: 'income' | 'expense';
  }>;
}

export const QuickStats = ({ savingsGoal, currentSavings, selectedPeriod, transactions }: QuickStatsProps) => {
  const savingsProgress = (currentSavings / savingsGoal) * 100;
  const remainingAmount = savingsGoal - currentSavings;

  // Calculate period-based data
  const getPeriodData = () => {
    const now = new Date();
    let filteredTransactions = transactions;
    
    if (selectedPeriod === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      filteredTransactions = transactions.filter(t => 
        new Date(t.date) >= weekStart
      );
    } else if (selectedPeriod === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredTransactions = transactions.filter(t => 
        new Date(t.date) >= monthStart
      );
    } else if (selectedPeriod === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filteredTransactions = transactions.filter(t => 
        new Date(t.date) >= yearStart
      );
    }

    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate average based on period
    const periodMultiplier = selectedPeriod === 'week' ? 1 : selectedPeriod === 'month' ? 4 : 52;
    const avgIncome = income / (selectedPeriod === 'year' ? 12 : selectedPeriod === 'month' ? 4 : 1);
    const avgExpenses = expenses / (selectedPeriod === 'year' ? 12 : selectedPeriod === 'month' ? 4 : 1);

    return { income, expenses, avgIncome, avgExpenses, total: income - expenses };
  };

  const periodData = getPeriodData();
  const periodLabels = {
    week: 'This Week',
    month: 'This Month',
    year: 'This Year'
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Savings Goal Progress */}
      <Card className="hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            Savings Goal
            <Target className="h-4 w-4 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{savingsProgress.toFixed(1)}%</span>
            </div>
            <Progress value={savingsProgress} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-foreground">
              ${currentSavings.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              ${remainingAmount.toLocaleString()} remaining
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Income */}
      <Card className="hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center justify-between text-xs sm:text-sm font-medium text-muted-foreground">
            {periodLabels[selectedPeriod]} Income
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm sm:text-lg font-bold text-foreground">
            ${periodData.income.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Avg: ${periodData.avgIncome.toFixed(0)}
          </div>
        </CardContent>
      </Card>

      {/* Period Expenses */}
      <Card className="hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center justify-between text-xs sm:text-sm font-medium text-muted-foreground">
            {periodLabels[selectedPeriod]} Expenses
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm sm:text-lg font-bold text-foreground">
            ${periodData.expenses.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Avg: ${periodData.avgExpenses.toFixed(0)}
          </div>
        </CardContent>
      </Card>

      {/* Net Total */}
      <Card className="hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center justify-between text-xs sm:text-sm font-medium text-muted-foreground">
            {periodLabels[selectedPeriod]} Net
            <div className={`w-2 h-2 rounded-full ${periodData.total >= 0 ? 'bg-success' : 'bg-destructive'}`}></div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`text-sm sm:text-lg font-bold ${periodData.total >= 0 ? 'text-success' : 'text-destructive'}`}>
            ${Math.abs(periodData.total).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {periodData.total >= 0 ? 'Surplus' : 'Deficit'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};