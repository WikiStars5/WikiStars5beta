import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

const logoUrl = "/logo/logodia.png";

const LOGO_INTRINSIC_WIDTH = 200;
const LOGO_INTRINSIC_HEIGHT = 50;

export function Logo({ className }: LogoProps) {
  // Always render the same logo, theme is handled by globals.css or other means
  // Dark mode image logic removed for simplicity and to avoid hydration errors.
  return (
    <Link href="/" className={cn("inline-flex items-end gap-2", className)}>
      <Image
        src={logoUrl}
        alt="WikiStars5 Logo"
        width={LOGO_INTRINSIC_WIDTH}
        height={LOGO_INTRINSIC_HEIGHT}
        className="h-7 w-auto object-contain"
        priority
        data-ai-hint="logo brand"
      />
      <span className="text-xl font-bold font-headline text-primary">
        WikiStars5
      </span>
    </Link>
  );
}
