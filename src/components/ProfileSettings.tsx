import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
}

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettings({ open, onOpenChange }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const { toast } = useToast();

  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      try {
        setProfile({
          _id: user.id,
          name: user.name,
          email: user.email
        });
        setName(user.name);
        setEmail(user.email);
        
        // Get savings goal from localStorage if available
        const savedGoal = localStorage.getItem('savingsGoal');
        if (savedGoal) {
          setSavingsGoal(savedGoal);
        } else {
          setSavingsGoal('10000'); // Default value
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  }, [open, toast]);

  const { updateProfile } = useAuth();

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update user profile through AuthContext
      await updateProfile({ name, email });
      
      // Still store savings goal in localStorage as it's not part of the user profile in the backend
      localStorage.setItem('savingsGoal', savingsGoal);
      
      toast({
        title: 'Success',
        description: 'Profile settings updated successfully',
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your personal information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-4">Loading profile data...</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
             
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}