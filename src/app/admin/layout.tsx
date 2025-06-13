import { Header } from '@/components/layout/Header'; // Or a dedicated AdminHeader
import { Footer } from '@/components/layout/Footer';
import { ShieldCheck, MessageSquareWarning } from 'lucide-react'; // Added MessageSquareWarning
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { mockUser } from '@/lib/types';
import { redirect } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (mockUser?.id !== 'user123') {
    redirect('/');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header /> 
      <main className="flex-grow container max-w-screen-2xl py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline">Admin Panel</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/admin">Dashboard</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/figures">Manage Figures</Link></Button>
            <Button variant="outline" asChild>
              <Link href="/admin/comments">
                <MessageSquareWarning className="mr-2 h-4 w-4" /> Moderate Comments
              </Link>
            </Button>
            <Button variant="outline" disabled asChild><Link href="/admin/users">Manage Users</Link></Button>
          </nav>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}
