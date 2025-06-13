import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/home');
  // This component will likely not render anything as redirect happens server-side.
  return null;
}
