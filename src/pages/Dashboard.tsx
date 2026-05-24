import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Send, Shield, LogOut } from 'lucide-react';
import { BalanceCard } from '@/components/BalanceCard';
import { ActionCard } from '@/components/ActionCard';
import { TransactionList } from '@/components/TransactionList';
import { TransactionModal } from '@/components/TransactionModal';
import { AccountList } from '@/components/AccountList';
import { CreateAccountModal } from '@/components/CreateAccountModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useBankAccount } from '@/hooks/useBankAccount';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type TransactionType = 'deposit' | 'withdraw' | 'transfer';

interface Account {
  id: number;
  number: number;
  balance: number;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { loginUser } = useParams<{ loginUser: string }>();
  const { toast } = useToast();
  const { balance, transactions, deposit, withdraw, transfer } = useBankAccount();
  const [modalType, setModalType] = useState<TransactionType | null>(null);
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user?.id) return;

      setIsLoadingAccounts(true);
      try {
        const { data, error } = await supabase
            .from('account')
            .select('id, number, balance, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        setAccounts(data || []);
        if (data && data.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [user?.id]);

  const refreshAccounts = async () => {
    if (!user?.id) return;
    const { data } = await supabase
        .from('account')
        .select('id, number, balance, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    setAccounts(data || []);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    toast({
      title: "로그아웃",
      description: "성공적으로 로그아웃되었습니다.",
    });
    navigate('/');
  };

  const openModal = (type: TransactionType) => setModalType(type);
  const closeModal = () => setModalType(null);

  const displayName = user?.fullname || loginUser || '게스트';

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
                  <h1 className="text-xl font-bold text-foreground">FinFlow</h1>
                  <p className="text-xs text-muted-foreground">개인 뱅킹</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {displayName}님
              </span>
                {user && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">로그아웃</span>
                    </Button>
                )}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Account List Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">내 계좌</h2>
              <Button size="sm" onClick={() => setIsCreateAccountOpen(true)}>
                + 계좌 생성
              </Button>
            </div>
            <AccountList
                accounts={accounts}
                isLoading={isLoadingAccounts}
                selectedAccountId={selectedAccountId}
                onSelectAccount={setSelectedAccountId}
            />
          </section>

          {/* Balance Section - Show selected account balance */}
          {selectedAccountId && (
              <section className="mb-8">
                <BalanceCard
                    balance={accounts.find(a => a.id === selectedAccountId)?.balance || 0}
                />
              </section>
          )}

          {/* Quick Actions */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">빠른 작업</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ActionCard
                  icon={ArrowDownLeft}
                  title="입금"
                  description="계좌에 자금을 입금합니다"
                  onClick={() => openModal('deposit')}
                  variant="deposit"
              />
              <ActionCard
                  icon={ArrowUpRight}
                  title="출금"
                  description="계좌에서 출금합니다"
                  onClick={() => openModal('withdraw')}
                  variant="withdraw"
              />
              <ActionCard
                  icon={Send}
                  title="이체"
                  description="다른 계좌로 송금합니다"
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

        {/* Create Account Modal */}
        {user && (
            <CreateAccountModal
                isOpen={isCreateAccountOpen}
                onClose={() => setIsCreateAccountOpen(false)}
                onAccountCreated={refreshAccounts}
            />
        )}
      </div>
  );
};

export default Dashboard;
