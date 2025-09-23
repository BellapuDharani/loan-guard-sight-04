import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileCreationDialogProps {
  open: boolean;
  onClose: () => void;
  mobile: string;
  onProfileCreated: (profile: { name: string; loanId: string }) => void;
}

export interface UserProfile {
  id: string;
  mobile: string;
  name: string;
  loanId: string;
  createdAt: Date;
}

export const ProfileCreationDialog: React.FC<ProfileCreationDialogProps> = ({
  open,
  onClose,
  mobile,
  onProfileCreated
}) => {
  const [name, setName] = useState('');
  const [loanId, setLoanId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateProfile = () => {
    if (!name.trim() || !loanId.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your name and loan ID',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Create profile object - don't save to localStorage yet (AuthContext will handle that)
    const profile = {
      name: name.trim(),
      loanId: loanId.trim()
    };

    console.log('Sending profile data:', profile);
    onProfileCreated(profile);
    onClose(); // Close dialog after sending data
    
    // Reset form
    setName('');
    setLoanId('');
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Create Your Profile
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Please provide your details to create your profile for mobile: <span className="font-medium text-foreground">{mobile}</span>
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loanId">Loan ID</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="loanId"
                  placeholder="Enter your loan ID"
                  value={loanId}
                  onChange={(e) => setLoanId(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="flex">
            <Button
              onClick={handleCreateProfile}
              className="w-full btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Profile'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};