import { Wallet } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(balance);

  return (
    <div className="glass-card rounded-2xl p-8 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse-glow">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">Available Balance</p>
          <p className="text-xs text-muted-foreground/70">Main Account</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-4xl md:text-5xl font-bold text-gradient tracking-tight">
          {formattedBalance}
        </h2>
        <p className="text-sm text-muted-foreground">
          Updated just now
        </p>
      </div>
    </div>
  );
}
