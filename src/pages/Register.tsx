import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScreenHeader } from '@/components/ScreenHeader';
import { toast } from '@/hooks/use-toast';

export default function Register() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', email: '', idNumber: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const next = async () => {
    if (step === 1) {
      if (!form.name || !form.phone || !form.email || !form.idNumber) {
        toast({ title: 'Fill in all fields', variant: 'destructive' }); return;
      }
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setLoading(false);
      setStep(2);
      toast({ title: 'OTP sent', description: 'Use 123456 for the demo.' });
    } else {
      if (otp !== '123456') { toast({ title: 'Invalid OTP', description: 'Demo code is 123456', variant: 'destructive' }); return; }
      setLoading(true);
      await new Promise((r) => setTimeout(r, 500));
      setLoading(false);
      toast({ title: 'Account ready 🎉', description: 'Sign in to continue.' });
      nav('/login');
    }
  };

  return (
    <div className="app-frame">
      <ScreenHeader back title="Create account" subtitle={step === 1 ? 'Step 1 of 2 — your details' : 'Step 2 of 2 — verify phone'} />
      <div className="px-6 py-6 space-y-4">
        {step === 1 ? (
          <>
            {(['name', 'phone', 'email', 'idNumber'] as const).map((k) => (
              <div key={k}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {k === 'idNumber' ? 'National ID' : k === 'name' ? 'Full Name' : k}
                </label>
                <Input
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-2 h-12 rounded-xl bg-muted/50 border-border"
                  placeholder={k === 'phone' ? '+254712345678' : k === 'email' ? 'you@example.com' : ''}
                />
              </div>
            ))}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to {form.phone || 'your phone'}.</p>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="• • • • • •"
              className="h-14 rounded-xl bg-muted/50 border-border text-center font-mono-num text-2xl tracking-[0.6em]"
            />
            <button onClick={() => toast({ title: 'OTP resent', description: '123456' })} className="text-xs text-primary font-semibold">Resend code</button>
          </>
        )}

        <Button onClick={next} disabled={loading} className="w-full h-12 rounded-xl bg-gradient-primary mt-4 font-semibold">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : step === 1 ? 'Send OTP' : 'Verify & Continue'}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account? <Link to="/login" className="text-primary font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
