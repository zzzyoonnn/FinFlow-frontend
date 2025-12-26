import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownLeft, ArrowUpRight, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

type TransactionType = 'deposit' | 'withdraw' | 'transfer';

interface TransactionModalProps {
  type: TransactionType | null;
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number, description: string) => boolean;
  onWithdraw: (amount: number, description: string) => boolean;
  onTransfer: (amount: number, recipient: string, description: string) => boolean;
  currentBalance: number;
}

const typeConfig = {
  deposit: {
    title: 'Deposit Funds',
    description: 'Add money to your account',
    icon: ArrowDownLeft,
    buttonText: 'Deposit',
    buttonVariant: 'success' as const,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
  },
  withdraw: {
    title: 'Withdraw Funds',
    description: 'Withdraw money from your account',
    icon: ArrowUpRight,
    buttonText: 'Withdraw',
    buttonVariant: 'warning' as const,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
  },
  transfer: {
    title: 'Transfer Funds',
    description: 'Send money to another account',
    icon: Send,
    buttonText: 'Transfer',
    buttonVariant: 'default' as const,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
};

export function TransactionModal({
  type,
  isOpen,
  onClose,
  onDeposit,
  onWithdraw,
  onTransfer,
  currentBalance,
}: TransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const { toast } = useToast();

  if (!type) return null;

  const config = typeConfig[type];
  const Icon = config.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid positive amount',
        variant: 'destructive',
      });
      return;
    }

    if ((type === 'withdraw' || type === 'transfer') && numAmount > currentBalance) {
      toast({
        title: 'Insufficient funds',
        description: 'You do not have enough balance for this transaction',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'transfer' && !recipient.trim()) {
      toast({
        title: 'Recipient required',
        description: 'Please enter a recipient for the transfer',
        variant: 'destructive',
      });
      return;
    }

    let success = false;
    const desc = description.trim() || `${type.charAt(0).toUpperCase() + type.slice(1)}`;

    switch (type) {
      case 'deposit':
        success = onDeposit(numAmount, desc);
        break;
      case 'withdraw':
        success = onWithdraw(numAmount, desc);
        break;
      case 'transfer':
        success = onTransfer(numAmount, recipient, desc);
        break;
    }

    if (success) {
      toast({
        title: 'Transaction successful',
        description: `Your ${type} of $${numAmount.toFixed(2)} has been processed`,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setRecipient('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-border/50 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.iconBg)}>
              <Icon className={cn("w-6 h-6", config.iconColor)} />
            </div>
            <div>
              <DialogTitle className="text-xl">{config.title}</DialogTitle>
              <DialogDescription>{config.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary/50 border-border text-lg font-semibold"
              autoFocus
            />
          </div>

          {type === 'transfer' && (
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                placeholder="Enter recipient name or account"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="What's this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant={config.buttonVariant} className="flex-1">
              {config.buttonText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
