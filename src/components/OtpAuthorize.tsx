import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Shield, Loader2, RefreshCw, Smartphone, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export type OtpResult = 'success' | 'failed';

interface OtpAuthorizeProps {
  open: boolean;
  phone: string;            // primary phone the OTP is sent to
  amount?: number;
  merchant?: string;        // what we're authorizing (e.g. "Till 5678 · KES 1,200")
  onClose: () => void;
  onComplete: (result: OtpResult, ref?: string) => void;
  /** When true, simulate auto-detection from same-device SMS (Web OTP API fallback). Defaults true. */
  autoFill?: boolean;
}

const OTP_LEN = 6;
const RESEND_SECONDS = 30;

/**
 * 6-digit OTP authorization sheet.
 * - Sends OTP to the user's primary phone (mocked).
 * - Auto-fills if the device receives the SMS (uses WebOTP API where available, otherwise simulates).
 * - Verifies and shows a success/failure confirmation page.
 */
export function OtpAuthorize({ open, phone, amount, merchant, onClose, onComplete, autoFill = true }: OtpAuthorizeProps) {
  const [stage, setStage] = useState<'sending' | 'enter' | 'verifying' | 'success' | 'failed'>('sending');
  const [code, setCode] = useState('');
  const [expected, setExpected] = useState('');
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [autoFilled, setAutoFilled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset & "send" the OTP whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    setStage('sending');
    setCode('');
    setAutoFilled(false);
    setErrorMsg(null);
    setRef(null);
    setResendIn(RESEND_SECONDS);

    const generated = Array.from({ length: OTP_LEN }, () => Math.floor(Math.random() * 10)).join('');
    setExpected(generated);

    const sendT = setTimeout(() => {
      setStage('enter');
      // For demo / mock data — surface the OTP so it can be tested.
      toast({
        title: `OTP sent to ${maskPhone(phone)}`,
        description: `Demo code: ${generated} (auto-fills if SMS arrives on this device)`,
      });
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 50);
    }, 700);

    return () => clearTimeout(sendT);
  }, [open, phone]);

  // Resend countdown
  useEffect(() => {
    if (stage !== 'enter') return;
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [stage, resendIn]);

  // Web OTP API auto-fill (Chrome on Android). Falls back to a simulated auto-fill after ~3.5s for demo.
  useEffect(() => {
    if (!open || stage !== 'enter' || !autoFill) return;

    let simT: number | undefined;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    if ('OTPCredential' in window && navigator.credentials?.get) {
      (navigator.credentials as any)
        .get({ otp: { transport: ['sms'] }, signal: ac.signal })
        .then((cred: any) => {
          if (cred?.code) {
            setCode(cred.code.slice(0, OTP_LEN));
            setAutoFilled(true);
          }
        })
        .catch(() => { /* user dismissed or unsupported */ });
    } else {
      // Simulated auto-fill so the "same device" experience is demoable on desktop.
      simT = window.setTimeout(() => {
        setCode(expected);
        setAutoFilled(true);
      }, 3500);
    }

    return () => {
      ac.abort();
      if (simT) window.clearTimeout(simT);
    };
  }, [open, stage, autoFill, expected]);

  // Auto-submit when full
  useEffect(() => {
    if (stage !== 'enter') return;
    if (code.length === OTP_LEN) verify(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, stage]);

  const verify = (value: string) => {
    setStage('verifying');
    setTimeout(() => {
      if (value === expected) {
        const r = 'AUTH' + Date.now().toString().slice(-7);
        setRef(r);
        setStage('success');
        // Brief celebration before notifying parent
        setTimeout(() => onComplete('success', r), 900);
      } else {
        setErrorMsg('Incorrect code. Please try again.');
        setStage('failed');
      }
    }, 800);
  };

  const resend = () => {
    if (resendIn > 0) return;
    const generated = Array.from({ length: OTP_LEN }, () => Math.floor(Math.random() * 10)).join('');
    setExpected(generated);
    setCode('');
    setAutoFilled(false);
    setErrorMsg(null);
    setResendIn(RESEND_SECONDS);
    toast({ title: 'New OTP sent', description: `Demo code: ${generated}` });
  };

  const tryAgain = () => {
    setStage('enter');
    setCode('');
    setErrorMsg(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const failAndClose = () => {
    onComplete('failed');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border/60 shadow-elevated overflow-hidden animate-slide-in-bottom">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
          <span className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center">
            <Shield className="h-5 w-5 text-primary" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-base leading-tight">Authorize payment</p>
            <p className="text-[11px] text-muted-foreground truncate">{merchant ?? 'Confirm to continue'}</p>
          </div>
          {(stage === 'enter' || stage === 'sending') && (
            <button onClick={onClose} aria-label="Cancel" className="h-9 w-9 rounded-full grid place-items-center hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="h-px bg-border/60" />

        {/* Body */}
        <div className="px-5 py-6 min-h-[280px]">
          {stage === 'sending' && (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="mt-4 text-sm font-semibold">Sending OTP…</p>
              <p className="text-xs text-muted-foreground mt-1">to {maskPhone(phone)}</p>
            </div>
          )}

          {stage === 'enter' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Code sent to <span className="font-mono-num text-foreground font-semibold">{maskPhone(phone)}</span></span>
              </div>

              <Input
                ref={inputRef}
                value={code}
                onChange={(e) => { setAutoFilled(false); setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LEN)); }}
                placeholder="••••••"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_LEN}
                className={cn(
                  'h-14 rounded-2xl text-center font-mono-num text-2xl tracking-[0.6em] bg-muted/50 border-border',
                  autoFilled && 'border-primary bg-primary/5'
                )}
              />

              {autoFilled && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs animate-fade-in">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="font-semibold">Auto-filled from this device</span>
                </div>
              )}

              {amount !== undefined && amount > 0 && (
                <div className="rounded-xl bg-muted/50 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">You authorize</span>
                  <span className="font-mono-num font-bold text-sm">KES {amount.toLocaleString()}</span>
                </div>
              )}

              <button
                onClick={resend}
                disabled={resendIn > 0}
                className="w-full text-xs text-muted-foreground hover:text-foreground disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-3 w-3" />
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
              </button>
            </div>
          )}

          {stage === 'verifying' && (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="mt-4 text-sm font-semibold">Verifying…</p>
              <p className="text-xs text-muted-foreground mt-1">Authorising with Interswitch</p>
            </div>
          )}

          {stage === 'success' && (
            <div className="flex flex-col items-center justify-center text-center py-4 animate-fade-in">
              <div className="h-16 w-16 rounded-full bg-success/15 grid place-items-center">
                <Check className="h-8 w-8 text-success" strokeWidth={3} />
              </div>
              <p className="mt-4 font-display font-bold text-lg">Authorized</p>
              <p className="text-xs text-muted-foreground mt-1">Processing your payment…</p>
              {ref && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Auth ref</span>
                  <span className="text-xs font-mono-num font-semibold">{ref}</span>
                </div>
              )}
            </div>
          )}

          {stage === 'failed' && (
            <div className="flex flex-col items-center justify-center text-center py-4 animate-fade-in">
              <div className="h-16 w-16 rounded-full bg-destructive/15 grid place-items-center">
                <X className="h-8 w-8 text-destructive" strokeWidth={3} />
              </div>
              <p className="mt-4 font-display font-bold text-lg">Authorization failed</p>
              <p className="text-xs text-muted-foreground mt-1">{errorMsg ?? 'We could not verify your code.'}</p>
              <div className="mt-5 grid grid-cols-2 gap-2 w-full">
                <Button variant="outline" onClick={failAndClose} className="h-11 rounded-xl font-semibold">Cancel</Button>
                <Button onClick={tryAgain} className="h-11 rounded-xl bg-gradient-primary font-semibold">Try again</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function maskPhone(p: string) {
  const digits = p.replace(/\D/g, '');
  if (digits.length < 4) return p;
  const last = digits.slice(-3);
  const head = p.startsWith('+') ? '+' + digits.slice(0, digits.length - 6) : digits.slice(0, digits.length - 6);
  return `${head} •• ${last}`;
}
