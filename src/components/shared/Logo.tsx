
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  theme: 'light' | 'dark';
}

const logoLightUrl = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogodia.png?alt=media&token=fc619841-d174-41ce-a613-3cb94cec8194";
const logoDarkUrl = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogonoche.png?alt=media&token=0ab973fd-2ec0-44a3-aef0-82850db98096";

// Use dimensions that reflect the intrinsic aspect ratio of your image files.
// For example, if your logo is 200px wide and 50px high (4:1 aspect ratio).
const LOGO_INTRINSIC_WIDTH = 200; // Example intrinsic width
const LOGO_INTRINSIC_HEIGHT = 50;  // Example intrinsic height (maintaining 4:1 ratio)

export function Logo({ className, theme }: LogoProps) {
  const currentLogoUrl = theme === 'light' ? logoLightUrl : logoDarkUrl;

  return (
    <Link href="/" className={cn("inline-flex items-end gap-2", className)}>
      {/* The Image component will be sized by its width/height props,
          and then CSS (h-7 w-auto) makes it responsive while maintaining aspect ratio. */}
      <Image
        src={currentLogoUrl}
        alt="WikiStars5 Logo"
        width={LOGO_INTRINSIC_WIDTH}
        height={LOGO_INTRINSIC_HEIGHT}
        className="h-7 w-auto object-contain" // h-7 sets height to 28px, w-auto adjusts width.
        priority
        data-ai-hint="logo brand"
      />
      <span className="text-xl font-bold font-headline text-primary">
        WikiStars5
      </span>
    </Link>
  );
}
