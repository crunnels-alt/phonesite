import { PhoneNavigator } from '@/components/site/PhoneNavigator';
import { SiteNav } from '@/components/site/SiteNav';

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      <SiteNav />
      {children}
      <PhoneNavigator />
    </div>
  );
}
