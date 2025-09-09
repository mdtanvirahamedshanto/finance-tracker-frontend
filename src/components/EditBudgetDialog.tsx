import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

// Available budget categories
const AVAILABLE_CATEGORIES = [
  'Housing',
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Other',
  // Add more categories as needed
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
  const [newCategory, setNewCategory] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('0');
  const { toast } = useToast();
  
  // Get categories that are not yet in the budget
  const availableCategories = AVAILABLE_CATEGORIES.filter(
    category => !Object.keys(editedBudgets).includes(category)
  );

  const handleInputChange = (category: string, value: string) => {
    const amount = parseInt(value, 10);
    if (!isNaN(amount) && amount >= 0) {
      setEditedBudgets(prev => ({
        ...prev,
        [category]: amount
      }));
    }
  };
  
  const handleAddCategory = () => {
    if (newCategory && !editedBudgets[newCategory]) {
      const amount = parseInt(newAmount, 10);
      if (!isNaN(amount) && amount >= 0) {
        setEditedBudgets(prev => ({
          ...prev,
          [newCategory]: amount
        }));
        setNewCategory('');
        setNewAmount('0');
      }
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
          {/* Existing budget items */}
          {Object.entries(editedBudgets).map(([category, amount]) => (
            <div key={category} className="grid grid-cols-2 items-center gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: CATEGORY_COLORS[category] || CATEGORY_COLORS.Other }}
                />
                <Label htmlFor={`budget-${category}`} className="text-sm">
                  {category}
                </Label>
              </div>
              <Input
                id={`budget-${category}`}
                type="number"
                value={amount}
                onChange={(e) => handleInputChange(category, e.target.value)}
                className="text-right"
              />
            </div>
          ))}
          
          {/* Add new category */}
          {availableCategories.length > 0 && (
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-3">Add New Category</h4>
              <div className="grid grid-cols-[1fr,auto,auto] gap-2 items-center">
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-24 text-right"
                />
                <Button 
                  type="button" 
                  size="icon" 
                  onClick={handleAddCategory}
                  disabled={!newCategory}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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