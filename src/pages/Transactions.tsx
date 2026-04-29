import { useMemo, useState } from 'react';
import { useApp } from '@/store/app-store';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TxRow } from '@/components/TxRow';
import { TxCategory } from '@/types/verve';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const FILTERS: { id: TxCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'food', label: '🍔 Food' },
  { id: 'transport', label: '🚗 Transport' },
  { id: 'bills', label: '💡 Bills' },
  { id: 'shopping', label: '🛍️ Shopping' },
  { id: 'others', label: 'Other' },
];

export default function Transactions() {
  const { transactions } = useApp();
  const [filter, setFilter] = useState<typeof FILTERS[number]['id']>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== 'all' && t.category !== filter) return false;
      if (q && !t.merchant.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filter, q]);

  return (
    <div>
      <ScreenHeader title="Activity" subtitle={`${filtered.length} transactions`} />

      <div className="px-5 mt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search merchant..."
            className="h-11 rounded-xl pl-10 bg-muted/50 border-border"
          />
        </div>
      </div>

      <div className="mt-4 px-5 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn('shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition',
              filter === f.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/60 text-muted-foreground')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 mx-5 rounded-2xl bg-card border border-border/60 divide-y divide-border/60 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No transactions match.</p>
        ) : filtered.map((t) => <TxRow key={t.id} tx={t} />)}
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-4 px-5">
        Charts, date ranges & exports unlock in the next phase.
      </p>
    </div>
  );
}
