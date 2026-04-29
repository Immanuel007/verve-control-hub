export const KES = (n: number, opts: { signed?: boolean; compact?: boolean } = {}) => {
  const abs = Math.abs(n);
  const formatter = new Intl.NumberFormat('en-KE', {
    style: 'decimal',
    minimumFractionDigits: opts.compact && abs >= 10000 ? 0 : 2,
    maximumFractionDigits: opts.compact && abs >= 10000 ? 0 : 2,
  });
  const sign = opts.signed ? (n < 0 ? '−' : '+') : n < 0 ? '−' : '';
  return `${sign}KES ${formatter.format(abs)}`;
};

export const maskPan = (pan: string) => {
  const digits = pan.replace(/\s+/g, '');
  const last4 = digits.slice(-4);
  return `•••• •••• •••• ${last4}`;
};

export const formatRelative = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
