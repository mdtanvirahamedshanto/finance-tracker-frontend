import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { budgetAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface BudgetItem {
  category: string;
  budgeted: number;
  spent?: number;
  color?: string;
}

interface EditBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetItems: BudgetItem[];
  onBudgetsUpdated: () => void;
}

export function EditBudgetDialog({ 
  open, 
  onOpenChange, 
  budgetItems, 
  onBudgetsUpdated 
}: EditBudgetDialogProps) {
  const [editedBudgets, setEditedBudgets] = useState<Record<string, number>>(() => {
    const initialBudgets: Record<string, number> = {};
    budgetItems.forEach(item => {
      initialBudgets[item.category] = item.budgeted;
    });
    return initialBudgets;
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (category: string, value: string) => {
    const amount = parseInt(value, 10);
    if (!isNaN(amount) && amount >= 0) {
      // Create a new object to hold the updated budgets
      const newBudgets: Record<string, number> = {};
      
      // First, set all other categories to 0
      budgetItems.forEach(item => {
        if (item.category !== category) {
          newBudgets[item.category] = 0;
        }
      });
      
      // Then, set the value for the selected category
      newBudgets[category] = amount;
      
      setEditedBudgets(newBudgets);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Convert to array format for API
      const budgetsArray = Object.entries(editedBudgets).map(([category, amount]) => ({
        category,
        amount
      }));
      
      await budgetAPI.updateBatch(budgetsArray);
      
      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
      
      onBudgetsUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating budgets:', error);
      toast({
        title: "Error",
        description: "Failed to update budgets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>
            Update your monthly budget for each category.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {budgetItems.map((item) => (
            <div key={item.category} className="grid grid-cols-2 items-center gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color || 'hsl(210, 30%, 60%)' }}
                />
                <Label htmlFor={`budget-${item.category}`} className="text-sm">
                  {item.category}
                </Label>
              </div>
              <Input
                id={`budget-${item.category}`}
                type="number"
                min="0"
                step="50"
                // The value of the input should reflect the state
                value={editedBudgets[item.category] || 0}
                onChange={(e) => handleInputChange(item.category, e.target.value)}
                className="text-right"
              />
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}