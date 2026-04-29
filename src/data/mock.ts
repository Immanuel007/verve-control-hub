import { Biller, LinkedAccount, Transaction, User, VerveCard } from '@/types/verve';

export const MOCK_USER: User = {
  id: 'u_001',
  fullName: 'Amani Otieno',
  phone: '+254712345678',
  email: 'amani@verve.app',
  pin: '1234',
  biometricEnabled: true,
};

export const MOCK_CARDS: VerveCard[] = [
  {
    id: 'c_001',
    nickname: 'Everyday',
    pan: '5061 1234 5678 9012',
    expiry: '08/29',
    cvv: '321',
    cardholder: 'AMANI OTIENO',
    status: 'active',
    scheme: 'verve',
    gradient: 'card-1',
    controls: { online: true, atm: true, international: false },
    limits: { daily: 250000, perTransaction: 100000 },
    balance: 184320,
    isVirtual: true,
  },
  {
    id: 'c_002',
    nickname: 'Travel',
    pan: '5061 9876 5432 1098',
    expiry: '02/28',
    cvv: '784',
    cardholder: 'AMANI OTIENO',
    status: 'active',
    scheme: 'verve-global',
    gradient: 'card-2',
    controls: { online: true, atm: true, international: true },
    limits: { daily: 500000, perTransaction: 250000 },
    balance: 62100,
    isVirtual: true,
  },
  {
    id: 'c_003',
    nickname: 'Savings',
    pan: '5061 5544 3322 1100',
    expiry: '11/27',
    cvv: '109',
    cardholder: 'AMANI OTIENO',
    status: 'frozen',
    scheme: 'verve',
    gradient: 'card-3',
    controls: { online: false, atm: false, international: false },
    limits: { daily: 50000, perTransaction: 50000 },
    balance: 412000,
    isVirtual: false,
  },
];

export const MOCK_ACCOUNTS: LinkedAccount[] = [
  { id: 'a_001', bankName: 'KCB Bank', accountNumber: '••••4521', type: 'bank', balance: 184320, isDefault: true, color: 'hsl(152 68% 38%)' },
  { id: 'a_002', bankName: 'Equity Bank', accountNumber: '••••7790', type: 'bank', balance: 62100, isDefault: false, color: 'hsl(0 78% 48%)' },
  { id: 'a_003', bankName: 'Stima SACCO', accountNumber: '••••1102', type: 'sacco', balance: 412000, isDefault: false, color: 'hsl(38 95% 52%)' },
];

const now = Date.now();
const day = 86400000;

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't_001', cardId: 'c_001', merchant: 'Java House Westlands', amount: -1240, date: new Date(now - 2 * 3600 * 1000).toISOString(), category: 'food', status: 'success', channel: 'pos' },
  { id: 't_002', cardId: 'c_001', merchant: 'Uber Trip', amount: -680, date: new Date(now - 5 * 3600 * 1000).toISOString(), category: 'transport', status: 'success', channel: 'online' },
  { id: 't_003', accountId: 'a_001', merchant: 'Salary — Interswitch Ltd', amount: 185000, date: new Date(now - 1 * day).toISOString(), category: 'income', status: 'success', channel: 'transfer' },
  { id: 't_004', cardId: 'c_001', merchant: 'KPLC Prepaid', amount: -2500, date: new Date(now - 1 * day - 2 * 3600 * 1000).toISOString(), category: 'bills', status: 'success', channel: 'bill' },
  { id: 't_005', cardId: 'c_002', merchant: 'Naivas Supermarket', amount: -4380, date: new Date(now - 2 * day).toISOString(), category: 'shopping', status: 'success', channel: 'pos' },
  { id: 't_006', cardId: 'c_001', merchant: 'Bolt Trip', amount: -420, date: new Date(now - 2 * day - 1 * 3600 * 1000).toISOString(), category: 'transport', status: 'success', channel: 'online' },
  { id: 't_007', cardId: 'c_001', merchant: 'Cardless ATM — Equity Sarit', amount: -10000, date: new Date(now - 3 * day).toISOString(), category: 'others', status: 'success', channel: 'atm' },
  { id: 't_008', cardId: 'c_002', merchant: 'Netflix Subscription', amount: -1450, date: new Date(now - 3 * day - 4 * 3600 * 1000).toISOString(), category: 'bills', status: 'success', channel: 'online' },
  { id: 't_009', cardId: 'c_001', merchant: 'KFC Yaya Centre', amount: -890, date: new Date(now - 4 * day).toISOString(), category: 'food', status: 'success', channel: 'pos' },
  { id: 't_010', cardId: 'c_001', merchant: 'Jumia Order', amount: -6720, date: new Date(now - 5 * day).toISOString(), category: 'shopping', status: 'pending', channel: 'online' },
  { id: 't_011', cardId: 'c_001', merchant: 'Safaricom WiFi', amount: -3500, date: new Date(now - 6 * day).toISOString(), category: 'bills', status: 'success', channel: 'bill' },
  { id: 't_012', cardId: 'c_002', merchant: 'Carrefour Westgate', amount: -2890, date: new Date(now - 6 * day - 3 * 3600 * 1000).toISOString(), category: 'shopping', status: 'failed', channel: 'pos' },
];

export const MOCK_BILLERS: Biller[] = [
  { id: 'b_kplc', name: 'KPLC Prepaid', category: 'utility', accountLabel: 'Meter Number', icon: '⚡', color: 'hsl(38 95% 52%)' },
  { id: 'b_ecitizen', name: 'eCitizen', category: 'government', accountLabel: 'eCitizen ID', icon: '🏛️', color: 'hsl(222 60% 38%)' },
  { id: 'b_dstv', name: 'MultiChoice DStv', category: 'tv', accountLabel: 'Smartcard No.', icon: '📺', color: 'hsl(260 60% 50%)' },
  { id: 'b_nairobi', name: 'Nairobi County', category: 'government', accountLabel: 'Account / Plot No.', icon: '🏙️', color: 'hsl(174 72% 38%)' },
  { id: 'b_zuku', name: 'Zuku Fiber', category: 'internet', accountLabel: 'Account Number', icon: '🌐', color: 'hsl(0 78% 50%)' },
  { id: 'b_safwifi', name: 'Safaricom Home WiFi', category: 'internet', accountLabel: 'Account / Phone', icon: '📶', color: 'hsl(152 68% 38%)' },
];
