import { useState, useEffect } from 'react';
import { PiggyBank, Edit2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { savingsGoalAPI } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SavingsGoalCardProps {
  currentSavings?: number;
  initialGoal?: number;
}

export function SavingsGoalCard({ currentSavings = 0, initialGoal = 10000 }: SavingsGoalCardProps) {
  const [savingsGoal, setSavingsGoal] = useState(initialGoal);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoalAmount, setNewGoalAmount] = useState(savingsGoal.toString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Load savings goal from API on component mount
  useEffect(() => {
    const fetchSavingsGoal = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await savingsGoalAPI.get();
        setSavingsGoal(data.amount);
        setNewGoalAmount(data.amount.toString());
      } catch (error) {
        console.error('Error loading savings goal:', error);
        setError('Failed to load savings goal data');
        toast({
          title: "Error",
          description: "Failed to load savings goal",
          variant: "destructive",
        });
        // Fallback to initialGoal if API fails
        setSavingsGoal(initialGoal);
        setNewGoalAmount(initialGoal.toString());
      } finally {
        setLoading(false);
      }
    };

    fetchSavingsGoal();
  }, [toast, initialGoal]);
  
  const handleSaveGoal = async () => {
    setLoading(true);
    setError(null);
    try {
      const goalAmount = parseInt(newGoalAmount, 10);
      if (!isNaN(goalAmount) && goalAmount > 0) {
        // Save to API
        await savingsGoalAPI.update(goalAmount);
        setSavingsGoal(goalAmount);
        setIsDialogOpen(false);
        toast({
          title: "Success",
          description: "Savings goal updated successfully",
        });
      } else {
        setError('Please enter a valid positive number');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      setError('Failed to save your goal');
      toast({
        title: "Error",
        description: "Failed to update savings goal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const progress = (currentSavings / savingsGoal) * 100;
  const remaining = savingsGoal - currentSavings;
  
  return (
    <>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Savings Goal
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => setIsDialogOpen(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          {error && (
            <div className="text-destructive text-sm mt-2">{error}</div>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Goal: ${savingsGoal.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">
                ${currentSavings.toLocaleString()} saved
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {progress.toFixed(1)}% complete
              </span>
              <span className="text-muted-foreground">
                ${remaining.toLocaleString()} to go
              </span>
            </div>
          </div>
          
          <div className="text-sm">
            <p className="text-muted-foreground">
              {remaining <= 0 
                ? "Congratulations! You've reached your savings goal! 🎉" 
                : `Keep saving! You're ${progress.toFixed(1)}% of the way to your goal.`
              }
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Savings Goal</DialogTitle>
            <DialogDescription>
              Set a new target amount for your savings goal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goal-amount">Goal Amount ($)</Label>
              <Input
                id="goal-amount"
                type="number"
                min="1"
                step="100"
                value={newGoalAmount}
                onChange={(e) => setNewGoalAmount(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSaveGoal} disabled={loading}>
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
    </>
  );
}