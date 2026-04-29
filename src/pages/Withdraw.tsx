import { useEffect, useMemo, useState } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KES } from '@/lib/format';
import { Banknote, Copy, Check, Clock, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PRESETS = [1000, 2500, 5000, 10000, 20000, 40000];

export default function Withdraw() {
  const { accounts } = useApp();
  const [amount, setAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState(accounts[0]?.id);
  const [token, setToken] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [copied, setCopied] = useState(false);

  const account = accounts.find((a) => a.id === accountId);
  const insufficient = account ? amount > account.balance : false;

  useEffect(() => {
    if (!token) return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [token, secondsLeft]);

  const generate = () => {
    if (amount < 100) { toast({ title: 'Minimum withdrawal is KES 100', variant: 'destructive' }); return; }
    if (insufficient) { toast({ title: 'Insufficient balance', variant: 'destructive' }); return; }
    const code = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
    setToken(code);
    setSecondsLeft(600);
    toast({ title: 'Token generated', description: 'Use it within 10 minutes at any Interswitch ATM.' });
  };

  const copy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const expired = secondsLeft <= 0;

  return (
    <div>
      <ScreenHeader back title="Cardless Withdrawal" subtitle="Powered by Interswitch IPG" />

      {!token ? (
        <div className="px-5 mt-4 space-y-5">
          <div className="rounded-2xl bg-card border border-border/60 p-5 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Withdrawal amount</p>
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

          <Button onClick={generate} className="w-full h-12 rounded-xl bg-gradient-primary font-semibold shadow-elevated">
            <Banknote className="h-4 w-4 mr-2" /> Generate withdrawal token
          </Button>
        </div>
      ) : (
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

          <Button onClick={() => { setToken(null); setAmount(0); }} variant="outline" className="w-full h-12 rounded-xl font-semibold">
            Generate another
          </Button>
        </div>
      )}
    </div>
  );
}
