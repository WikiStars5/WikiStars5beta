
"use client"; // Required if we use hooks like useEffect, but for simple prop drilling it might not be if Image is optimized. Let's make it client for theme prop.

import Link from 'next/link';
import Image from 'next/image'; // Import next/image

interface LogoProps {
  className?: string;
  theme: 'light' | 'dark'; // Add theme prop
}

const logoLightUrl = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.appspot.com/o/logo%2Flogodia.png?alt=media";
const logoDarkUrl = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.appspot.com/o/logo%2Flogonoche.png?alt=media";

export function Logo({ className, theme }: LogoProps) {
  const currentLogoUrl = theme === 'light' ? logoLightUrl : logoDarkUrl;

  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative h-7 w-auto" style={{ minWidth: '28px' }}> {/* Adjust width as needed, ensure minWidth for small logos */}
        <Image
          src={currentLogoUrl}
          alt="WikiStars5 Logo"
          height={28} // Corresponds to h-7 tailwind class (1.75rem = 28px)
          width={112} // Assuming a 4:1 aspect ratio, adjust if different. e.g. 28*4 = 112
          className="object-contain" // Ensures the image scales within the bounds
          priority // Logo is important, consider priority loading
          data-ai-hint="logo brand"
        />
      </div>
      <span className="text-2xl font-bold font-headline text-primary">
        WikiStars5
      </span>
    </Link>
  );
}
