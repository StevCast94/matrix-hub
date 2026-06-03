import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui';

// Fase 0: una sola página. Lazy para preparar el patrón de Fase 1+.
const LoginPage = lazy(() => import('@/pages/LoginPage'));

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-matrix-primary">
      <Skeleton className="h-40 w-80" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
}
