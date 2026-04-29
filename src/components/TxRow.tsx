import { Transaction } from '@/types/verve';
import { KES, formatRelative } from '@/lib/format';
import { ShoppingBag, Utensils, Car, Lightbulb, ArrowDownLeft, MoreHorizontal } from 'lucide-react';

const ICONS = {
  food: { Icon: Utensils, color: 'bg-warning/15 text-warning' },
  transport: { Icon: Car, color: 'bg-accent/15 text-accent' },
  bills: { Icon: Lightbulb, color: 'bg-primary/10 text-primary' },
  shopping: { Icon: ShoppingBag, color: 'bg-secondary/10 text-secondary dark:text-secondary-foreground' },
  income: { Icon: ArrowDownLeft, color: 'bg-success/15 text-success' },
  others: { Icon: MoreHorizontal, color: 'bg-muted text-muted-foreground' },
} as const;

export function TxRow({ tx }: { tx: Transaction }) {
  const { Icon, color } = ICONS[tx.category];
  const isCredit = tx.amount > 0;
  return (
    <div className="flex items-center gap-3 p-3.5">
      <span className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{tx.merchant}</p>
        <p className="text-[11px] text-muted-foreground capitalize">
          {formatRelative(tx.date)} · {tx.channel}
          {tx.status !== 'success' && (
            <span className={`ml-1.5 stat-pill ${tx.status === 'failed' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}`}>{tx.status}</span>
          )}
        </p>
      </div>
      <p className={`font-mono-num font-bold text-sm ${isCredit ? 'text-success' : 'text-foreground'}`}>
        {KES(tx.amount, { signed: true, compact: true })}
      </p>
    </div>
  );
}
