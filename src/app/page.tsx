import { redirect } from 'next/navigation';

export default function RootPageRedirect() {
  redirect('/home');
  return null; 
}
