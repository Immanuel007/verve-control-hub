import { NavLink } from 'react-router-dom';
import { Home, CreditCard, ArrowLeftRight, Receipt, Settings as SettingsIcon, ShieldAlert, Zap } from 'lucide-react';
import { useApp } from '@/store/app-store';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/cards', label: 'Cards', icon: CreditCard },
  { to: '/app/lipa', label: 'Lipa', icon: Zap },
  { to: '/app/transactions', label: 'Activity', icon: ArrowLeftRight },
  { to: '/app/bills', label: 'Pay', icon: Receipt },
  { to: '/app/settings', label: 'More', icon: SettingsIcon },
];

export function BottomNav() {
  const { emergencyFreezeAll } = useApp();

  return (
    <>
      {/* Emergency floating action */}
      <button
        onClick={() => {
          emergencyFreezeAll();
          toast({ title: 'All cards frozen', description: 'Tap any card to unfreeze when you\'re ready.' });
        }}
        className="fixed left-1/2 -translate-x-1/2 bottom-[78px] z-40 h-14 w-14 rounded-full bg-gradient-primary shadow-elevated grid place-items-center text-primary-foreground active:scale-95 transition"
        aria-label="Emergency freeze all cards"
      >
        <span className="absolute inset-0 rounded-full bg-primary/40 animate-pulse-ring" />
        <ShieldAlert className="h-6 w-6 relative" />
      </button>

      <nav className="safe-bottom fixed bottom-0 inset-x-0 z-30 mx-auto max-w-[440px] px-3 pt-2 pb-2 bg-background/85 backdrop-blur-2xl border-t border-border/60">
        <ul className="grid grid-cols-5 items-end">
          {tabs.map((t, i) => {
            const Icon = t.icon;
            const isMiddle = i === 2;
            return (
              <li key={t.to} className={cn('flex justify-center', isMiddle && 'mr-6 ml-0')}>
                <NavLink
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    cn('flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-medium transition',
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('h-5 w-5 transition', isActive && 'scale-110')} />
                      <span>{t.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
