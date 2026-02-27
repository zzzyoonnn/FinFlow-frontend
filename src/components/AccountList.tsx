import { CreditCard, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Account {
  id: number;
  number: string;
  balance: number;
}

interface AccountListProps {
  accounts: Account[];
  isLoading: boolean;
  selectedAccountId: number | null;
  onSelectAccount: (accountId: number) => void;
}

export function AccountList({ accounts, isLoading, selectedAccountId, onSelectAccount }: AccountListProps) {
  const [visibleBalances, setVisibleBalances] = useState<Set<number>>(new Set());

  const toggleBalanceVisibility = (accountId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisibleBalances(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const formatAccountNumber = (number: string) => {
    const numStr = number.toString().padStart(12, '0');
    return `${numStr.slice(0, 4)}-${numStr.slice(4, 8)}-${numStr.slice(8)}`;
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(balance);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">보유한 계좌가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => {
        const isSelected = selectedAccountId === account.id;
        const isBalanceVisible = visibleBalances.has(account.id);

        return (
          <Card
            key={account.id}
            className={`glass-card cursor-pointer transition-all hover:scale-[1.02] ${
              isSelected ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectAccount(account.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">계좌번호</p>
                    <p className="font-medium text-foreground">
                      {formatAccountNumber(account.number)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">잔액</p>
                    <p className="font-semibold text-foreground">
                      {isBalanceVisible ? formatBalance(account.balance) : '••••••••'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => toggleBalanceVisibility(account.id, e)}
                  >
                    {isBalanceVisible ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
