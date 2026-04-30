import { useEffect, useMemo, useState } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KES } from '@/lib/format';
import { Banknote, Copy, Check, X, Clock, MapPin, Smartphone, User as UserIcon, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { OtpAuthorize, OtpResult } from '@/components/OtpAuthorize';

const PRESETS = [1000, 2500, 5000, 10000, 20000, 40000];

type Mode = 'atm' | 'mpesa' | 'airtel';
type Recipient = 'self' | 'other';

const MODES: { id: Mode; label: string; icon: string; tint: string }[] = [
  { id: 'atm',    label: 'ATM Token',     icon: '🏧', tint: 'hsl(var(--primary))' },
  { id: 'mpesa',  label: 'M-Pesa',        icon: '📱', tint: 'hsl(152 68% 38%)' },
  { id: 'airtel', label: 'Airtel Money',  icon: '📲', tint: 'hsl(0 78% 50%)' },
];

export default function Withdraw() {
  const { accounts, user, addTransaction } = useApp();
  const [mode, setMode] = useState<Mode>('atm');
  const [amount, setAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState(accounts[0]?.id);
  const [token, setToken] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [copied, setCopied] = useState(false);

  // Mobile money state
  const [recipient, setRecipient] = useState<Recipient>('self');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [sent, setSent] = useState<null | { ref: string; phone: string; name?: string; authRef?: string }>(null);
  const [failed, setFailed] = useState<null | { reason: string; phone: string }>(null);
  const [otpOpen, setOtpOpen] = useState(false);

  const account = accounts.find((a) => a.id === accountId);
  const insufficient = account ? amount > account.balance : false;

  useEffect(() => {
    if (!token) return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [token, secondsLeft]);

  // Reset state when switching mode
  useEffect(() => {
    setToken(null); setSent(null); setFailed(null); setAmount(0);
    setRecipient('self'); setRecipientPhone(''); setRecipientName('');
  }, [mode]);

  const generate = () => {
    if (amount < 100) { toast({ title: 'Minimum withdrawal is KES 100', variant: 'destructive' }); return; }
    if (insufficient) { toast({ title: 'Insufficient balance', variant: 'destructive' }); return; }
    const code = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
    setToken(code);
    setSecondsLeft(600);
    toast({ title: 'Token generated', description: 'Use it within 10 minutes at any Interswitch ATM.' });
  };

  const requestSend = () => {
    if (amount < 10) { toast({ title: 'Minimum send is KES 10', variant: 'destructive' }); return; }
    if (insufficient) { toast({ title: 'Insufficient balance', variant: 'destructive' }); return; }
    const phone = recipient === 'self' ? (user?.phone ?? '') : recipientPhone.trim();
    if (!phone || phone.replace(/\D/g, '').length < 9) {
      toast({ title: 'Enter a valid phone number', variant: 'destructive' }); return;
    }
    setOtpOpen(true);
  };

  const onOtp = (result: OtpResult, authRef?: string) => {
    setOtpOpen(false);
    const phone = recipient === 'self' ? (user?.phone ?? '') : recipientPhone.trim();
    if (result === 'failed') {
      setFailed({ reason: 'OTP authorization was not completed.', phone });
      return;
    }
    const ref = (mode === 'mpesa' ? 'MP' : 'AT') + Date.now().toString().slice(-8);
    setSent({ ref, phone, name: recipient === 'other' ? recipientName.trim() : user?.fullName, authRef });
    addTransaction({
      id: 't_' + ref,
      accountId: account?.id,
      merchant: `${mode === 'mpesa' ? 'M-Pesa' : 'Airtel Money'} → ${phone}`,
      amount: -amount,
      date: new Date().toISOString(),
      category: 'others',
      status: 'success',
      channel: 'transfer',
    });
    toast({ title: 'Transfer successful', description: `${KES(amount, { compact: true })} sent to ${phone}` });
  };

  const copy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const expired = secondsLeft <= 0;

  const reset = () => { setToken(null); setSent(null); setFailed(null); setAmount(0); setRecipientPhone(''); setRecipientName(''); };

  return (
    <div>
      <ScreenHeader back title="Cardless Withdrawal" subtitle="Powered by Interswitch IPG" />

      {/* Mode tabs */}
      <div className="px-5 mt-4 grid grid-cols-3 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition active:scale-95',
              mode === m.id ? 'border-primary bg-primary/5 shadow-soft' : 'border-border/60 bg-card'
            )}
          >
            <span className="text-xl">{m.icon}</span>
            <span className="text-[11px] font-semibold">{m.label}</span>
          </button>
        ))}
      </div>

      {/* === ATM mode === */}
      {mode === 'atm' && !token && (
        <AmountAndSource
          amount={amount} setAmount={setAmount}
          accounts={accounts} accountId={accountId} setAccountId={setAccountId}
          insufficient={insufficient}
        >
          <Button onClick={generate} className="w-full h-12 rounded-xl bg-gradient-primary font-semibold shadow-elevated">
            <Banknote className="h-4 w-4 mr-2" /> Generate withdrawal token
          </Button>
        </AmountAndSource>
      )}

      {mode === 'atm' && token && (
        <div className="px-5 mt-4 space-y-5 animate-fade-in">
          <div className="rounded-3xl p-6 bg-card-1 verve-card text-center">
            <p className="relative z-10 text-[11px] text-white/70 uppercase tracking-wider font-semibold">Your secure token</p>
            <p className="relative z-10 font-mono-num font-bold text-4xl tracking-[0.3em] mt-3 text-white">
              {token.match(/.{1,4}/g)?.join(' ')}
            </p>
            <div className="relative z-10 mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold font-mono-num">{expired ? 'Expired' : `Expires in ${mm}:${ss}`}</span>
            </div>
            <button onClick={copy} className="relative z-10 mt-4 mx-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white text-foreground text-xs font-semibold hover:bg-white/90 transition">
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy token'}
            </button>
          </div>

          <div className="rounded-2xl p-4 bg-card border border-border/60">
            <p className="font-display font-bold text-sm">How to withdraw</p>
            <ol className="mt-2 space-y-2 text-xs text-muted-foreground">
              <li><span className="font-mono-num text-primary font-bold mr-2">1</span>Visit any Interswitch-enabled ATM near you.</li>
              <li><span className="font-mono-num text-primary font-bold mr-2">2</span>Select <span className="font-semibold text-foreground">Cardless Withdrawal</span>.</li>
              <li><span className="font-mono-num text-primary font-bold mr-2">3</span>Enter this 8-digit token and your account PIN.</li>
              <li><span className="font-mono-num text-primary font-bold mr-2">4</span>Collect <span className="font-semibold text-foreground font-mono-num">{KES(amount, { compact: true })}</span>.</li>
            </ol>
          </div>

          <div className="rounded-2xl p-4 bg-accent/10 border border-accent/20 flex items-start gap-3">
            <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">For your security, this token is geo-locked to your current city and expires automatically.</p>
          </div>

          <Button onClick={reset} variant="outline" className="w-full h-12 rounded-xl font-semibold">
            Generate another
          </Button>
        </div>
      )}

      {/* === Mobile money modes === */}
      {(mode === 'mpesa' || mode === 'airtel') && !sent && !failed && (
        <div className="px-5 mt-4 space-y-5">
          {/* Recipient toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-muted/60">
            <button
              onClick={() => setRecipient('self')}
              className={cn('py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition',
                recipient === 'self' ? 'bg-card shadow-soft text-foreground' : 'text-muted-foreground')}
            >
              <UserIcon className="h-3.5 w-3.5" /> Send to self
            </button>
            <button
              onClick={() => setRecipient('other')}
              className={cn('py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition',
                recipient === 'other' ? 'bg-card shadow-soft text-foreground' : 'text-muted-foreground')}
            >
              <Send className="h-3.5 w-3.5" /> Send to other
            </button>
          </div>

          {/* Recipient details */}
          <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl grid place-items-center text-lg"
                    style={{ background: mode === 'mpesa' ? 'hsl(152 68% 38% / 0.15)' : 'hsl(0 78% 50% / 0.15)' }}>
                <Smartphone className="h-5 w-5" style={{ color: mode === 'mpesa' ? 'hsl(152 68% 38%)' : 'hsl(0 78% 50%)' }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {mode === 'mpesa' ? 'M-Pesa recipient' : 'Airtel Money recipient'}
                </p>
                <p className="text-sm font-semibold">
                  {recipient === 'self' ? 'My primary phone' : 'Another person'}
                </p>
              </div>
            </div>

            {recipient === 'self' ? (
              <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Phone</p>
                <p className="font-mono-num text-sm font-semibold mt-0.5">{user?.phone}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  type="tel" inputMode="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  className="h-11 rounded-xl bg-muted/50 border-border font-mono-num"
                />
                <Input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Recipient name (optional)"
                  className="h-11 rounded-xl bg-muted/50 border-border"
                />
              </div>
            )}
          </div>

          <AmountAndSource
            amount={amount} setAmount={setAmount}
            accounts={accounts} accountId={accountId} setAccountId={setAccountId}
            insufficient={insufficient}
            label={mode === 'mpesa' ? 'M-Pesa send amount' : 'Airtel send amount'}
          >
            <Button onClick={requestSend} className="w-full h-12 rounded-xl bg-gradient-primary font-semibold shadow-elevated">
              <Send className="h-4 w-4 mr-2" />
              Authorize & send {amount > 0 ? KES(amount, { compact: true }) : ''}
            </Button>
          </AmountAndSource>
        </div>
      )}

      {(mode === 'mpesa' || mode === 'airtel') && sent && (
        <div className="px-5 mt-4 space-y-5 animate-fade-in">
          <div className="rounded-3xl p-6 bg-card-1 verve-card text-center">
            <div className="relative z-10 mx-auto h-14 w-14 rounded-full bg-white/20 grid place-items-center backdrop-blur-sm">
              <Check className="h-7 w-7 text-white" />
            </div>
            <p className="relative z-10 mt-4 text-white/80 text-xs uppercase tracking-wider font-semibold">
              {mode === 'mpesa' ? 'M-Pesa' : 'Airtel Money'} transfer
            </p>
            <p className="relative z-10 font-display font-bold text-3xl mt-2 font-mono-num text-white">
              {KES(amount, { compact: true })}
            </p>
            <p className="relative z-10 mt-1 text-white/80 text-sm font-mono-num">to {sent.phone}</p>
            {sent.name && <p className="relative z-10 text-white/70 text-xs mt-0.5">{sent.name}</p>}
            <div className="relative z-10 mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20">
              <span className="text-[10px] uppercase tracking-wider text-white/80 font-semibold">Ref</span>
              <span className="text-xs font-mono-num font-semibold text-white">{sent.ref}</span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-success/10 border border-success/20">
            <p className="text-xs text-foreground">
              The recipient will receive an SMS confirmation shortly. Settled instantly via Interswitch.
            </p>
          </div>

          <Button onClick={reset} variant="outline" className="w-full h-12 rounded-xl font-semibold">
            Send another
          </Button>
        </div>
      )}

      {(mode === 'mpesa' || mode === 'airtel') && failed && (
        <div className="px-5 mt-4 space-y-5 animate-fade-in">
          <div className="rounded-3xl p-6 bg-destructive/10 border border-destructive/20 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-destructive/20 grid place-items-center">
              <X className="h-7 w-7 text-destructive" strokeWidth={3} />
            </div>
            <p className="mt-4 text-destructive text-xs uppercase tracking-wider font-semibold">Transfer failed</p>
            <p className="font-display font-bold text-2xl mt-2 font-mono-num">{KES(amount, { compact: true })}</p>
            <p className="mt-1 text-muted-foreground text-sm font-mono-num">to {failed.phone}</p>
            <p className="mt-3 text-xs text-muted-foreground">{failed.reason}</p>
          </div>
          <div className="rounded-2xl p-4 bg-muted/40 border border-border/60">
            <p className="text-xs text-muted-foreground">No funds were moved. You can retry the authorization or cancel.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={reset} variant="outline" className="h-12 rounded-xl font-semibold">Cancel</Button>
            <Button onClick={() => { setFailed(null); setOtpOpen(true); }} className="h-12 rounded-xl bg-gradient-primary font-semibold">Try again</Button>
          </div>
        </div>
      )}

      <OtpAuthorize
        open={otpOpen}
        phone={user?.phone ?? '+254 712 345 678'}
        amount={amount}
        merchant={`${mode === 'mpesa' ? 'M-Pesa' : 'Airtel Money'} → ${recipient === 'self' ? (user?.phone ?? '') : recipientPhone}`}
        onClose={() => setOtpOpen(false)}
        onComplete={onOtp}
      />
    </div>
  );
}

