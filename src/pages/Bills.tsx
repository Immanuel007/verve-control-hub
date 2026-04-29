import { ScreenHeader } from '@/components/ScreenHeader';
import { MOCK_BILLERS } from '@/data/mock';
import { toast } from '@/hooks/use-toast';

export default function Bills() {
  return (
    <div>
      <ScreenHeader title="Pay Bills" subtitle="Kenyan billers · instant settlement" />
      <div className="px-5 mt-4 grid grid-cols-3 gap-3">
        {MOCK_BILLERS.map((b) => (
          <button
            key={b.id}
            onClick={() => toast({ title: `${b.name}`, description: 'Bill payment flow coming in next phase.' })}
            className="aspect-square rounded-2xl bg-card border border-border/60 flex flex-col items-center justify-center gap-2 p-3 active:scale-95 transition shadow-soft"
          >
            <span className="h-12 w-12 rounded-2xl grid place-items-center text-2xl" style={{ background: `${b.color}20` }}>{b.icon}</span>
            <span className="text-[11px] font-semibold text-center leading-tight">{b.name}</span>
          </button>
        ))}
      </div>

      <div className="mx-5 mt-6 p-4 rounded-2xl bg-accent/10 border border-accent/20">
        <p className="font-display font-bold text-sm">⚡ Quick pay</p>
        <p className="text-xs text-muted-foreground mt-1">
          Repeat your last bill in one tap. Auto-reminders, saved billers and payment history land in Phase 3.
        </p>
      </div>
    </div>
  );
}
