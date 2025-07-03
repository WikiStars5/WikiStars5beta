import AdminFiguresPageClient from "@/app/admin/figures/AdminFiguresPageClient";
import { Suspense } from 'react';

export const revalidate = 0;

// The page remains a Server Component for now, but wraps the client component in Suspense
// to handle the search params. The client component will read the params itself.
export default function AdminFiguresPage() {
  return (
    // Suspense is good practice when a child component uses useSearchParams
    <Suspense>
      <AdminFiguresPageClient />
    </Suspense>
  );
}
