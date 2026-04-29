export type CardStatus = 'active' | 'frozen' | 'blocked';
export type CardScheme = 'verve' | 'verve-global';

export interface VerveCard {
  id: string;
  nickname: string;
  pan: string;            // full PAN (mock only — never store real)
  expiry: string;         // MM/YY
  cvv: string;
  cardholder: string;
  status: CardStatus;
  scheme: CardScheme;
  gradient: 'card-1' | 'card-2' | 'card-3';
  controls: {
    online: boolean;
    atm: boolean;
    international: boolean;
  };
  limits: {
    daily: number;          // KES
    perTransaction: number; // KES
  };
  balance: number;          // KES
  isVirtual: boolean;
}

export type TxCategory = 'food' | 'transport' | 'bills' | 'shopping' | 'income' | 'others';
export type TxStatus = 'success' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  cardId?: string;
  accountId?: string;
  merchant: string;
  amount: number;        // negative = debit, positive = credit
  date: string;          // ISO
  category: TxCategory;
  status: TxStatus;
  channel: 'pos' | 'atm' | 'online' | 'bill' | 'transfer';
  note?: string;
}

export interface LinkedAccount {
  id: string;
  bankName: string;
  accountNumber: string; // masked
  type: 'bank' | 'sacco';
  balance: number;
  isDefault: boolean;
  color: string;
}

export interface Biller {
  id: string;
  name: string;
  category: 'utility' | 'tv' | 'internet' | 'government' | 'telco';
  accountLabel: string;
  icon: string; // emoji
  color: string;
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  pin: string; // mock
  biometricEnabled: boolean;
}
