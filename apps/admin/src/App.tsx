import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { restore } from './lib/api';
import { useAdminUser } from './lib/use-auth';
import { AnalyticsPage } from './pages/Analytics';
import { AuditLogPage } from './pages/AuditLog';
import { LoginPage } from './pages/Login';
import { OverviewPage } from './pages/Overview';
import { StudentsPage } from './pages/Students';
import { SupportPage } from './pages/Support';
import { WellnessPage } from './pages/Wellness';

export function App() {
  const user = useAdminUser();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void restore().finally(() => setReady(true));
  }, []);

  if (!ready) return <div className="grid h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (!user || user.role === 'STUDENT') return <LoginPage />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<OverviewPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="wellness" element={<WellnessPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="audit" element={<AuditLogPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
