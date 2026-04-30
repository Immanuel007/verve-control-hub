import { Link } from 'react-router-dom';
import { Bell, Send, Banknote, Receipt, CreditCard, ArrowUpRight, ArrowDownRight, Eye, EyeOff, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '@/store/app-store';
import { KES, formatRelative } from '@/lib/format';
import { TxRow } from '@/components/TxRow';
import { useTheme } from '@/store/theme';
import { Sun, Moon } from 'lucide-react';

const QUICK = [
  { to: '/app/withdraw', label: 'Withdraw\n& Send', icon: Banknote, color: 'bg-primary/10 text-primary' },
  { to: '/app/lipa', label: 'Lipa\nFaster', icon: Zap, color: 'bg-accent/15 text-accent' },
  { to: '/app/bills', label: 'Pay\nBills', icon: Receipt, color: 'bg-warning/15 text-warning' },
  { to: '/app/cards', label: 'My\nCards', icon: CreditCard, color: 'bg-secondary/10 text-secondary dark:text-secondary-foreground' },
];

export default function Home() {
  const { user, accounts, transactions } = useApp();
  const { theme, toggle } = useTheme();
  const [hidden, setHidden] = useState(false);

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);

  const todaysSpend = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return transactions.filter((t) => t.amount < 0 && new Date(t.date) >= start).reduce((s, t) => s + Math.abs(t.amount), 0);
  }, [transactions]);

  const yesterdaysSpend = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    start.setDate(start.getDate() - 1);
    return transactions.filter((t) => t.amount < 0 && new Date(t.date) >= start && new Date(t.date) < end).reduce((s, t) => s + Math.abs(t.amount), 0);
  }, [transactions]);

  const delta = todaysSpend - yesterdaysSpend;
  const recent = transactions.slice(0, 5);

  return (
    <div>
      {/* Top bar */}
      <header className="safe-top px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-display font-bold shadow-soft">
            {user?.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <p className="font-display font-bold leading-tight">{user?.fullName.split(' ')[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggle} className="h-10 w-10 rounded-full grid place-items-center hover:bg-muted transition" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button className="relative h-10 w-10 rounded-full grid place-items-center hover:bg-muted transition" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>
      </header>

      {/* Balance hero */}
      <section className="px-5 mt-5 animate-fade-in">
        <div className="verve-card p-6">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/70 uppercase tracking-wider font-semibold">Total Balance</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="font-display font-bold text-3xl tracking-tight font-mono-num">
                  {hidden ? '•••••••' : KES(totalBalance, { compact: true })}
                </p>
                <button onClick={() => setHidden((h) => !h)} className="opacity-70 hover:opacity-100">
                  {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-white/60 mt-1">across {accounts.length} linked accounts</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Verve</p>
              <p className="font-display font-bold text-sm">Premium</p>
            </div>
          </div>

          <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/10">
              <p className="text-[10px] text-white/70 uppercase tracking-wider">Today</p>
              <p className="font-mono-num font-bold mt-1">{KES(todaysSpend, { compact: true })}</p>
              <div className="mt-1 inline-flex items-center gap-1 text-[10px]">
                {delta >= 0 ? <ArrowUpRight className="h-3 w-3 text-warning" /> : <ArrowDownRight className="h-3 w-3 text-success" />}
                <span className={delta >= 0 ? 'text-warning' : 'text-success'}>
                  {KES(Math.abs(delta), { compact: true })} vs yesterday
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/10">
              <p className="text-[10px] text-white/70 uppercase tracking-wider">This week</p>
              <p className="font-mono-num font-bold mt-1">{KES(todaysSpend * 4.2, { compact: true })}</p>
              <p className="text-[10px] text-white/70 mt-1">budget 65% used</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="px-5 mt-6">
        <div className="grid grid-cols-4 gap-2">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.to} to={q.to} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/60 active:scale-95 transition shadow-soft">
                <span className={`h-11 w-11 rounded-xl grid place-items-center ${q.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] text-center leading-tight font-medium whitespace-pre-line">{q.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Smart nudge */}
      <section className="px-5 mt-6">
        <div className="rounded-2xl p-4 bg-accent/10 border border-accent/20 flex items-start gap-3">
          <span className="text-2xl">🍔</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">You've spent 30% more on food this week</p>
            <p className="text-xs text-muted-foreground mt-0.5">Set a weekly food budget to stay on track.</p>
          </div>
        </div>
      </section>

      {/* Recent transactions */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-base">Recent activity</h2>
          <Link to="/app/transactions" className="text-xs text-primary font-semibold">See all</Link>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 divide-y divide-border/60 overflow-hidden">
          {recent.map((t) => <TxRow key={t.id} tx={t} />)}
        </div>
      </section>

      {/* Linked accounts strip */}
      <section className="px-5 mt-6">
        <h2 className="font-display font-bold text-base mb-3">Linked accounts</h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {accounts.map((a) => (
            <div key={a.id} className="min-w-[180px] rounded-2xl p-4 bg-card border border-border/60 shadow-soft">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg" style={{ background: a.color }} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{a.bankName}</p>
                  <p className="text-[10px] text-muted-foreground">{a.accountNumber} · {a.type}</p>
                </div>
              </div>
              <p className="font-mono-num font-bold mt-3">{KES(a.balance, { compact: true })}</p>
              {a.isDefault && <span className="stat-pill bg-primary/10 text-primary mt-2">Default</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
