import { useState, useEffect } from 'react';
import { Loader2, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { budgetAPI, transactionAPI } from '@/lib/api';
import { EditBudgetDialog } from './EditBudgetDialog';

interface BudgetItem {
  category: string;
  budgeted: number;
  spent: number;
  color: string;
}

// Default budget allocations
const DEFAULT_BUDGET_ALLOCATIONS = [
  { category: 'Housing', budgeted: 1000, color: '#FF6384' },
  { category: 'Food', budgeted: 500, color: '#36A2EB' },
  { category: 'Transportation', budgeted: 300, color: '#FFCE56' },
  { category: 'Entertainment', budgeted: 200, color: '#4BC0C0' },
  { category: 'Shopping', budgeted: 150, color: '#9966FF' },
  { category: 'Utilities', budgeted: 250, color: '#FF9F40' },
];

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  Housing: '#FF6384',
  Food: '#36A2EB',
  Transportation: '#FFCE56',
  Entertainment: '#4BC0C0',
  Shopping: '#9966FF',
  Utilities: '#FF9F40',
  Other: '#C9CBCF',
};

export const BudgetOverview = () => {
  const [budgetData, setBudgetData] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Calculate total budgeted and spent amounts
  const totalBudgeted = budgetData.reduce((sum, item) => sum + item.budgeted, 0);
  const totalSpent = budgetData.reduce((sum, item) => sum + item.spent, 0);
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  // Function to determine budget status
  const getBudgetStatus = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage > 100) {
      return { status: 'over', icon: TrendingUp };
    } else if (percentage > 85) {
      return { status: 'warning', icon: TrendingUp };
    } else {
      return { status: 'good', icon: Target };
    }
  };

  // Fetch budget data
  const fetchBudgetData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all transactions and budgets in parallel
      const [transactions, budgets] = await Promise.all([
        transactionAPI.getAll(),
        budgetAPI.getAll()
      ]);
      
      // If no budget data exists yet, use default allocations with zero spent
      if (!budgets || budgets.length === 0) {
        setBudgetData(DEFAULT_BUDGET_ALLOCATIONS.map(item => ({
          ...item,
          spent: 0,
        })));
        return;
      }
      
      // Group expenses by category and calculate total spent
      const categorySpending: Record<string, number> = {};
      
      (transactions || []).forEach((transaction: any) => {
        if (transaction.type === 'expense') {
          const category = transaction.category || 'Other';
          if (!categorySpending[category]) {
            categorySpending[category] = 0;
          }
          categorySpending[category] += Math.abs(transaction.amount);
        }
      });
      
      // Create budget items from spending data and budgets
      const budgetItems: BudgetItem[] = [];
      
      // Process budgets and add spending data
      const processedCategories = new Set();
      
      // First, add all categories that have budget data
      budgets.forEach((budget: any) => {
        budgetItems.push({
          category: budget.category,
          budgeted: budget.amount,
          spent: categorySpending[budget.category] || 0,
          color: CATEGORY_COLORS[budget.category] || CATEGORY_COLORS.Other,
        });
        processedCategories.add(budget.category);
      });
      
      // Ensure all categories with spending are included
      Object.keys(categorySpending).forEach(category => {
        if (!processedCategories.has(category)) {
          budgetItems.push({
            category,
            budgeted: 0, // Default budget of 0 for categories without a budget
            spent: categorySpending[category],
            color: CATEGORY_COLORS[category] || CATEGORY_COLORS.Other,
          });
        }
      });
      
      setBudgetData(budgetItems);
    } catch (err) {
      console.error('Error fetching budget data:', err);
      setError('Failed to load budget data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch budget data on component mount
  useEffect(() => {
    fetchBudgetData();
  }, []);

  return (
    <>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Budget Overview
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="self-start sm:self-auto"
              onClick={() => setIsEditDialogOpen(true)}
              disabled={loading || Boolean(error)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Edit Budget'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {loading ? (
            <div className="text-center py-4">Loading budget data...</div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="text-destructive mb-4">{error}</div>
              <Button
                variant="outline"
                onClick={fetchBudgetData}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Overall Budget Progress */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium">Overall Budget</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    ${totalSpent.toFixed(2)} / ${totalBudgeted.toFixed(2)}
                  </span>
                </div>
                <Progress value={overallProgress} className="h-2 sm:h-3" />
                <div className="flex items-center justify-between text-xs">
                  <span className={overallProgress > 100 ? 'text-destructive' : 'text-muted-foreground'}>
                    {overallProgress.toFixed(1)}% used
                  </span>
                  <span className="text-muted-foreground">
                    ${(totalBudgeted - totalSpent).toFixed(2)} remaining
                  </span>
                </div>
              </div>

              {/* Category Budgets */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Category Breakdown</h4>

                {budgetData.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No expense data available
                  </div>
                ) : (
                  budgetData.map((item) => {
                    const percentage = (item.spent / item.budgeted) * 100;
                    const remaining = item.budgeted - item.spent;
                    const status = getBudgetStatus(item.spent, item.budgeted);
                    const StatusIcon = status.icon;

                    return (
                      <div key={item.category} className="space-y-2">
                        <div className="flex items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }} />
                            <span className="text-xs sm:text-sm font-medium truncate">{item.category}</span>
                            <Badge
                              variant={status.status === 'over' ? 'destructive' : 'secondary'}
                              className="text-xs shrink-0"
                            >
                              <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                              <span className="hidden sm:inline">
                                {status.status === 'over' ? 'Over' : status.status === 'warning' ? 'Close' : 'Good'}
                              </span>
                              <span className="sm:hidden">
                                {status.status === 'over' ? 'O' : status.status === 'warning' ? 'C' : 'G'}
                              </span>
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ${item.spent.toFixed(2)} / ${item.budgeted.toFixed(2)}
                          </span>
                        </div>

                        <Progress
                          value={Math.min(percentage, 100)}
                          className="h-1.5 sm:h-2" />

                        <div className="flex items-center justify-between text-xs">
                          <span className={percentage > 100 ? 'text-destructive' : 'text-muted-foreground'}>
                            {percentage.toFixed(1)}% used
                          </span>
                          <span className={remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                            {remaining < 0 ? 'Over by ' : ''}${Math.abs(remaining).toFixed(2)}
                            {remaining >= 0 ? ' left' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Budget Tips */}
              <div className="bg-muted/50 rounded-lg p-2 sm:p-3 mt-3 sm:mt-4">
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-0.5 sm:mb-1">Budget Tip</p>
                    <p className="text-xs">You're spending 15% more on shopping this month. Consider reducing non-essential purchases to stay on track.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <EditBudgetDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        budgetItems={budgetData}
        onBudgetsUpdated={fetchBudgetData}
      />
    </>
  );
};