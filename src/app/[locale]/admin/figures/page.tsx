
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import AdminFiguresPageClient from "./AdminFiguresPageClient"; // Path to the new client component

export const revalidate = 0;

export default async function AdminFiguresPageServer() {
  const figures = await getAllFiguresFromFirestore();
  return <AdminFiguresPageClient initialFigures={figures} />;
}
