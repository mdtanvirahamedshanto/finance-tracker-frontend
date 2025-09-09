import { Target, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BudgetItem {
  category: string;
  budgeted: number;
  spent: number;
  color: string;
}

// Mock budget data - in production this would come from your backend
const budgetData: BudgetItem[] = [
  { category: 'Food & Dining', budgeted: 500, spent: 340.50, color: 'hsl(142, 76%, 36%)' },
  { category: 'Transportation', budgeted: 200, spent: 165.00, color: 'hsl(200, 95%, 45%)' },
  { category: 'Entertainment', budgeted: 150, spent: 89.99, color: 'hsl(265, 89%, 58%)' },
  { category: 'Shopping', budgeted: 300, spent: 425.75, color: 'hsl(0, 84%, 60%)' },
  { category: 'Bills & Utilities', budgeted: 400, spent: 380.00, color: 'hsl(38, 92%, 50%)' },
];

export const BudgetOverview = () => {
  const totalBudgeted = budgetData.reduce((sum, item) => sum + item.budgeted, 0);
  const totalSpent = budgetData.reduce((sum, item) => sum + item.spent, 0);
  const overallProgress = (totalSpent / totalBudgeted) * 100;

  const getBudgetStatus = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return { status: 'over', color: 'destructive', icon: AlertTriangle };
    if (percentage >= 80) return { status: 'warning', color: 'warning', icon: AlertTriangle };
    return { status: 'good', color: 'success', icon: CheckCircle };
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Budget Overview
          </CardTitle>
          <Button variant="outline" size="sm" className="self-start sm:self-auto">
            Edit Budget
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
          
          {budgetData.map((item) => {
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
                      style={{ backgroundColor: item.color }}
                    />
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
                  className="h-1.5 sm:h-2"
                />
                
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
          })}
        </div>

        {/* Budget Tips */}
        <div className="bg-muted/50 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Budget Tip</p>
              <p>You're spending 15% more on shopping this month. Consider reducing non-essential purchases to stay on track.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};