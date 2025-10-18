import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

const logoLightUrl = "/logo/logodia.png";
const logoDarkUrl = "/logo/logonoche.png";

const LOGO_INTRINSIC_WIDTH = 200;
const LOGO_INTRINSIC_HEIGHT = 50;

export function Logo({ className }: LogoProps) {
  // By rendering both logos and using CSS to toggle them, we avoid hydration mismatches.
  // The server and client will render the exact same HTML structure.
  return (
    <Link href="/" className={cn("inline-flex items-end gap-2", className)}>
      <Image
        src={logoDarkUrl}
        alt="WikiStars5 Logo"
        width={LOGO_INTRINSIC_WIDTH}
        height={LOGO_INTRINSIC_HEIGHT}
        className="h-7 w-auto object-contain hidden dark:block"
        priority
        data-ai-hint="logo brand dark"
      />
      <Image
        src={logoLightUrl}
        alt="WikiStars5 Logo"
        width={LOGO_INTRINSIC_WIDTH}
        height={LOGO_INTRINSIC_HEIGHT}
        className="h-7 w-auto object-contain block dark:hidden"
        priority
        data-ai-hint="logo brand light"
      />
      <span className="text-xl font-bold font-headline text-primary">
        WikiStars5
      </span>
    </Link>
  );
}
