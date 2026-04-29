import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Fingerprint, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/store/app-store';
import { toast } from '@/hooks/use-toast';

export default function Login() {
  const nav = useNavigate();
  const { login, loginBiometric } = useApp();
  const [identifier, setIdentifier] = useState('+254712345678');
  const [pin, setPin] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) { toast({ title: 'Enter your 4-digit PIN', variant: 'destructive' }); return; }
    setLoading(true);
    const r = await login(identifier, pin);
    setLoading(false);
    if (!r.ok) { toast({ title: 'Login failed', description: r.error, variant: 'destructive' }); return; }
    nav('/app', { replace: true });
  };

  const onBio = async () => {
    setBioLoading(true);
    await loginBiometric();
    setBioLoading(false);
    toast({ title: 'Welcome back', description: 'Authenticated with biometrics.' });
    nav('/app', { replace: true });
  };

  return (
    <div className="app-frame">
      <div className="px-6 pt-16 pb-8 safe-top">
        <div className="flex items-center gap-2 mb-10">
          <div className="h-10 w-10 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground font-display font-bold text-lg shadow-elevated">V</div>
          <div>
            <p className="font-display font-bold text-lg leading-none">Verve</p>
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Powered by Interswitch</p>
          </div>
        </div>

        <h1 className="font-display text-3xl font-bold leading-tight">Welcome back<span className="text-primary">.</span></h1>
        <p className="text-muted-foreground mt-2">Sign in to your financial control center.</p>

        <form onSubmit={onSubmit} className="mt-10 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone or Email</label>
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="+254 712 345 678"
              autoComplete="username"
              className="mt-2 h-12 rounded-xl bg-muted/50 border-border"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">PIN</label>
            <div className="relative mt-2">
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                type={show ? 'text' : 'password'}
                inputMode="numeric"
                placeholder="••••"
                className="h-12 rounded-xl bg-muted/50 border-border pr-11 font-mono-num text-lg tracking-[0.4em]"
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle PIN visibility">
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <Link to="/forgot-pin" className="block mt-2 text-xs text-primary font-semibold">Forgot PIN?</Link>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-primary shadow-elevated hover:opacity-95 font-semibold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
          </Button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={onBio}
            disabled={bioLoading}
            className="w-full h-12 rounded-xl border border-border bg-card hover:bg-muted/60 transition flex items-center justify-center gap-2 font-semibold"
          >
            {bioLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Fingerprint className="h-5 w-5 text-primary" /> Sign in with biometrics</>}
          </button>
        </form>

        <div className="mt-8 flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border/60">
          <ShieldCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Demo:</span> phone <span className="font-mono-num">+254712345678</span> · PIN <span className="font-mono-num">1234</span>. Or tap biometrics to skip.
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          New to Verve? <Link to="/register" className="text-primary font-semibold">Create account</Link>
        </p>
      </div>
    </div>
  );
}
