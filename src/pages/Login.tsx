import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Fingerprint, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/store/app-store';
import { toast } from '@/hooks/use-toast';
import { loginSchema } from '@/lib/validation';

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const prefilled = (loc.state as { email?: string } | null)?.email ?? '';
  const { login, loginBiometric } = useApp();
  const [email, setEmail] = useState(prefilled);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors({ email: fe.email?.[0], password: fe.password?.[0] });
      return;
    }
    setErrors({});
    setLoading(true);
    const r = await login(parsed.data.email, parsed.data.password);
    setLoading(false);
    if (!r.ok) { toast({ title: 'Sign in failed', description: r.error, variant: 'destructive' }); return; }
    if (r.twoFactor) { toast({ title: '2FA required', description: 'Two-factor authentication is enabled on this account.' }); return; }
    nav('/app', { replace: true });
  };

  const onBio = async () => {
    setBioLoading(true);
    const r = await loginBiometric();
    setBioLoading(false);
    if (!r.ok) { toast({ title: 'Biometrics unavailable', description: r.error, variant: 'destructive' }); return; }
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              type="email"
              className="mt-2 h-12 rounded-xl bg-muted/50 border-border"
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
            <div className="relative mt-2">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-12 rounded-xl bg-muted/50 border-border pr-11"
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
            <Link to="/forgot-pin" className="block mt-2 text-xs text-primary font-semibold">Forgot password?</Link>
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
            Use your Verve account email & password. Biometrics work after your first successful sign in on this device.
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          New to Verve? <Link to="/register" className="text-primary font-semibold">Create account</Link>
        </p>
      </div>
    </div>
  );
}
