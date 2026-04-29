import { Navigate } from 'react-router-dom';
import { useApp } from '@/store/app-store';

const Index = () => {
  const { isAuthed } = useApp();
  return <Navigate to={isAuthed ? '/app' : '/login'} replace />;
};

export default Index;
