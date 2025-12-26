export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  date: Date;
  recipient?: string;
}

export interface BankAccount {
  balance: number;
  transactions: Transaction[];
}
