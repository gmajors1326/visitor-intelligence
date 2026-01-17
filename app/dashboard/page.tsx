import Dashboard from '@/components/Dashboard';
import Navigation from '@/components/Navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <>
      <Navigation />
      <Dashboard />
    </>
  );
}
