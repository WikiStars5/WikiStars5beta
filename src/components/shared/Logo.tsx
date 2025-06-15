
import Link from 'next/link';
import { Sparkles } from 'lucide-react'; // Using a different icon for WikiStars5

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      {/* A simple, abstract representation for WikiStars5. Could be replaced with a more custom SVG. */}
      <div className="p-1 rounded-md bg-primary text-primary-foreground">
        <Sparkles className="h-6 w-6" />
      </div>
      <span className="text-2xl font-bold font-headline text-primary">
        WikiStars5
      </span>
    </Link>
  );
}
