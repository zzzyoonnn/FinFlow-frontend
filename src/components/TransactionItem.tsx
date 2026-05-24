import { ArrowDownLeft, ArrowUpRight, Send } from 'lucide-react';
import { Transaction } from '@/types/banking';
import { cn } from '@/lib/utils';

interface TransactionItemProps {
  transaction: Transaction;
}

const typeConfig = {
  deposit: {
    icon: ArrowDownLeft,
    color: 'text-success',
    bgColor: 'bg-success/10',
    prefix: '+',
  },
  withdrawal: {
    icon: ArrowUpRight,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    prefix: '-',
  },
  transfer: {
    icon: Send,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    prefix: '-',
  },
};

export function TransactionItem({ transaction }: TransactionItemProps) {
  const config = typeConfig[transaction.type];
  const Icon = config.icon;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(transaction.amount);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(transaction.date);

  return (
      <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors duration-200">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgColor)}>
          <Icon className={cn("w-5 h-5", config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{transaction.description}</p>
          <p className="text-sm text-muted-foreground">
            {formattedDate}
            {transaction.recipient && ` • To: ${transaction.recipient}`}
          </p>
        </div>

        <div className={cn("font-semibold tabular-nums", config.color)}>
          {config.prefix}{formattedAmount}
        </div>
      </div>
  );
}
