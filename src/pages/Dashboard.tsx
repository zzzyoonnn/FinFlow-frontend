import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Send, Shield, LogOut } from 'lucide-react';
import { BalanceCard } from '@/components/BalanceCard';
import { ActionCard } from '@/components/ActionCard';
import { TransactionList } from '@/components/TransactionList';
import { TransactionModal } from '@/components/TransactionModal';
import { AccountList } from '@/components/AccountList';
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

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // URL의 loginUser와 저장된 사용자 정보가 일치하는지 확인
      if (parsedUser.username === loginUser) {
        setUser(parsedUser);
      } else {
        // 일치하지 않으면 로그인 페이지로 이동
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate, loginUser]);

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

  if (!user) {
    return null;
  }

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
                <p className="text-xs text-muted-foreground">Personal Banking</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.fullname}님
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Account List Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">내 계좌</h2>
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

export default Dashboard;
