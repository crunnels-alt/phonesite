import PhoneNavigationMonitor from '@/components/PhoneStateMonitor';
import AdminPanel from '@/components/AdminPanel';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PhoneNavigationMonitor />
      <AdminPanel />
    </div>
  );
}
