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
    title: '이체',
    description: '다른 계좌로 송금합니다',
    icon: Send,
    buttonText: '이체하기',
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
  const [depositAccountNumber, setDepositAccountNumber] = useState('');
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

    // Transfer-specific logic
    if (type === 'transfer') {
      if (!accountNumber.trim()) {
        toast({ title: '출금계좌 필요', description: '출금할 계좌번호를 입력해주세요.', variant: 'destructive' });
        return;
      }
      if (!depositAccountNumber.trim()) {
        toast({ title: '입금계좌 필요', description: '입금할 계좌번호를 입력해주세요.', variant: 'destructive' });
        return;
      }
      if (!accountPassword.trim()) {
        toast({ title: '비밀번호 필요', description: '출금 계좌 비밀번호를 입력해주세요.', variant: 'destructive' });
        return;
      }

      setIsProcessing(true);
      try {
        // Find withdraw account
        const { data: withdrawAccount, error: wErr } = await supabase
          .from('account')
          .select('id, number, balance, password')
          .eq('number', parseInt(accountNumber.replace(/-/g, ''), 10))
          .single();

        if (wErr || !withdrawAccount) {
          toast({ title: '출금계좌 없음', description: '출금 계좌번호를 찾을 수 없습니다.', variant: 'destructive' });
          setIsProcessing(false);
          return;
        }

        // Verify password
        const hashedInput = await hashPassword(accountPassword);
        if (hashedInput !== withdrawAccount.password) {
          toast({ title: '비밀번호 오류', description: '출금 계좌 비밀번호가 일치하지 않습니다.', variant: 'destructive' });
          setIsProcessing(false);
          return;
        }

        // Check balance
        if (numAmount > withdrawAccount.balance) {
          toast({ title: '잔액 부족', description: '이체 금액이 출금 계좌 잔액을 초과합니다.', variant: 'destructive' });
          setIsProcessing(false);
          return;
        }

        // Find deposit account
        const { data: depositAccount, error: dErr } = await supabase
          .from('account')
          .select('id, number, balance')
          .eq('number', parseInt(depositAccountNumber.replace(/-/g, ''), 10))
          .single();

        if (dErr || !depositAccount) {
          toast({ title: '입금계좌 없음', description: '입금 계좌번호를 찾을 수 없습니다.', variant: 'destructive' });
          setIsProcessing(false);
          return;
        }

        if (withdrawAccount.id === depositAccount.id) {
          toast({ title: '이체 불가', description: '출금계좌와 입금계좌가 동일합니다.', variant: 'destructive' });
          setIsProcessing(false);
          return;
        }

        const newWithdrawBalance = withdrawAccount.balance - numAmount;
        const newDepositBalance = depositAccount.balance + numAmount;
        const now = new Date().toISOString();

        // Update both accounts
        const { error: u1 } = await supabase
          .from('account')
          .update({ balance: newWithdrawBalance, updated_at: now })
          .eq('id', withdrawAccount.id);
        if (u1) throw u1;

        const { error: u2 } = await supabase
          .from('account')
          .update({ balance: newDepositBalance, updated_at: now })
          .eq('id', depositAccount.id);
        if (u2) throw u2;

        // Record transaction
        await supabase.from('account_transaction').insert({
          transaction_type: 'TRANSFER',
          amount: numAmount,
          withdraw_account_id: withdrawAccount.id,
          withdraw_account_balance: newWithdrawBalance,
          deposit_account_id: depositAccount.id,
          deposit_account_balance: newDepositBalance,
          created_at: now,
          updated_at: now,
        });

        toast({
          title: '이체 완료',
          description: `₩${numAmount.toLocaleString('ko-KR')} 이체되었습니다.`,
        });
        handleClose();
      } catch (err) {
        console.error('Transfer error:', err);
        toast({ title: '이체 실패', description: '이체 처리 중 오류가 발생했습니다.', variant: 'destructive' });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Deposit only
    let success = false;
    const desc = description.trim() || 'Deposit';

    if (type === 'deposit') {
      success = onDeposit(numAmount, desc);
    }

    if (success) {
      toast({
        title: 'Transaction successful',
        description: `Your deposit of $${numAmount.toFixed(2)} has been processed`,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setRecipient('');
    setAccountNumber('');
    setDepositAccountNumber('');
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

          {type === 'transfer' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">출금계좌</Label>
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
                <Label htmlFor="depositAccountNumber">입금계좌</Label>
                <Input
                  id="depositAccountNumber"
                  type="text"
                  placeholder="입금할 계좌번호 입력"
                  value={depositAccountNumber}
                  onChange={(e) => setDepositAccountNumber(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferPassword">출금계좌 비밀번호</Label>
                <Input
                  id="transferPassword"
                  type="password"
                  placeholder="출금 계좌 비밀번호 입력"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">
              {type === 'withdraw' ? '출금액 (₩)' : type === 'transfer' ? '이체금액 (₩)' : 'Amount ($)'}
            </Label>
            <Input
              id="amount"
              type="number"
              step="1"
              min="1"
              placeholder={type === 'withdraw' || type === 'transfer' ? '0' : '0.00'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary/50 border-border text-lg font-semibold"
              autoFocus={type === 'deposit'}
            />
          </div>

          {type === 'deposit' && (
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
