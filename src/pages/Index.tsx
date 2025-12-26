import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Send, Shield } from 'lucide-react';
import { BalanceCard } from '@/components/BalanceCard';
import { ActionCard } from '@/components/ActionCard';
import { TransactionList } from '@/components/TransactionList';
import { TransactionModal } from '@/components/TransactionModal';
import { useBankAccount } from '@/hooks/useBankAccount';

type TransactionType = 'deposit' | 'withdraw' | 'transfer';

const Index = () => {
  const { balance, transactions, deposit, withdraw, transfer } = useBankAccount();
  const [modalType, setModalType] = useState<TransactionType | null>(null);

  const openModal = (type: TransactionType) => setModalType(type);
  const closeModal = () => setModalType(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SecureBank</h1>
                <p className="text-xs text-muted-foreground">Personal Banking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Balance Section */}
        <section className="mb-8">
          <BalanceCard balance={balance} />
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ActionCard
              icon={ArrowDownLeft}
              title="Deposit"
              description="Add funds to your account"
              onClick={() => openModal('deposit')}
              variant="deposit"
            />
            <ActionCard
              icon={ArrowUpRight}
              title="Withdraw"
              description="Cash out from your account"
              onClick={() => openModal('withdraw')}
              variant="withdraw"
            />
            <ActionCard
              icon={Send}
              title="Transfer"
              description="Send money to others"
              onClick={() => openModal('transfer')}
              variant="transfer"
            />
          </div>
        </section>

        {/* Transaction History */}
        <section>
          <TransactionList transactions={transactions} />
        </section>
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        type={modalType}
        isOpen={modalType !== null}
        onClose={closeModal}
        onDeposit={deposit}
        onWithdraw={withdraw}
        onTransfer={transfer}
        currentBalance={balance}
      />
    </div>
  );
};

export default Index;
