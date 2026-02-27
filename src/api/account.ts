import api from './axios';

// ==================== Request 타입 ====================

export interface AccountSaveReq {
    number: string;       // 10자리 숫자 문자열
    password: number;     // 4자리
}

export interface AccountDepositReq {
    number: string;
    amount: number;
    transactionType: 'DEPOSIT';
    tel: string;          // 형식: 010-1234-5678
}

export interface AccountWithdrawReq {
    number: string;
    password: number;
    amount: number;
    transactionType: 'WITHDRAW';
}

export interface AccountTransferReq {
    withdrawNumber: string;
    depositNumber: string;
    withdrawPassword: number;
    amount: number;
    transactionType: 'TRANSFER';
}

// ==================== Response 타입 ====================

export interface AccountSaveResp {
    id: number;
    number: string;
    balance: number;
}

export interface AccountListResp {
    fullname: string;
    accountList: {
        id: number;
        number: string;
        balance: number;
    }[];
}

export interface AccountDepositResp {
    id: number;
    number: string;
    transaction: {
        id: number;
        transactionType: string;
        sender: string;
        receiver: string;
        amount: number;
        tel: string;
        createdAt: string;
    };
}

export interface AccountWithdrawResp {
    id: number;
    number: string;
    balance: number;
    transaction: {
        id: number;
        transactionType: string;
        sender: string;
        receiver: string;
        amount: number;
        createdAt: string;
    };
}

export interface AccountTransferResp {
    id: number;
    number: string;
    balance: number;
    transaction: {
        id: number;
        transactionType: string;
        sender: string;
        receiver: string;
        amount: number;
        createdAt: string;
    };
}

export interface AccountDetailResp {
    id: number;
    number: string;
    balance: number;
    transactionList: {
        id: number;
        transactionType: string;
        amount: number;
        sender: string;
        receiver: string;
        tel: string;
        createdAt: string;
        balance: number;
    }[];
}

// ==================== API 함수 ====================

export const saveAccount = (data: AccountSaveReq) =>
    api.post<{ data: AccountSaveResp }>('/s/account', data);

export const getMyAccounts = () =>
    api.get<{ data: AccountListResp }>('/s/account/loginUser');

export const deleteAccount = (number: string) =>
    api.delete(`/s/account/${number}`);

export const depositAccount = (data: AccountDepositReq) =>
    api.post<{ data: AccountDepositResp }>('/account/deposit', data);

export const withdrawAccount = (data: AccountWithdrawReq) =>
    api.post<{ data: AccountWithdrawResp }>('/s/account/withdraw', data);

export const transferAccount = (data: AccountTransferReq) =>
    api.post<{ data: AccountTransferResp }>('/s/account/transfer', data);

export const getAccountDetail = (number: string, page: number = 0) =>
    api.get<{ data: AccountDetailResp }>(`/s/account/${number}`, { params: { page } });