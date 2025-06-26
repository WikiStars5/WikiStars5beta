
import { redirect } from 'next/navigation';

export default function RootPage() {
  // The primary page is now /home, so we redirect the root to it.
  redirect('/home');
}
