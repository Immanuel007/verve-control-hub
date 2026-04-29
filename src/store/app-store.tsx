import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { MOCK_ACCOUNTS, MOCK_CARDS, MOCK_TRANSACTIONS, MOCK_USER } from '@/data/mock';
import { LinkedAccount, Transaction, User, VerveCard, CardStatus } from '@/types/verve';

interface AppState {
  user: User | null;
  isAuthed: boolean;
  cards: VerveCard[];
  accounts: LinkedAccount[];
  transactions: Transaction[];
  login: (phone: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
  loginBiometric: () => Promise<{ ok: boolean }>;
  logout: () => void;
  updateCard: (id: string, patch: Partial<VerveCard>) => void;
  setCardStatus: (id: string, status: CardStatus) => void;
  emergencyFreezeAll: () => void;
  addTransaction: (tx: Transaction) => void;
}

const Ctx = createContext<AppState | null>(null);

const STORAGE_KEY = 'verve.session.v1';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<VerveCard[]>(MOCK_CARDS);
  const [accounts] = useState<LinkedAccount[]>(MOCK_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (u: User | null) => {
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = useCallback(async (phone: string, pin: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const normPhone = phone.replace(/\s+/g, '');
    if ((normPhone === MOCK_USER.phone || normPhone === MOCK_USER.email || normPhone === '0712345678') && pin === MOCK_USER.pin) {
      setUser(MOCK_USER); persist(MOCK_USER);
      return { ok: true };
    }
    return { ok: false, error: 'Invalid credentials. Try phone +254712345678 with PIN 1234.' };
  }, []);

  const loginBiometric = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 500));
    setUser(MOCK_USER); persist(MOCK_USER);
    return { ok: true };
  }, []);

  const logout = useCallback(() => { setUser(null); persist(null); }, []);

  const updateCard = useCallback((id: string, patch: Partial<VerveCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch, controls: { ...c.controls, ...(patch.controls ?? {}) }, limits: { ...c.limits, ...(patch.limits ?? {}) } } : c)));
  }, []);

  const setCardStatus = useCallback((id: string, status: CardStatus) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }, []);

  const emergencyFreezeAll = useCallback(() => {
    setCards((prev) => prev.map((c) => (c.status === 'blocked' ? c : { ...c, status: 'frozen' })));
  }, []);

  const addTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
  }, []);

  const value = useMemo<AppState>(() => ({
    user, isAuthed: !!user, cards, accounts, transactions,
    login, loginBiometric, logout, updateCard, setCardStatus, emergencyFreezeAll, addTransaction,
  }), [user, cards, accounts, transactions, login, loginBiometric, logout, updateCard, setCardStatus, emergencyFreezeAll, addTransaction]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}