function AmountAndSource({
  amount, setAmount, accounts, accountId, setAccountId, insufficient, children, label = 'Amount',
}: {
  amount: number; setAmount: (n: number) => void;
  accounts: ReturnType<typeof useApp>['accounts'];
  accountId: string | undefined; setAccountId: (id: string) => void;
  insufficient: boolean; children: React.ReactNode; label?: string;
}) {
  return (
    <div className="px-5 mt-4 space-y-5">
      <div className="rounded-2xl bg-card border border-border/60 p-5 text-center">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
        <p className="font-display font-bold text-4xl mt-2 font-mono-num">
          {KES(amount, { compact: true })}
        </p>
        <Input
          type="text" inputMode="numeric"
          value={amount === 0 ? '' : amount}
          onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
          placeholder="Enter amount"
          className="h-11 mt-3 rounded-xl text-center bg-muted/50 border-border"
        />
        <div className="grid grid-cols-3 gap-2 mt-3">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => setAmount(p)} className="py-2 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold font-mono-num">
              {p.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2 px-1">Funding source</p>
        <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
          {accounts.map((a, i) => (
            <button
              key={a.id} onClick={() => setAccountId(a.id)}
              className={cn('w-full flex items-center gap-3 px-4 py-3.5 text-left', i > 0 && 'border-t border-border/60', accountId === a.id && 'bg-primary/5')}
            >
              <span className="h-9 w-9 rounded-lg" style={{ background: a.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{a.bankName}</p>
                <p className="text-[11px] text-muted-foreground">{a.accountNumber} · {KES(a.balance, { compact: true })}</p>
              </div>
              <span className={cn('h-5 w-5 rounded-full border-2', accountId === a.id ? 'border-primary bg-primary' : 'border-border')} />
            </button>
          ))}
        </div>
      </div>

      {insufficient && <p className="text-xs text-destructive px-1">Amount exceeds available balance.</p>}

      {children}
    </div>
  );
}
