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

// Available budget categories
const AVAILABLE_CATEGORIES = ['Housing', 'Utilities', 'Food', 'Transportation', 'Entertainment', 'Shopping', 'Other'];

// Category colors for visual representation
const CATEGORY_COLORS = {
  Housing: '#4f46e5',
  Utilities: '#0ea5e9',
  Food: '#10b981',
  Transportation: '#f59e0b',
  Entertainment: '#8b5cf6',
  Shopping: '#ec4899',
  Other: '#6b7280'
};

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
      setEditedBudgets(prev => ({
        ...prev,
        [category]: amount
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Ensure all categories are included with at least 0 as default value
      const completeEditedBudgets = { ...editedBudgets };
      
      // Add any missing categories with default value of 0
      AVAILABLE_CATEGORIES.forEach(category => {
        if (!(category in completeEditedBudgets)) {
          completeEditedBudgets[category] = 0;
        }
      });
      
      // Convert to API format
      const budgetsArray = Object.entries(completeEditedBudgets).map(([category, amount]) => ({
        category,
        amount: Number(amount) || 0 // Ensure amount is a number and defaults to 0
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
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Enter budget amounts for categories you want to set. Any category without a value will default to 0.</p>
          </div>
          
          {/* Main categories with simplified UI */}
           <div className="space-y-4">
             {AVAILABLE_CATEGORIES.map(category => (
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
                   min="0"
                   step="50"
                   value={editedBudgets[category] || 0}
                   onChange={(e) => handleInputChange(category, e.target.value)}
                   className="text-right"
                   placeholder="0"
                  />
               </div>
             ))}
          </div>
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