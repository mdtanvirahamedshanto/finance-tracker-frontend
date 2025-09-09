import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Loader2 } from 'lucide-react';
import { transactionAPI } from '@/lib/api';

interface Transaction {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  notes?: string;
}

interface SpendingChartProps {
  propTransactions?: Transaction[];
}

export const SpendingChart = ({ propTransactions }: SpendingChartProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (propTransactions && propTransactions.length > 0) {
      setTransactions(propTransactions);
    } else {
      fetchTransactions();
    }
  }, [propTransactions]);
  
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionAPI.getAll();
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to fetch expense data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  // Process transactions to get spending by category
  const expenseTransactions = transactions?.filter(t => t.type === 'expense') || [];
  
  const categoryData = expenseTransactions.reduce((acc, transaction) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += Math.abs(transaction.amount);
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData).map(([category, amount]) => ({
    category,
    amount,
    percentage: ((amount / Object.values(categoryData).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
  }));

  const COLORS = [
    'hsl(142, 76%, 36%)', // Primary green
    'hsl(200, 95%, 45%)', // Accent blue
    'hsl(38, 92%, 50%)',  // Warning orange
    'hsl(0, 84%, 60%)',   // Destructive red
    'hsl(265, 89%, 58%)', // Purple
    'hsl(173, 58%, 39%)', // Teal
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            ${data.amount.toFixed(2)} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-2 opacity-50 animate-spin" />
              <p>Loading expense data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-destructive mb-4">{error}</div>
              <button 
                className="px-4 py-2 border border-border rounded-md hover:bg-accent text-sm font-medium"
                onClick={fetchTransactions}
              >
                Try Again
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No expense data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Spending by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="amount"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span className="text-xs sm:text-sm font-medium">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Category breakdown */}
        <div className="mt-3 sm:mt-4 space-y-2">
          {chartData.slice(0, 3).map((item, index) => (
            <div key={item.category} className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-medium">{item.category}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">${item.amount.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};