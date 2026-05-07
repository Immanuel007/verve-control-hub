import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { toast } from '@/hooks/use-toast';
import { authApi } from '@/lib/auth-api';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}${'•'.repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export default function VerifyEmail() {
  const nav = useNavigate();
  const loc = useLocation();
  const [params] = useSearchParams();
  const email =
    (loc.state as { email?: string } | null)?.email ??
    params.get('email') ??
    '';

  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onResend = async () => {
    if (!email) return;
    setResending(true);
    await authApi.resendVerification(email);
    setResending(false);
    setCooldown(60);
    toast({ title: 'Verification email sent', description: `We re-sent the link to ${maskEmail(email)}.` });
  };

  return (
    <div className="app-frame">
      <ScreenHeader back title="Verify your email" />
      <div className="px-6 py-10 flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-3xl bg-gradient-primary grid place-items-center shadow-elevated mb-6">
          <Mail className="h-9 w-9 text-primary-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold">Check your inbox</h1>
        <p className="text-muted-foreground mt-3 max-w-sm">
          We've sent a verification link to{' '}
          <span className="font-semibold text-foreground">{email ? maskEmail(email) : 'your email'}</span>.
          Open it to activate your account, then return here to sign in.
        </p>

        <div className="mt-8 w-full space-y-3">
          <Button
            onClick={() => nav('/login', { state: { email } })}
            className="w-full h-12 rounded-xl bg-gradient-primary font-semibold"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" /> I've verified, sign in
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={resending || cooldown > 0 || !email}
            onClick={onResend}
            className="w-full h-12 rounded-xl"
          >
            {resending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              'Resend email'
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Didn't get it? Check your spam folder or try a different email.
        </p>
      </div>
    </div>
  );
}
