
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import AdminFiguresPageClient from "./AdminFiguresPageClient"; // Usará el nuevo cliente no localizado

export const revalidate = 0;

export default async function AdminFiguresPage() {
  const figures = await getAllFiguresFromFirestore();
  return <AdminFiguresPageClient initialFigures={figures} />;
}
