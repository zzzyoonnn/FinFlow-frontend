import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownLeft, ArrowUpRight, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
    title: '출금',
    description: '계좌에서 출금합니다',
    icon: ArrowUpRight,
    buttonText: '출금하기',
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

// SHA-256 hash to match edge function logic
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
  const [accountNumber, setAccountNumber] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  if (!type) return null;

  const config = typeConfig[type];
  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: '금액 오류',
        description: '올바른 금액을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    // Withdraw-specific validation
    if (type === 'withdraw') {
      if (!accountNumber.trim()) {
        toast({
          title: '계좌번호 필요',
          description: '출금할 계좌번호를 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }

      if (!accountPassword.trim()) {
        toast({
          title: '비밀번호 필요',
          description: '계좌 비밀번호를 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }

      setIsProcessing(true);
      try {
        // Find account by number
        const { data: account, error } = await supabase
          .from('account')
          .select('id, number, balance, password')
          .eq('number', parseInt(accountNumber.replace(/-/g, ''), 10))
          .single();

        if (error || !account) {
          toast({
            title: '계좌 없음',
            description: '해당 계좌번호를 찾을 수 없습니다.',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        // Verify password
        const hashedInput = await hashPassword(accountPassword);
        if (hashedInput !== account.password) {
          toast({
            title: '비밀번호 오류',
            description: '계좌 비밀번호가 일치하지 않습니다.',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        // Check balance
        if (numAmount > account.balance) {
          toast({
            title: '잔액 부족',
            description: '출금 금액이 계좌 잔액을 초과합니다.',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        // Process withdrawal
        const newBalance = account.balance - numAmount;
        const { error: updateError } = await supabase
          .from('account')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', account.id);

        if (updateError) throw updateError;

        // Record transaction
        await supabase.from('account_transaction').insert({
          transaction_type: 'WITHDRAW',
          amount: numAmount,
          withdraw_account_id: account.id,
          withdraw_account_balance: newBalance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        toast({
          title: '출금 완료',
          description: `₩${numAmount.toLocaleString('ko-KR')} 출금되었습니다.`,
        });
        handleClose();
      } catch (err) {
        console.error('Withdraw error:', err);
        toast({
          title: '출금 실패',
          description: '출금 처리 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if ((type === 'transfer') && numAmount > currentBalance) {
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
    setAccountNumber('');
    setAccountPassword('');
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
          {type === 'withdraw' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">계좌번호</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="출금할 계좌번호 입력"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="bg-secondary/50 border-border"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountPassword">계좌 비밀번호</Label>
                <Input
                  id="accountPassword"
                  type="password"
                  placeholder="계좌 비밀번호 입력"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">{type === 'withdraw' ? '출금액 (₩)' : 'Amount ($)'}</Label>
            <Input
              id="amount"
              type="number"
              step="1"
              min="1"
              placeholder={type === 'withdraw' ? '0' : '0.00'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary/50 border-border text-lg font-semibold"
              autoFocus={type !== 'withdraw'}
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

          {type !== 'withdraw' && (
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
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" variant={config.buttonVariant} className="flex-1" disabled={isProcessing}>
              {isProcessing ? '처리 중...' : config.buttonText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
