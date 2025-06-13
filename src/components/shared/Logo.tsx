import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <Sparkles className="h-7 w-7 text-primary" />
      <span className="text-2xl font-bold font-headline text-primary">
        StarSage
      </span>
    </Link>
  );
}
