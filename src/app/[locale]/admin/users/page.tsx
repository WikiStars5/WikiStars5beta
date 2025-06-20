
import { getAllUsersFromFirestore } from "@/lib/userData";
import AdminUsersPageClient from "@/components/admin/AdminUsersPageClient";

export const revalidate = 0;

export default async function AdminLocaleUsersPage() {
  const users = await getAllUsersFromFirestore();
  return <AdminUsersPageClient initialUsers={users} />;
}
