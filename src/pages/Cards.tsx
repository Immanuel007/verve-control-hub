import { useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Snowflake, Lock, Globe, Wifi, Banknote, Fingerprint, AlertOctagon, Plus, Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import { useApp } from '@/store/app-store';
import { CardStatus, VerveCard } from '@/types/verve';
import { KES, maskPan } from '@/lib/format';
import { useDynamicCvv } from '@/hooks/use-dcvv';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<CardStatus, { label: string; className: string }> = {
  active:  { label: 'Active',  className: 'bg-success/20 text-success border border-success/30' },
  frozen:  { label: 'Frozen',  className: 'bg-warning/20 text-warning border border-warning/30' },
  blocked: { label: 'Blocked', className: 'bg-destructive/20 text-destructive border border-destructive/30' },
};

function CardVisual({ card, revealed, dcvv }: { card: VerveCard; revealed: boolean; dcvv: string }) {
  const grad =
    card.status === 'frozen' ? 'bg-card-frozen' :
    card.status === 'blocked' ? 'bg-card-blocked' :
    card.gradient === 'card-1' ? 'bg-card-1' :
    card.gradient === 'card-2' ? 'bg-card-2' : 'bg-card-3';

  return (
    <div className={cn('verve-card aspect-[1.586/1] p-5 flex flex-col justify-between', grad)}>
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">{card.nickname}</p>
          <p className="font-display font-bold text-base mt-0.5">{card.isVirtual ? 'Virtual Card' : 'Physical Card'}</p>
        </div>
        <span className={cn('stat-pill backdrop-blur-sm', STATUS_LABELS[card.status].className)}>{STATUS_LABELS[card.status].label}</span>
      </div>

      {/* chip */}
      <div className="relative z-10">
        <div className="h-7 w-10 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500/80 shadow-inner" />
      </div>

      <div className="relative z-10">
        <p className="font-mono-num text-base tracking-[0.18em] text-white">
          {revealed ? card.pan : maskPan(card.pan)}
        </p>
        <div className="flex items-end justify-between mt-3">
          <div>
            <p className="text-[9px] text-white/60 uppercase tracking-wider">Cardholder</p>
            <p className="text-xs font-semibold tracking-wide">{card.cardholder}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/60 uppercase tracking-wider">Expires</p>
            <p className="text-xs font-mono-num font-semibold">{card.expiry}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-white/60 uppercase tracking-wider">dCVV</p>
            <p className="text-xs font-mono-num font-semibold">{revealed ? dcvv : '•••'}</p>
          </div>
        </div>
      </div>

      <p className="absolute right-5 top-5 z-10 font-display italic font-bold text-sm text-white/90">verve</p>
    </div>
  );
}

export default function Cards() {
  const { cards, updateCard, setCardStatus } = useApp();
  const [activeIdx, setActiveIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const card = cards[activeIdx];

  const onScroll = () => {
    const el = scrollerRef.current; if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== activeIdx) { setActiveIdx(i); setRevealed(false); }
  };

  const handleReveal = () => {
    if (revealed) { setRevealed(false); return; }
    // simulate biometric prompt
    toast({ title: 'Biometric verified', description: 'Card details visible for 10 seconds.' });
    setRevealed(true);
    setTimeout(() => setRevealed(false), 10000);
  };

  const copyPan = async () => {
    await navigator.clipboard.writeText(card.pan.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleControl = (key: keyof VerveCard['controls'], v: boolean) => {
    updateCard(card.id, { controls: { ...card.controls, [key]: v } });
    toast({ title: `${key} ${v ? 'enabled' : 'disabled'}` });
  };

  const setLimit = (key: 'daily' | 'perTransaction', v: number) => {
    updateCard(card.id, { limits: { ...card.limits, [key]: v } });
  };

  const isFrozen = card.status === 'frozen';
  const isBlocked = card.status === 'blocked';

  return (
    <div>
      <ScreenHeader title="My Cards" subtitle={`${cards.length} card${cards.length > 1 ? 's' : ''} · tap to manage`}
        right={<button className="h-9 w-9 rounded-full grid place-items-center bg-muted hover:bg-muted/80" aria-label="Add card"><Plus className="h-5 w-5" /></button>}
      />

      {/* Carousel */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="mt-4 px-5 flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {cards.map((c, i) => (
          <div key={c.id} className="snap-center shrink-0 w-[calc(100%-40px)]">
            <CardVisual card={c} revealed={i === activeIdx && revealed} />
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="mt-3 flex justify-center gap-1.5">
        {cards.map((_, i) => (
          <span key={i} className={cn('h-1.5 rounded-full transition-all', i === activeIdx ? 'w-6 bg-primary' : 'w-1.5 bg-border')} />
        ))}
      </div>

      {/* Quick row */}
      <div className="mt-5 px-5 grid grid-cols-3 gap-2">
        <button
          onClick={handleReveal}
          disabled={isBlocked}
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-card border border-border/60 disabled:opacity-50 active:scale-95 transition"
        >
          {revealed ? <EyeOff className="h-5 w-5 text-primary" /> : <Eye className="h-5 w-5 text-primary" />}
          <span className="text-[11px] font-semibold">{revealed ? 'Hide' : 'Reveal'}</span>
        </button>
        <button
          onClick={copyPan}
          disabled={isBlocked}
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-card border border-border/60 disabled:opacity-50 active:scale-95 transition"
        >
          {copied ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5 text-primary" />}
          <span className="text-[11px] font-semibold">{copied ? 'Copied' : 'Copy PAN'}</span>
        </button>
        <button
          onClick={() => {
            if (isBlocked) return;
            setCardStatus(card.id, isFrozen ? 'active' : 'frozen');
            toast({ title: isFrozen ? 'Card unfrozen' : 'Card frozen', description: isFrozen ? 'Transactions enabled.' : 'No transactions can occur.' });
          }}
          disabled={isBlocked}
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-card border border-border/60 disabled:opacity-50 active:scale-95 transition"
        >
          <Snowflake className={cn('h-5 w-5', isFrozen ? 'text-warning' : 'text-primary')} />
          <span className="text-[11px] font-semibold">{isFrozen ? 'Unfreeze' : 'Freeze'}</span>
        </button>
      </div>

      {/* Balance */}
      <div className="mt-5 mx-5 rounded-2xl p-4 bg-card border border-border/60 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Card balance</p>
          <p className="font-display font-bold text-2xl mt-1 font-mono-num">{KES(card.balance, { compact: true })}</p>
        </div>
        <Fingerprint className="h-8 w-8 text-primary/40" />
      </div>

      {/* Controls */}
      <section className="mt-5 mx-5 rounded-2xl bg-card border border-border/60 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <p className="font-display font-bold">Card controls</p>
          <p className="text-[11px] text-muted-foreground">Toggle channels instantly. Changes apply in seconds.</p>
        </div>
        <Toggle icon={<Wifi className="h-4 w-4" />} label="Online transactions" desc="E-commerce, in-app purchases" checked={card.controls.online} onChange={(v) => toggleControl('online', v)} disabled={isBlocked || isFrozen} />
        <Toggle icon={<Banknote className="h-4 w-4" />} label="ATM withdrawals" desc="Cash & cardless ATM" checked={card.controls.atm} onChange={(v) => toggleControl('atm', v)} disabled={isBlocked || isFrozen} />
        <Toggle icon={<Globe className="h-4 w-4" />} label="International usage" desc="Foreign currency & merchants" checked={card.controls.international} onChange={(v) => toggleControl('international', v)} disabled={isBlocked || isFrozen} />
      </section>

      {/* Limits */}
      <section className="mt-5 mx-5 p-4 rounded-2xl bg-card border border-border/60 space-y-5">
        <p className="font-display font-bold">Spending limits</p>

        <LimitSlider label="Daily limit" value={card.limits.daily} max={1_000_000} step={5000} onChange={(v) => setLimit('daily', v)} />
        <LimitSlider label="Per transaction" value={card.limits.perTransaction} max={500_000} step={2500} onChange={(v) => setLimit('perTransaction', v)} />
      </section>

      {/* Danger zone */}
      <section className="mt-5 mx-5 mb-6 p-4 rounded-2xl border border-destructive/30 bg-destructive/5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-destructive" />
          <p className="font-display font-bold text-destructive">Danger zone</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full h-11 rounded-xl font-semibold">
              <Lock className="h-4 w-4 mr-2" /> Block card permanently
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Block this card?</DialogTitle>
              <DialogDescription>
                This permanently blocks <span className="font-semibold">{card.nickname}</span>. You'll need to request a replacement. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => { setCardStatus(card.id, 'blocked'); toast({ title: 'Card blocked', description: 'Replacement request available in Settings.' }); }}
              >
                Yes, block card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <button
          onClick={() => toast({ title: 'Replacement requested', description: 'Your new card ships in 3–5 business days.' })}
          className="w-full h-11 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold"
        >
          Report lost / stolen
        </button>
      </section>
    </div>
  );
}

function Toggle({ icon, label, desc, checked, onChange, disabled }: {
  icon: React.ReactNode; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className={cn('px-4 py-3.5 flex items-center gap-3 border-t border-border/60 first:border-t-0', disabled && 'opacity-50')}>
      <span className="h-9 w-9 rounded-xl bg-muted grid place-items-center text-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function LimitSlider({ label, value, max, step, onChange }: { label: string; value: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold">{label}</p>
        <p className="font-mono-num text-sm text-primary font-bold">{KES(value, { compact: true })}</p>
      </div>
      <Slider value={[value]} min={0} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground font-mono-num">
        <span>0</span><span>{KES(max, { compact: true })}</span>
      </div>
    </div>
  );
}
