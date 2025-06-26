import { getAdminFiguresList } from "@/lib/placeholder-data";
import AdminFiguresPageClient from "@/app/admin/figures/AdminFiguresPageClient";

export const revalidate = 0;

interface AdminFiguresPageProps {
  searchParams?: {
    startAfter?: string;
    endBefore?: string;
  };
}

export default async function AdminFiguresPage({ searchParams }: AdminFiguresPageProps) {
  const { figures, hasPrevPage, hasNextPage, startCursor, endCursor } = await getAdminFiguresList({
    startAfter: searchParams?.startAfter,
    endBefore: searchParams?.endBefore,
  });

  return (
    <AdminFiguresPageClient 
      initialFigures={figures} 
      hasPrevPage={hasPrevPage}
      hasNextPage={hasNextPage}
      startCursor={startCursor}
      endCursor={endCursor}
    />
  );
}
