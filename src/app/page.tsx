import { Dashboard } from '@/components/dashboard';
import { Header } from '@/components/layout/header';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
        <Dashboard />
      </main>
    </div>
  );
}
