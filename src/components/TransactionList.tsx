import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { transactionAPI } from '@/lib/api.js';
import { useToast } from '@/hooks/use-toast';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { EditTransactionDialog } from '@/components/EditTransactionDialog';
import { DeleteTransactionDialog } from '@/components/DeleteTransactionDialog';

interface Transaction {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  notes?: string;
}

interface TransactionListProps {
  transactions?: Transaction[];
}

export const TransactionList = ({ transactions: propTransactions }: TransactionListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propTransactions) {
      setTransactions(propTransactions);
      setLoading(false);
      setError(null);
    } else {
      const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await transactionAPI.getAll();
          setTransactions(data);
        } catch (error) {
          console.error('Error fetching transactions:', error);
          setError('Failed to fetch transactions. Please try again later.');
          toast({
            title: "Error",
            description: "Failed to fetch transactions",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchTransactions();
    }
  }, [toast, propTransactions]);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food': 'bg-orange-100 text-orange-800 border-orange-200',
      'Transportation': 'bg-blue-100 text-blue-800 border-blue-200',
      'Entertainment': 'bg-purple-100 text-purple-800 border-purple-200',
      'Income': 'bg-green-100 text-green-800 border-green-200',
      'Bills': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddTransaction = async (newTransaction: Omit<Transaction, '_id'>) => {
    try {
      await transactionAPI.create(newTransaction);
      // Refresh transactions
      const data = await transactionAPI.getAll();
      setTransactions(data);
      toast({
        title: 'Success',
        description: 'Transaction added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive',
      });
    }
  };

  const handleEditTransaction = async (updatedTransaction: Transaction) => {
    try {
      await transactionAPI.update(
        updatedTransaction._id,
        updatedTransaction
      );
      // Refresh transactions
      const data = await transactionAPI.getAll();
      setTransactions(data);
      toast({
        title: 'Success',
        description: 'Transaction updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update transaction',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionAPI.delete(id);
      // Refresh transactions
      setTransactions(transactions.filter((t) => t._id !== id));
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive mb-2">{error}</div>
        <Button 
          variant="outline" 
          onClick={() => {
            const fetchTransactions = async () => {
              setLoading(true);
              setError(null);
              try {
                const data = await transactionAPI.getAll();
                setTransactions(data);
              } catch (error) {
                console.error('Error fetching transactions:', error);
                setError('Failed to fetch transactions. Please try again later.');
                toast({
                  title: "Error",
                  description: "Failed to fetch transactions",
                  variant: "destructive",
                });
              } finally {
                setLoading(false);
              }
            };
            fetchTransactions();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>Add Transaction</Button>
      </div>

      <div className="divide-y divide-border">
        {transactions.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-muted-foreground">
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Add your first transaction to get started</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              Add your first transaction
            </Button>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction._id} className="p-3 sm:p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                  <div className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0
                    ${transaction.type === 'income' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-destructive/10 text-destructive'
                    }
                  `}>
                    {transaction.type === 'income' 
                      ? <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      : <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    }
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <h3 className="font-medium text-foreground text-sm sm:text-base truncate">
                        {transaction.description}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs self-start sm:self-auto ${getCategoryColor(transaction.category)}`}
                      >
                        {transaction.category}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 shrink-0">
                  <div className={`
                    text-right font-semibold text-sm sm:text-base
                    ${transaction.type === 'income' ? 'text-success' : 'text-foreground'}
                  `}>
                    {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                        <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsEditDialogOpen(true);
                      }}>
                        Edit
                      </DropdownMenuItem>
                    
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* These components would need to be created separately */}
      <AddTransactionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddTransaction={(transaction) => {
          // Convert Date to string before passing to handleAddTransaction
          handleAddTransaction({
            ...transaction,
            date: transaction.date.toISOString()
          });
        }}
      />

      {selectedTransaction && (
        <>
          <EditTransactionDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            transaction={{...selectedTransaction, id: selectedTransaction._id}}
            onEditTransaction={(transaction) => handleEditTransaction({ 
              ...transaction, 
              _id: selectedTransaction._id,
              date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date 
            })}
          />
          <DeleteTransactionDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            transactionId={selectedTransaction._id}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </>
      )}
    </div>
  );
};