import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  variant: 'deposit' | 'withdraw' | 'transfer';
}

const variantStyles = {
  deposit: 'hover:border-success/50 hover:shadow-success/20 group-hover:text-success group-hover:bg-success/20',
  withdraw: 'hover:border-warning/50 hover:shadow-warning/20 group-hover:text-warning group-hover:bg-warning/20',
  transfer: 'hover:border-primary/50 hover:shadow-primary/20 group-hover:text-primary group-hover:bg-primary/20',
};

const iconContainerVariants = {
  deposit: 'bg-success/10 text-success',
  withdraw: 'bg-warning/10 text-warning',
  transfer: 'bg-primary/10 text-primary',
};

export function ActionCard({ icon: Icon, title, description, onClick, variant }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "glass-card rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group w-full",
        variantStyles[variant]
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300",
        iconContainerVariants[variant]
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  );
}
