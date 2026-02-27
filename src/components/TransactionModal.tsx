import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownLeft, ArrowUpRight, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { depositAccount, withdrawAccount, transferAccount } from '@/api/account';

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
      toast({ title: '금액 오류', description: '올바른 금액을 입력해주세요.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      if (type === 'deposit') {
        if (!accountNumber.trim()) {
          toast({ title: '계좌번호 필요', description: '입금할 계좌번호를 입력해주세요.', variant: 'destructive' });
          setIsProcessing(false);
          return;
        }
        await depositAccount({
          number: accountNumber.replace(/-/g, ''),
          amount: numAmount,
          transactionType: 'DEPOSIT',
          tel: '010-0000-0000',  // 입금은 tel 필수, 임시값 사용
        });
        toast({ title: '입금 완료', description: `₩${numAmount.toLocaleString('ko-KR')} 입금되었습니다.` });

      } else if (type === 'withdraw') {
        if (!accountNumber.trim()) {
          toast({ title: '계좌번호 필요', description: '출금할 계좌번호를 입력해주세요.', variant: 'destructive' });
          setIsProcessing(false);
          return;
        }
        if (!accountPassword.trim()) {
          toast({ title: '비밀번호 필요', description: '계좌 비밀번호를 입력해주세요.', variant: 'destructive' });
          setIsProcessing(false);
          return;
        }
        await withdrawAccount({
          number: accountNumber.replace(/-/g, ''),
          password: parseInt(accountPassword),
          amount: numAmount,
          transactionType: 'WITHDRAW',
        });
        toast({ title: '출금 완료', description: `₩${numAmount.toLocaleString('ko-KR')} 출금되었습니다.` });

      } else if (type === 'transfer') {
        if (!accountNumber.trim() || !depositAccountNumber.trim() || !accountPassword.trim()) {
          toast({ title: '입력 오류', description: '모든 항목을 입력해주세요.', variant: 'destructive' });
          setIsProcessing(false);
          return;
        }
        await transferAccount({
          withdrawNumber: accountNumber.replace(/-/g, ''),
          depositNumber: depositAccountNumber.replace(/-/g, ''),
          withdrawPassword: parseInt(accountPassword),
          amount: numAmount,
          transactionType: 'TRANSFER',
        });
        toast({ title: '이체 완료', description: `₩${numAmount.toLocaleString('ko-KR')} 이체되었습니다.` });
      }

      handleClose();
    } catch (error) {
      let message = '처리 중 오류가 발생했습니다.';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.msg || message;
      }
      toast({ title: '처리 실패', description: message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
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
                <Label htmlFor="accountNumber">계좌번호</Label>
                <Input
                    id="accountNumber"
                    type="text"
                    placeholder="입금할 계좌번호 입력"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="bg-secondary/50 border-border"
                    autoFocus
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
