import { lazy, Suspense, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'));
const AgentsPage = lazy(() => import('@/pages/AgentsPage'));
const KanbanPage = lazy(() => import('@/pages/KanbanPage'));
const TaskDetailPage = lazy(() => import('@/pages/TaskDetailPage'));
const MyTasksPage = lazy(() => import('@/pages/MyTasksPage'));
const ApprovalsPage = lazy(() => import('@/pages/ApprovalsPage'));
const TimelinePage = lazy(() => import('@/pages/TimelinePage'));

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Skeleton className="h-40 w-80" />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Fallback />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="proyectos" element={<ProjectsPage />} />
              <Route path="proyectos/:slug" element={<ProjectDetailPage />} />
              <Route path="agentes" element={<AgentsPage />} />
              <Route path="tareas" element={<KanbanPage />} />
              <Route path="tareas/:id" element={<TaskDetailPage />} />
              <Route path="mis-tareas" element={<MyTasksPage />} />
              <Route path="aprobaciones" element={<ApprovalsPage />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="admin" element={<ProjectsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
}
