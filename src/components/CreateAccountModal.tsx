import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { saveAccount } from '@/api/account';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: () => void;
}

export function CreateAccountModal({ isOpen, onClose, onAccountCreated }: CreateAccountModalProps) {
  const [accountNumber, setAccountNumber] = useState('');  // loginId → accountNumber
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!accountNumber || !password) {
      toast({ title: '오류', description: '계좌번호와 비밀번호를 모두 입력해주세요.', variant: 'destructive' });
      return;
    }

    if (accountNumber.length !== 10) {
      toast({ title: '오류', description: '계좌번호는 10자리여야 합니다.', variant: 'destructive' });
      return;
    }

    if (password.length !== 4) {
      toast({ title: '오류', description: '계좌 비밀번호는 4자리여야 합니다.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await saveAccount({
        number: accountNumber,
        password: parseInt(password),
      });

      toast({ title: '성공', description: '계좌가 생성되었습니다.' });
      setAccountNumber('');
      setPassword('');
      onAccountCreated();
      onClose();
    } catch (error) {
      let message = '계좌 생성에 실패했습니다.';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.msg || message;
      }
      toast({ title: '오류', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 계좌 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account-number">계좌번호 (10자리)</Label>
              <Input
                  id="account-number"
                  type="text"
                  placeholder="10자리 계좌번호를 입력하세요"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-password">계좌 비밀번호 (4자리)</Label>
              <Input
                  id="account-password"
                  type="password"
                  placeholder="4자리 비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={4}
              />
            </div>
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
              {isLoading ? '생성 중...' : '계좌 생성'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
}