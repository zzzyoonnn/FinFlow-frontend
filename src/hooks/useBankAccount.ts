import { useState, useCallback } from 'react';
import { Transaction, BankAccount } from '@/types/banking';

const initialTransactions: Transaction[] = [
  {
    id: '1',
    type: 'deposit',
    amount: 5000,
    description: 'Initial deposit',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    type: 'deposit',
    amount: 2500,
    description: 'Salary payment',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'withdrawal',
    amount: 150,
    description: 'ATM withdrawal',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    type: 'transfer',
    amount: 500,
    description: 'Transfer to savings',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    recipient: 'Savings Account',
  },
];

const initialBalance = initialTransactions.reduce((acc, tx) => {
  if (tx.type === 'deposit') return acc + tx.amount;
  return acc - tx.amount;
}, 0);

export function useBankAccount() {
  const [account, setAccount] = useState<BankAccount>({
    balance: initialBalance,
    transactions: initialTransactions,
  });

  const deposit = useCallback((amount: number, description: string) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount,
      description,
      date: new Date(),
    };

    setAccount((prev) => ({
      balance: prev.balance + amount,
      transactions: [newTransaction, ...prev.transactions],
    }));

    return true;
  }, []);

  const withdraw = useCallback((amount: number, description: string) => {
    if (amount > account.balance) {
      return false;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'withdrawal',
      amount,
      description,
      date: new Date(),
    };

    setAccount((prev) => ({
      balance: prev.balance - amount,
      transactions: [newTransaction, ...prev.transactions],
    }));

    return true;
  }, [account.balance]);

  const transfer = useCallback((amount: number, recipient: string, description: string) => {
    if (amount > account.balance) {
      return false;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'transfer',
      amount,
      description,
      date: new Date(),
      recipient,
    };

    setAccount((prev) => ({
      balance: prev.balance - amount,
      transactions: [newTransaction, ...prev.transactions],
    }));

    return true;
  }, [account.balance]);

  return {
    balance: account.balance,
    transactions: account.transactions,
    deposit,
    withdraw,
    transfer,
  };
}
