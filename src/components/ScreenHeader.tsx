import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Props {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  className?: string;
}

export function ScreenHeader({ title, subtitle, back, right, className }: Props) {
  const nav = useNavigate();
  return (
    <header className={cn('safe-top sticky top-0 z-30 px-5 pt-3 pb-3 flex items-center gap-3 bg-background/80 backdrop-blur-xl border-b border-border/40', className)}>
      {back && (
        <button
          onClick={() => nav(-1)}
          className="-ml-2 h-9 w-9 grid place-items-center rounded-full hover:bg-muted active:scale-95 transition"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {title && <h1 className="font-display font-bold text-lg leading-tight truncate">{title}</h1>}
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
