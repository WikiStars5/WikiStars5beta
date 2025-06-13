import { Header } from '@/components/layout/Header'; // Or a dedicated AdminHeader
import { Footer } from '@/components/layout/Footer';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add auth check here in real app: if not admin, redirect or show error
  // const user = await getCurrentUser(); // Simulated
  // if (!user?.isAdmin) { return <p>Access Denied</p> }

  return (
    <div className="flex flex-col min-h-screen">
      <Header /> 
      <main className="flex-grow container max-w-screen-2xl py-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline">Admin Panel</h1>
          </div>
          <nav className="flex gap-2">
            <Button variant="outline" asChild><Link href="/admin">Dashboard</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/figures">Manage Figures</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/users">Manage Users</Link></Button>
          </nav>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}
