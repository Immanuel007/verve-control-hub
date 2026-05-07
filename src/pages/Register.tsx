import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScreenHeader } from '@/components/ScreenHeader';
import { toast } from '@/hooks/use-toast';
import { signupSchema } from '@/lib/validation';
import { useApp } from '@/store/app-store';

type FieldErrors = Partial<Record<'firstName' | 'lastName' | 'phoneNumber' | 'email' | 'password' | 'confirmPassword', string>>;

const FIELDS: { key: keyof FieldErrors; label: string; type?: string; placeholder?: string; autoComplete?: string }[] = [
  { key: 'firstName', label: 'First name', autoComplete: 'given-name' },
  { key: 'lastName', label: 'Last name', autoComplete: 'family-name' },
  { key: 'phoneNumber', label: 'Phone number', type: 'tel', placeholder: '+254712345678', autoComplete: 'tel' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
];

export default function Register() {
  const nav = useNavigate();
  const { register } = useApp();
  const [form, setForm] = useState({
    firstName: '', lastName: '', phoneNumber: '', email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors({
        firstName: fe.firstName?.[0],
        lastName: fe.lastName?.[0],
        phoneNumber: fe.phoneNumber?.[0],
        email: fe.email?.[0],
        password: fe.password?.[0],
        confirmPassword: fe.confirmPassword?.[0],
      });
      return;
    }
    setErrors({});
    setLoading(true);
    const r = await register(parsed.data as Parameters<typeof register>[0]);
    setLoading(false);
    if (!r.ok) { toast({ title: 'Sign up failed', description: r.error, variant: 'destructive' }); return; }
    nav('/verify-email', { state: { email: r.email ?? parsed.data.email } });
  };

  return (
    <div className="app-frame">
      <ScreenHeader back title="Create account" subtitle="It only takes a minute" />
      <form onSubmit={submit} className="px-6 py-6 space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</label>
            <Input
              value={form[f.key] as string}
              onChange={(e) => set(f.key, e.target.value)}
              type={f.type ?? 'text'}
              placeholder={f.placeholder}
              autoComplete={f.autoComplete}
              className="mt-2 h-12 rounded-xl bg-muted/50 border-border"
            />
            {errors[f.key] && <p className="mt-1 text-xs text-destructive">{errors[f.key]}</p>}
          </div>
        ))}

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
          <div className="relative mt-2">
            <Input
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="h-12 rounded-xl bg-muted/50 border-border pr-11"
            />
            <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password">
              {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm password</label>
          <Input
            value={form.confirmPassword}
            onChange={(e) => set('confirmPassword', e.target.value)}
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            className="mt-2 h-12 rounded-xl bg-muted/50 border-border"
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-primary mt-4 font-semibold">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create account'}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account? <Link to="/login" className="text-primary font-semibold">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
