import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { MOCK_ACCOUNTS, MOCK_CARDS, MOCK_TRANSACTIONS } from '@/data/mock';
import { LinkedAccount, Transaction, User, VerveCard, CardStatus } from '@/types/verve';
import { authApi, SignupPayload } from '@/lib/auth-api';
import { ApiError } from '@/types/api';
import { tokenStore } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface AppState {
  user: User | null;
  isAuthed: boolean;
  cards: VerveCard[];
  accounts: LinkedAccount[];
  transactions: Transaction[];
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; twoFactor?: boolean }>;
  loginBiometric: () => Promise<{ ok: boolean; error?: string }>;
  register: (payload: SignupPayload) => Promise<{ ok: boolean; email?: string; error?: string }>;
  logout: () => void;
  updateCard: (id: string, patch: Partial<VerveCard>) => void;
  setCardStatus: (id: string, status: CardStatus) => void;
  emergencyFreezeAll: () => void;
  addTransaction: (tx: Transaction) => void;
}

const Ctx = createContext<AppState | null>(null);

const USER_KEY = 'verve.session.v1';
const REFRESH_KEY = 'verve.refresh.v1';

function userFromLogin(email: string, mobileNo: string | null): User {
  const local = email.split('@')[0] || 'User';
  const fullName = local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: email,
    fullName,
    phone: mobileNo ?? '',
    email,
    pin: '',
    biometricEnabled: false,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<VerveCard[]>(MOCK_CARDS);
  const [accounts] = useState<LinkedAccount[]>(MOCK_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const tok = tokenStore.get();
      if (raw && tok) setUser(JSON.parse(raw));
      else if (raw && !tok) localStorage.removeItem(USER_KEY);
    } catch {}
  }, []);

  const persistUser = (u: User | null) => {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  };

  const logout = useCallback(() => {
    setUser(null);
    persistUser(null);
    tokenStore.set(null);
    try { localStorage.removeItem(REFRESH_KEY); } catch {}
  }, []);

  useEffect(() => {
    const onUnauth = () => {
      setUser(null);
      persistUser(null);
      try { localStorage.removeItem(REFRESH_KEY); } catch {}
      toast({ title: 'Session expired', description: 'Please sign in again.', variant: 'destructive' });
    };
    window.addEventListener('verve:unauthorized', onUnauth);
    return () => window.removeEventListener('verve:unauthorized', onUnauth);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await authApi.login({ email: email.trim(), password });
      if (!data.accessToken) {
        return { ok: false, error: 'No access token returned. Please verify your email and try again.' };
      }
      tokenStore.set(data.accessToken);
      try { localStorage.setItem(REFRESH_KEY, data.refreshtoken ?? ''); } catch {}
      const u = userFromLogin(data.email || email, data.mobileNo);
      setUser(u); persistUser(u);
      return { ok: true, twoFactor: !!data.twoFactorLogin };
    } catch (e) {
      const err = e as ApiError;
      return { ok: false, error: err?.description || 'Sign in failed' };
    }
  }, []);

  const loginBiometric = useCallback(async () => {
    const tok = tokenStore.get();
    const raw = localStorage.getItem(USER_KEY);
    if (!tok || !raw) {
      return { ok: false, error: 'Sign in with your password first to enable biometrics.' };
    }
    try {
      setUser(JSON.parse(raw));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not restore session.' };
    }
  }, []);

  const register = useCallback(async (payload: SignupPayload) => {
    try {
      const data = await authApi.signup(payload);
      // Discard accessToken — user must verify email first.
      return { ok: true, email: data.email };
    } catch (e) {
      const err = e as ApiError;
      return { ok: false, error: err?.description || 'Sign up failed' };
    }
  }, []);

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
    login, loginBiometric, register, logout, updateCard, setCardStatus, emergencyFreezeAll, addTransaction,
  }), [user, cards, accounts, transactions, login, loginBiometric, register, logout, updateCard, setCardStatus, emergencyFreezeAll, addTransaction]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}
