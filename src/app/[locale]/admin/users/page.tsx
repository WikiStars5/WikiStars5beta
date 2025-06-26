
import { redirect } from 'next/navigation';

// This page permanently redirects to the non-i18n version of the route.
export default function Page() {
  redirect('/admin/users');
}
