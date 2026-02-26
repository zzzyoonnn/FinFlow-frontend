import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: () => void;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function CreateAccountModal({ isOpen, onClose, onAccountCreated }: CreateAccountModalProps) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!loginId || !password) {
      toast({ title: '오류', description: 'ID와 비밀번호를 모두 입력해주세요.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // ID로 사용자 조회
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, password')
        .eq('username', loginId)
        .maybeSingle();

      if (userError) throw userError;
      if (!user) {
        toast({ title: '오류', description: '존재하지 않는 사용자입니다.', variant: 'destructive' });
        return;
      }

      // 비밀번호 검증
      const hashedInput = await hashPassword(password);
      if (hashedInput !== user.password) {
        toast({ title: '오류', description: '비밀번호가 일치하지 않습니다.', variant: 'destructive' });
        return;
      }

      // 계좌번호 자동 생성 (랜덤 12자리)
      const accountNumber = Math.floor(100000000000 + Math.random() * 900000000000);
      const now = new Date().toISOString();

      // 계좌 비밀번호는 로그인 비밀번호와 동일하게 설정
      const { error } = await supabase.from('account').insert({
        number: accountNumber,
        password: hashedInput,
        balance: 0,
        user_id: user.id,
        created_at: now,
        updated_at: now,
      });

      if (error) throw error;

      toast({ title: '성공', description: '계좌가 생성되었습니다.' });
      setLoginId('');
      setPassword('');
      onAccountCreated();
      onClose();
    } catch (error: any) {
      toast({ title: '오류', description: error.message || '계좌 생성에 실패했습니다.', variant: 'destructive' });
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
            <Label htmlFor="login-id">아이디</Label>
            <Input
              id="login-id"
              type="text"
              placeholder="로그인 아이디를 입력하세요"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-password">비밀번호</Label>
            <Input
              id="account-password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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