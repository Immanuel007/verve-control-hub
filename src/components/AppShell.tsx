import { Outlet, Navigate } from 'react-router-dom';
import { useApp } from '@/store/app-store';
import { BottomNav } from '@/components/BottomNav';

export function AppShell() {
  const { isAuthed } = useApp();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return (
    <div className="app-frame pb-32">
      <Outlet />
      <BottomNav />
    </div>
  );
}
