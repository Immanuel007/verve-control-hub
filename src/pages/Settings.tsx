import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/store/app-store';
import { useTheme } from '@/store/theme';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, Fingerprint, Bell, ShieldCheck, Wallet, FileText, LogOut, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, accounts, logout } = useApp();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();

  const groups = [
    {
      title: 'Account',
      items: [
        { icon: Wallet, label: 'Linked accounts', sub: `${accounts.length} connected`, onClick: () => {} },
        { icon: FileText, label: 'Statements & exports', sub: 'PDF / CSV', onClick: () => {} },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: Fingerprint, label: 'Biometric login', sub: 'Face ID / Fingerprint', toggle: true, value: user?.biometricEnabled },
        { icon: ShieldCheck, label: 'Device trust', sub: 'iPhone 15 · trusted', onClick: () => {} },
        { icon: Bell, label: 'Notifications', sub: 'Transaction alerts on', onClick: () => {} },
      ],
    },
  ];

  return (
    <div>
      <ScreenHeader title="More" />

      <div className="px-5 mt-4">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60">
          <div className="h-14 w-14 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-display font-bold text-xl">
            {user?.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground font-mono-num">{user?.phone}</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 p-4 rounded-2xl bg-card border border-border/60 flex items-center gap-3">
        <span className="h-9 w-9 rounded-xl bg-muted grid place-items-center"><Sun className="h-4 w-4" /></span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Dark mode</p>
          <p className="text-[11px] text-muted-foreground">Currently {theme}</p>
        </div>
        <Switch checked={theme === 'dark'} onCheckedChange={toggle} />
      </div>

      {groups.map((g) => (
        <section key={g.title} className="mt-5 px-5">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2 px-1">{g.title}</p>
          <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
            {g.items.map((it, i) => {
              const Icon = it.icon;
              return (
                <div key={it.label} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-border/60' : ''}`}>
                  <span className="h-9 w-9 rounded-xl bg-muted grid place-items-center"><Icon className="h-4 w-4" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{it.label}</p>
                    <p className="text-[11px] text-muted-foreground">{it.sub}</p>
                  </div>
                  {it.toggle ? <Switch checked={it.value} /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="px-5 mt-6 mb-6">
        <button
          onClick={() => { logout(); nav('/login'); }}
          className="w-full h-12 rounded-xl border border-destructive/40 bg-destructive/5 text-destructive font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
        <p className="text-center text-[10px] text-muted-foreground mt-4">Verve Mobile · v0.1 · Powered by Interswitch</p>
      </div>
    </div>
  );
}
