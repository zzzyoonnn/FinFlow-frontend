import { Transaction } from '@/types/banking';
import { TransactionItem } from './TransactionItem';
import { History } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <History className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">{transactions.length} transactions</p>
        </div>
      </div>
      
      <div className="space-y-1">
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No transactions yet</p>
        ) : (
          transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))
        )}
      </div>
    </div>
  );
}
