import { useState } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KES } from '@/lib/format';
import { CreditCard, Building2, Smartphone, Check, X, Zap, ArrowRight, Phone, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { OtpAuthorize, OtpResult } from '@/components/OtpAuthorize';

type Source = 'verve' | 'bank' | 'mpesa';

const SOURCES: { id: Source; label: string; subtitle: string; icon: typeof CreditCard; tint: string }[] = [
  { id: 'verve', label: 'Verve Prepaid Card', subtitle: 'Postilion-routed · instant', icon: CreditCard, tint: 'hsl(var(--primary))' },
  { id: 'bank',  label: 'Bank Account',       subtitle: 'Direct debit · 1–3 sec',  icon: Building2, tint: 'hsl(222 60% 38%)' },
  { id: 'mpesa', label: 'M-Pesa Paybill',     subtitle: 'Interswitch paybill',    icon: Smartphone, tint: 'hsl(152 68% 38%)' },
];

interface FlowStep {
  label: string;
  detail: string;
  who: 'you' | 'verve' | 'merchant' | 'bank' | 'iswitch';
}

const FLOWS: Record<Source, FlowStep[]> = {
  verve: [
    { label: 'Initiate purchase', detail: 'Tap pay on the Verve app', who: 'you' },
    { label: 'Postilion routes', detail: 'Verve debit on prepaid card', who: 'verve' },
    { label: 'KCB credited', detail: 'Merchant till receives funds', who: 'bank' },
    { label: 'Notification sent', detail: '“This merchant has been paid”', who: 'merchant' },
    { label: 'Settlement', detail: 'Interswitch settles with KCB', who: 'iswitch' },
  ],
  bank: [
    { label: 'Initiate purchase', detail: 'Tap pay on the Verve app', who: 'you' },
    { label: 'Customer bank debit', detail: 'Funds reserved on your account', who: 'bank' },
    { label: 'Merchant bank notified', detail: 'KCB receives credit instruction', who: 'bank' },
    { label: 'Bank confirms', detail: 'Confirmation sent to merchant', who: 'merchant' },
  ],
  mpesa: [
    { label: 'Initiate purchase', detail: 'Tap pay on the Verve app', who: 'you' },
    { label: 'M-Pesa paybill', detail: 'Routed via Interswitch paybill', who: 'iswitch' },
    { label: 'Till credited', detail: 'KCB merchant till funded', who: 'bank' },
    { label: 'Merchant notified', detail: 'Owner of the till is alerted', who: 'merchant' },
  ],
};

export default function LipaFaster() {
  const { cards, accounts, addTransaction } = useApp();
  const [source, setSource] = useState<Source>('verve');
  const [tillNumber, setTillNumber] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [sourceId, setSourceId] = useState<string>(cards[0]?.id ?? '');
  const [paid, setPaid] = useState<null | { ref: string }>(null);

  const onSelectSource = (s: Source) => {
    setSource(s);
    if (s === 'verve') setSourceId(cards[0]?.id ?? '');
    else setSourceId(accounts[0]?.id ?? '');
  };

  const selectedSource = SOURCES.find((s) => s.id === source)!;

  return (
    <div>
      <ScreenHeader back title="Lipa Faster" subtitle="Instant merchant payments · powered by Interswitch" />

      <OtpAuthorize
        open={otpOpen}
        phone={user?.phone ?? '+254 712 345 678'}
        amount={amount}
        merchant={`Lipa Faster · ${merchantName || (tillNumber ? `Till ${tillNumber}` : 'merchant')}`}
        onClose={() => setOtpOpen(false)}
        onComplete={onOtp}
      />


      {!paid && !failed ? (
        <div className="px-5 mt-4 space-y-5">
          {/* Hero badge */}
          <div className="rounded-2xl p-4 bg-gradient-primary text-primary-foreground flex items-center gap-3 shadow-elevated">
            <span className="h-10 w-10 rounded-xl bg-white/20 grid place-items-center backdrop-blur-sm">
              <Zap className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm">Pay any KCB merchant Till</p>
              <p className="text-[11px] opacity-90">Faster than USSD · works at all KCB-acquired merchants</p>
            </div>
          </div>

          {/* Source picker */}
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2 px-1">Pay from</p>
            <div className="space-y-2">
              {SOURCES.map((s) => {
                const Icon = s.icon;
                const active = source === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectSource(s.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition active:scale-[0.99]',
                      active ? 'border-primary bg-primary/5 shadow-soft' : 'border-border/60 bg-card'
                    )}
                  >
                    <span className="h-10 w-10 rounded-xl grid place-items-center" style={{ background: `${s.tint} / 0.15`, backgroundColor: `color-mix(in oklab, ${s.tint} 15%, transparent)` }}>
                      <Icon className="h-5 w-5" style={{ color: s.tint }} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{s.label}</p>
                      <p className="text-[11px] text-muted-foreground">{s.subtitle}</p>
                    </div>
                    <span className={cn('h-5 w-5 rounded-full border-2', active ? 'border-primary bg-primary' : 'border-border')} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-source: which card / account */}
          {source === 'verve' && cards.length > 0 && (
            <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
              {cards.map((c, i) => (
                <button
                  key={c.id} onClick={() => setSourceId(c.id)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 text-left', i > 0 && 'border-t border-border/60', sourceId === c.id && 'bg-primary/5')}
                  disabled={c.status !== 'active'}
                >
                  <span className="h-9 w-12 rounded-md bg-card-1 verve-card" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{c.nickname}</p>
                    <p className="text-[11px] text-muted-foreground font-mono-num">•••• {c.pan.slice(-4)} · {KES(c.balance, { compact: true })}</p>
                  </div>
                  <span className={cn('h-5 w-5 rounded-full border-2', sourceId === c.id ? 'border-primary bg-primary' : 'border-border')} />
                </button>
              ))}
            </div>
          )}

          {(source === 'bank' || source === 'mpesa') && (
            <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
              {accounts.map((a, i) => (
                <button
                  key={a.id} onClick={() => setSourceId(a.id)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 text-left', i > 0 && 'border-t border-border/60', sourceId === a.id && 'bg-primary/5')}
                >
                  <span className="h-9 w-9 rounded-lg" style={{ background: a.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{a.bankName}</p>
                    <p className="text-[11px] text-muted-foreground">{a.accountNumber} · {KES(a.balance, { compact: true })}</p>
                  </div>
                  <span className={cn('h-5 w-5 rounded-full border-2', sourceId === a.id ? 'border-primary bg-primary' : 'border-border')} />
                </button>
              ))}
            </div>
          )}

          {/* Merchant inputs */}
          <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Merchant details</p>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={tillNumber}
                onChange={(e) => setTillNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="KCB Till number"
                inputMode="numeric"
                className="pl-9 h-11 rounded-xl bg-muted/50 border-border font-mono-num"
              />
            </div>
            <Input
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="Merchant name (optional)"
              className="h-11 rounded-xl bg-muted/50 border-border"
            />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Amount</p>
              <Input
                type="text" inputMode="numeric"
                value={amount === 0 ? '' : amount}
                onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
                placeholder="KES"
                className="h-12 rounded-xl bg-muted/50 border-border text-center font-mono-num font-bold text-lg"
              />
            </div>
          </div>

          {/* Settlement preview */}
          <div className="rounded-2xl p-4 bg-card border border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <p className="font-display font-bold text-sm">How it settles</p>
            </div>
            <ol className="space-y-2.5">
              {FLOWS[source].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center text-[10px] font-bold font-mono-num">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{step.label}</p>
                    <p className="text-[11px] text-muted-foreground">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Button onClick={requestPayment} className="w-full h-12 rounded-xl bg-gradient-primary font-semibold shadow-elevated">
            <Shield className="h-4 w-4 mr-2" />
            Authorize & pay {amount > 0 ? KES(amount, { compact: true }) : ''} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      ) : paid ? (
        <div className="px-5 mt-4 space-y-5 animate-fade-in">
          <div className="rounded-3xl p-6 bg-card-1 verve-card text-center">
            <div className="relative z-10 mx-auto h-14 w-14 rounded-full bg-white/20 grid place-items-center backdrop-blur-sm">
              <Check className="h-7 w-7 text-white" />
            </div>
            <p className="relative z-10 mt-4 text-white/80 text-xs uppercase tracking-wider font-semibold">Payment successful</p>
            <p className="relative z-10 font-display font-bold text-3xl mt-2 font-mono-num text-white">
              {KES(amount, { compact: true })}
            </p>
            <p className="relative z-10 mt-1 text-white/80 text-sm">to {merchantName || `Till ${tillNumber}`}</p>
            <div className="relative z-10 mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20">
              <span className="text-[10px] uppercase tracking-wider text-white/80 font-semibold">Ref</span>
              <span className="text-xs font-mono-num font-semibold text-white">{paid.ref}</span>
            </div>
            {paid.authRef && (
              <div className="relative z-10 mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15">
                <span className="text-[9px] uppercase tracking-wider text-white/70 font-semibold">Auth</span>
                <span className="text-[11px] font-mono-num font-semibold text-white/90">{paid.authRef}</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl p-4 bg-success/10 border border-success/20">
            <p className="text-xs text-foreground">
              Paid via <span className="font-semibold">{selectedSource.label}</span>. Interswitch will settle with KCB and notify the till owner.
            </p>
          </div>

          <Button onClick={reset} variant="outline" className="w-full h-12 rounded-xl font-semibold">
            Pay another merchant
          </Button>
        </div>
      ) : (
        <div className="px-5 mt-4 space-y-5 animate-fade-in">
          <div className="rounded-3xl p-6 bg-destructive/10 border border-destructive/20 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-destructive/20 grid place-items-center">
              <X className="h-7 w-7 text-destructive" strokeWidth={3} />
            </div>
            <p className="mt-4 text-destructive text-xs uppercase tracking-wider font-semibold">Payment failed</p>
            <p className="font-display font-bold text-2xl mt-2 font-mono-num">
              {KES(amount, { compact: true })}
            </p>
            <p className="mt-1 text-muted-foreground text-sm">to {merchantName || `Till ${tillNumber}`}</p>
            <p className="mt-3 text-xs text-muted-foreground">{failed?.reason}</p>
          </div>

          <div className="rounded-2xl p-4 bg-muted/40 border border-border/60">
            <p className="text-xs text-muted-foreground">
              No funds were moved. You can try again or cancel the request.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={reset} variant="outline" className="h-12 rounded-xl font-semibold">Cancel</Button>
            <Button onClick={() => { setFailed(null); setOtpOpen(true); }} className="h-12 rounded-xl bg-gradient-primary font-semibold">Try again</Button>
          </div>
        </div>
      )}
    </div>
  );
}
